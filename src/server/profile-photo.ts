import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { currentSessionPrincipal, type SessionPrincipal } from '../lib/auth.ts';
import { isSameOrigin } from '../lib/origin.ts';
import type { ObjectManifest } from '../lib/job-contracts.ts';
import { configuredStores, hash, type MetadataStore, type ObjectStore } from './jobs/storage.ts';

export const PHOTO_LIMIT = 2 * 1024 * 1024;
const photoPath = 'portfolio/profilePhoto';
const cleanupPath = 'profilePhotoCleanup';
interface Photo { content: ObjectManifest; updatedAt: string; uploadedBy: string }
interface Stores { db: MetadataStore; objects: ObjectStore }
interface Dependencies {
  principal(request: Request): Promise<SessionPrincipal | null>;
  stores(): Promise<Stores>;
  fallback(): Promise<Uint8Array | null>;
}
class PhotoError extends Error { readonly status: number; constructor(message: string, status: number) { super(message); this.status = status; } }
const settings = (photo: Photo | null) => ({ revision: photo?.content.hash ?? 'none', url: photo ? `/api/profile-photo?v=${photo.content.hash}` : '/api/profile-photo', updatedAt: photo?.updatedAt ?? null });
const privateJson = (value: unknown, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie', 'X-Content-Type-Options': 'nosniff' } });

// Parse the bounded JPEG frame header; SVG and arbitrary MIME-labelled files are rejected.
export function validatePhoto(bytes: Uint8Array) {
  if (bytes.length > PHOTO_LIMIT) throw new PhotoError('The prepared photo must be smaller than 2 MB.', 413);
  if (bytes.length < 20 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes.at(-2) !== 0xff || bytes.at(-1) !== 0xd9) throw new PhotoError('Choose a valid JPEG photo.', 400);
  let offset = 2;
  while (offset + 4 < bytes.length) {
    if (bytes[offset++] !== 0xff) break;
    while (bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++];
    if (marker === 0xda || marker === 0xd9) break;
    const length = (bytes[offset] << 8) | bytes[offset + 1];
    if (length < 2 || offset + length > bytes.length) break;
    if ([0xc0, 0xc1, 0xc2].includes(marker) && length >= 8) {
      const height = (bytes[offset + 3] << 8) | bytes[offset + 4];
      const width = (bytes[offset + 5] << 8) | bytes[offset + 6];
      if (!width || !height || width > 2048 || height > 2048) throw new PhotoError('The photo must be at most 2048 pixels on each side.', 400);
      return { width, height };
    }
    offset += length;
  }
  throw new PhotoError('Choose a valid JPEG photo.', 400);
}
async function photoBytes(request: Request) {
  if (!/^image\/jpeg(?:;|$)/i.test(request.headers.get('content-type') ?? '')) throw new PhotoError('Upload a JPEG photo.', 415);
  if (Number(request.headers.get('content-length')) > PHOTO_LIMIT) throw new PhotoError('The prepared photo must be smaller than 2 MB.', 413);
  const reader = request.body?.getReader();
  if (!reader) throw new PhotoError('Choose a photo first.', 400);
  const chunks: Uint8Array[] = []; let size = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > PHOTO_LIMIT) { await reader.cancel(); throw new PhotoError('The prepared photo must be smaller than 2 MB.', 413); }
    chunks.push(value);
  }
  const bytes = Buffer.concat(chunks); validatePhoto(bytes); return bytes;
}
async function cleanRetired(stores: Stores) {
  for (const item of await stores.db.list<{ id: string; content: ObjectManifest }>(cleanupPath, 10)) {
    if ((await stores.db.get<Photo>(photoPath))?.content.path === item.content.path) continue;
    try { await stores.objects.delete(item.content); await stores.db.transaction(async tx => { tx.delete(`${cleanupPath}/${item.id}`); }); }
    catch { /* Keep the receipt for the next owner upload/settings request. */ }
  }
}
async function savePhoto(stores: Stores, owner: SessionPrincipal, expected: string, bytes: Uint8Array) {
  const content = await stores.objects.put(`profile-photos/${owner.uid}/${randomUUID()}.jpg`, bytes, 'image/jpeg');
  const photo: Photo = { content, uploadedBy: owner.uid, updatedAt: new Date().toISOString() };
  const cleanupId = randomUUID();
  let saved: Photo;
  try {
    saved = await stores.db.transaction(async tx => {
      const current = await tx.get<Photo>(photoPath);
      if ((current?.content.hash ?? 'none') !== expected) throw new PhotoError('Your photo changed in another tab. Reload the saved photo before replacing it.', 409);
      if (current?.content.hash === content.hash) return current;
      tx.set(photoPath, photo);
      if (current) tx.set(`${cleanupPath}/${cleanupId}`, { id: cleanupId, content: current.content });
      return photo;
    });
  } catch (error) {
    // Reconcile a lost commit acknowledgement before deleting any staged bytes.
    const current = await stores.db.get<Photo>(photoPath);
    if (current?.content.path === content.path) return current;
    try { await stores.objects.delete(content); } catch { /* Do not hide the original error. */ }
    throw error;
  }
  if (saved.content.path !== content.path) await stores.objects.delete(content);
  try { await cleanRetired(stores); } catch { /* The new photo is already committed. */ }
  return saved;
}
async function bundledPhoto() {
  for (const path of [join(process.cwd(), 'dist/profile-photo.jpg'), join(process.cwd(), 'public/profile-photo.jpg')]) {
    try { return await readFile(path); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  }
  return null;
}
export async function profilePhotoRoute(request: Request, dependencies: Dependencies = { principal: currentSessionPrincipal, stores: configuredStores, fallback: bundledPhoto }): Promise<Response> {
  try {
    const url = new URL(request.url);
    if (url.pathname === '/api/profile-photo' && ['GET', 'HEAD'].includes(request.method)) {
      let bytes: Uint8Array | null = null;
      try {
        const stores = await dependencies.stores(); const photo = await stores.db.get<Photo>(photoPath);
        if (photo) bytes = await stores.objects.read(photo.content, PHOTO_LIMIT);
      } catch { /* The approved bundled portrait keeps the public portfolio available. */ }
      bytes ??= await dependencies.fallback();
      if (!bytes) return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
      const etag = `"${hash(bytes)}"`;
      const headers = { 'Content-Type': 'image/jpeg', ETag: etag, 'Cache-Control': 'public, max-age=0, must-revalidate', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; sandbox" };
      if (request.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers });
      return new Response(request.method === 'HEAD' ? null : Buffer.from(bytes), { headers: { ...headers, 'Content-Length': String(bytes.length) } });
    }
    const owner = await dependencies.principal(request);
    if (!owner) throw new PhotoError('Sign in before changing your profile photo.', 401);
    if (owner.role !== 'terrell') throw new PhotoError('Only the owner can change the profile photo.', 403);
    if (url.pathname === '/api/profile-photo/settings' && request.method === 'GET') {
      const stores = await dependencies.stores(); try { await cleanRetired(stores); } catch { /* Retry later. */ }
      return privateJson(settings(await stores.db.get<Photo>(photoPath)));
    }
    if (url.pathname !== '/api/profile-photo' || request.method !== 'POST') throw new PhotoError('Method not allowed.', 405);
    if (!isSameOrigin(request)) throw new PhotoError('Cross-origin photo changes are not allowed.', 403);
    const expected = request.headers.get('if-match')?.match(/^"(none|[a-f0-9]{64})"$/)?.[1];
    if (!expected) throw new PhotoError('Reload the saved photo before replacing it.', 428);
    const bytes = await photoBytes(request);
    return privateJson(settings(await savePhoto(await dependencies.stores(), owner, expected, bytes)));
  } catch (error) {
    return privateJson({ error: error instanceof PhotoError ? error.message : 'Profile photo storage is unavailable. Please try again.' }, error instanceof PhotoError ? error.status : 503);
  }
}
