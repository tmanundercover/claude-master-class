import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { profilePhotoRoute, validatePhoto, PHOTO_LIMIT } from '../src/server/profile-photo.ts';
import { fixtureStores, hash } from '../src/server/jobs/storage.ts';
import type { SessionPrincipal } from '../src/lib/auth.ts';
import type { ObjectManifest } from '../src/lib/job-contracts.ts';

const jpeg = await readFile('public/profile-photo.jpg');
const altered = Buffer.concat([jpeg.subarray(0, 2), Buffer.from([0xff, 0xfe, 0, 4, 65, 66]), jpeg.subarray(2)]);
function request(method = 'GET', bytes?: Uint8Array, revision = 'none', path = '/api/profile-photo', origin = 'http://localhost') {
  return new Request('http://localhost' + path, { method, headers: { 'Content-Type': 'image/jpeg', Origin: origin, 'If-Match': `"${revision}"` }, ...(bytes ? { body: Buffer.from(bytes) } : {}) });
}
async function setup() {
  const directory = await mkdtemp(join(tmpdir(), 'profile-photo-')); const stores = await fixtureStores(directory);
  const dependencies = { principal: async (): Promise<SessionPrincipal | null> => ({ uid: 'photo-owner', role: 'terrell' }), stores: async () => stores, fallback: async () => jpeg };
  return { stores, dependencies, close: () => rm(directory, { recursive: true, force: true }) };
}
test('photo validation accepts real JPEG dimensions and rejects mislabeled, truncated, oversized and huge frames', () => {
  assert.deepEqual(validatePhoto(jpeg), { width: 400, height: 400 });
  for (const bytes of [Buffer.from('<svg onload="alert(1)"></svg>'), jpeg.subarray(0, -2), Buffer.alloc(PHOTO_LIMIT + 1)]) assert.throws(() => validatePhoto(bytes));
  const huge = Buffer.from(jpeg); const frame = huge.indexOf(Buffer.from([0xff, 0xc0])); assert.ok(frame >= 0);
  huge[frame + 7] = 0xff; huge[frame + 8] = 0xff; assert.throws(() => validatePhoto(huge), /2048/);
});
test('owner authorization and same-origin checks precede reading bodies or opening storage', async () => {
  let opened = 0;
  for (const principal of [null, { uid: 'viewer', role: 'recruiter' as const }, { uid: 'viewer', role: 'interviewer' as const }]) {
    const dependencies = { principal: async () => principal, stores: async () => { opened++; throw new Error('must not open'); }, fallback: async () => null };
    assert.equal((await profilePhotoRoute(request('POST', jpeg), dependencies)).status, principal ? 403 : 401);
    assert.equal((await profilePhotoRoute(request('GET', undefined, 'none', '/api/profile-photo/settings'), dependencies)).status, principal ? 403 : 401);
  }
  const ctx = await setup(); try { assert.equal((await profilePhotoRoute(request('POST', jpeg, 'none', '/api/profile-photo', 'https://elsewhere.test'), { ...ctx.dependencies, stores: async () => { opened++; return ctx.stores; } })).status, 403); assert.equal(opened, 0); } finally { await ctx.close(); }
});
test('photo uploads persist manifests, public bytes and ETags; stale writes preserve the saved photo and clean their staged bytes', async () => {
  const ctx = await setup(); const route = (req: Request) => profilePhotoRoute(req, ctx.dependencies);
  try {
    const before = await (await route(request('GET', undefined, 'none', '/api/profile-photo/settings'))).json(); assert.equal(before.revision, 'none');
    const initial = await route(request('POST', jpeg)); assert.equal(initial.status, 200); const first = await initial.json(); assert.equal(first.revision, hash(jpeg));
    const record = await ctx.stores.db.get<{ content: ObjectManifest }>('portfolio/profilePhoto'); assert.ok(record?.content.path.startsWith('profile-photos/photo-owner/'));
    const image = await route(request()); assert.deepEqual(Buffer.from(await image.arrayBuffer()), jpeg); assert.equal(image.headers.get('content-type'), 'image/jpeg'); assert.equal(image.headers.get('x-content-type-options'), 'nosniff');
    const cached = await route(new Request('http://localhost/api/profile-photo', { headers: { 'If-None-Match': image.headers.get('etag')! } })); assert.equal(cached.status, 304);
    assert.equal((await route(request('POST', altered, first.revision))).status, 200);
    assert.equal((await route(request('POST', jpeg, first.revision))).status, 409);
    const newest = await route(request()); assert.deepEqual(Buffer.from(await newest.arrayBuffer()), altered);
    await assert.rejects(ctx.stores.objects.read(record!.content, PHOTO_LIMIT));
    assert.equal((await ctx.stores.db.list('profilePhotoCleanup', 10)).length, 0);
    const metadata = await (await route(request('GET', undefined, 'none', '/api/profile-photo/settings'))).json(); assert.ok(!JSON.stringify(metadata).includes('photo-owner')); assert.ok(!JSON.stringify(metadata).includes('profile-photos/'));
  } finally { await ctx.close(); }
});
test('failed persistence retains the previous image; lost acknowledgement reconciles saved content', async () => {
  const ctx = await setup(); const route = (req: Request) => profilePhotoRoute(req, ctx.dependencies);
  try {
    await route(request('POST', jpeg));
    const transact = ctx.stores.db.transaction.bind(ctx.stores.db);
    ctx.stores.db.transaction = async () => { throw new Error('storage unavailable'); };
    assert.equal((await route(request('POST', altered, hash(jpeg)))).status, 503);
    assert.deepEqual(Buffer.from(await (await route(request())).arrayBuffer()), jpeg);
    let calls = 0;
    ctx.stores.db.transaction = async work => { const result = await transact(work); if (++calls === 1) throw new Error('lost acknowledgement'); return result; };
    assert.equal((await route(request('POST', altered, hash(jpeg)))).status, 200);
    assert.deepEqual(Buffer.from(await (await route(request())).arrayBuffer()), altered);
  } finally { await ctx.close(); }
});
test('public portrait can use its approved bundled fallback while private settings fail explicitly', async () => {
  const dependencies = { principal: async (): Promise<SessionPrincipal> => ({ uid: 'owner', role: 'terrell' }), stores: async () => { throw new Error('unconfigured'); }, fallback: async () => jpeg };
  assert.deepEqual(Buffer.from(await (await profilePhotoRoute(request(), dependencies)).arrayBuffer()), jpeg);
  assert.equal((await profilePhotoRoute(request('GET', undefined, 'none', '/api/profile-photo/settings'), dependencies)).status, 503);
});
