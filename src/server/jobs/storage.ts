// Server-only adapters. No browser database/storage access is used.
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, rename, rm, stat } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { getFirestore, FieldPath, type Transaction as FirestoreTransaction, type Firestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { adminApp } from '../../lib/auth.ts';
import { JobError, type ObjectManifest } from '../../lib/job-contracts.ts';
export interface Transaction { get<T>(path: string): Promise<T | null>; set(path: string, value: unknown): void; delete(path: string): void }
export interface MetadataStore { transaction<T>(work: (tx: Transaction) => Promise<T>): Promise<T>; get<T>(path: string): Promise<T | null>; list<T>(collection: string, limit: number, after?: string): Promise<T[]> }
export interface ObjectStore { put(path: string, bytes: Uint8Array, mime: string): Promise<ObjectManifest>; read(manifest: ObjectManifest, limit: number): Promise<Uint8Array>; delete(manifest: ObjectManifest): Promise<void> }
export const hash = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex');
export function checkedBytes(bytes: Uint8Array, manifest: ObjectManifest, limit: number) {
  if (manifest.size > limit || bytes.length !== manifest.size || hash(bytes) !== manifest.hash) throw new JobError('Saved content failed integrity verification.', 503, 'content_integrity');
  return bytes;
}
export function firestoreStore(db: Firestore): MetadataStore {
  function transactionAdapter(tx: FirestoreTransaction): Transaction {
    const writes: (() => void)[] = [];
    return Object.assign({
      async get<T>(path: string) { const doc = await tx.get(db.doc(path)); return doc.exists ? doc.data() as T : null; },
      set(path: string, value: unknown) { writes.push(() => { tx.set(db.doc(path), value as FirebaseFirestore.DocumentData); }); },
      delete(path: string) { writes.push(() => { tx.delete(db.doc(path)); }); },
    }, { flush() { writes.forEach(write => write()); } });
  }
  return {
    async get<T>(path: string) { const doc = await db.doc(path).get(); return doc.exists ? doc.data() as T : null; },
    transaction(work) { return db.runTransaction(async tx => { const adapter = transactionAdapter(tx) as Transaction & { flush(): void }; const result = await work(adapter); adapter.flush(); return result; }); },
    async list<T>(collection: string, limit: number, after?: string) {
      let query = db.collection(collection).orderBy(FieldPath.documentId()).limit(limit);
      if (after) query = query.startAfter(after);
      return (await query.get()).docs.map(doc => doc.data() as T);
    },
  };
}
export function cloudObjectStore(bucket: ReturnType<ReturnType<typeof getStorage>['bucket']>): ObjectStore {
  return {
    async put(path, bytes, mime) {
      const file = bucket.file(path);
      await file.save(Buffer.from(bytes), { resumable: false, contentType: mime, preconditionOpts: { ifGenerationMatch: 0 }, metadata: { cacheControl: 'private, no-store' } });
      const [metadata] = await file.getMetadata();
      return { path, hash: hash(bytes), size: bytes.length, mime, generation: String(metadata.generation) };
    },
    async read(manifest, limit) {
      if (manifest.size > limit || manifest.size < 0) throw new JobError('Saved object exceeds the download limit.', 413);
      const file = bucket.file(manifest.path, { generation: manifest.generation });
      const [metadata] = await file.getMetadata();
      if (Number(metadata.size) !== manifest.size) throw new JobError('Saved object size changed.', 503);
      // Read at most the declared size plus one byte, even if a corrupt manifest is supplied.
      const chunks: Buffer[] = []; let size = 0;
      const stream = file.createReadStream({ start: 0, end: manifest.size });
      for await (const chunk of stream) { size += chunk.length; if (size > manifest.size) { stream.destroy(); throw new JobError('Saved object is oversized.', 503); } chunks.push(chunk); }
      return checkedBytes(Buffer.concat(chunks), manifest, limit);
    },
    async delete(manifest) { await bucket.file(manifest.path).delete({ ignoreNotFound: true, ifGenerationMatch: manifest.generation }); },
  };
}
export async function fixtureStores(directory: string): Promise<{ db: MetadataStore; objects: ObjectStore }> {
  const root = resolve(directory); await mkdir(root, { recursive: true });
  const dataPath = join(root, 'metadata.json'); const lockPath = join(root, 'metadata.lock');
  async function load(): Promise<Record<string, unknown>> { try { return JSON.parse(await readFile(dataPath, 'utf8')); } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {}; throw error; } }
  async function locked<T>(work: () => Promise<T>): Promise<T> {
    const deadline = Date.now() + 10000;
    for (;;) {
      try { await mkdir(lockPath); break; } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
        // A process can die holding the lock. No fixture transaction may run for a minute.
        let modified: number; try { modified = (await stat(lockPath)).mtimeMs; } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue; throw error; }
        if (Date.now() - modified > 60000) { await rm(lockPath, { recursive: true, force: true }); continue; }
        if (Date.now() > deadline) throw new JobError('Fixture storage is busy.', 503);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    try { return await work(); } finally { await rm(lockPath, { recursive: true, force: true }); }
  }
  const objectPath = (path: string) => { const result = resolve(root, 'objects', path); if (!result.startsWith(join(root, 'objects') + '/')) throw new JobError('Invalid object path.'); return result; };
  return {
    db: {
      async get<T>(path: string) { return ((await load())[path] as T) ?? null; },
      async list<T>(collection: string, limit: number, after?: string) { const data = await load(); return Object.keys(data).filter(path => path.startsWith(collection + '/') && !path.slice(collection.length + 1).includes('/') && (!after || path > collection + '/' + after)).sort().slice(0, limit).map(path => data[path] as T); },
      transaction<T>(work: (tx: Transaction) => Promise<T>) { return locked(async () => {
        const data = await load();
        const result = await work({ async get<T>(path: string) { return (data[path] as T) ?? null; }, set(path, value) { data[path] = structuredClone(value); }, delete(path) { delete data[path]; } });
        const temp = dataPath + '.' + randomUUID(); await writeFile(temp, JSON.stringify(data)); await rename(temp, dataPath); return result;
      }); },
    },
    objects: {
      async put(path, bytes, mime) { const target = objectPath(path); await mkdir(dirname(target), { recursive: true }); await writeFile(target, bytes, { flag: 'wx' }); return { path, hash: hash(bytes), size: bytes.length, mime, generation: '1' }; },
      async read(manifest, limit) { if (manifest.size > limit) throw new JobError('Object exceeds limit.', 413); const size = (await stat(objectPath(manifest.path))).size; if (size !== manifest.size) throw new JobError('Saved object size changed.', 503); return checkedBytes(await readFile(objectPath(manifest.path)), manifest, limit); },
      async delete(manifest) { await rm(objectPath(manifest.path), { force: true }); },
    },
  };
}
export function storageConfiguration(env: NodeJS.ProcessEnv = process.env) {
  // The development launcher explicitly selects local storage without rewriting .env files.
  if (env.JOB_WORKSPACE_EMULATORS === 'true' || env.JOB_WORKSPACE_MODE === 'emulator') {
    const project = env.GCLOUD_PROJECT || env.GOOGLE_CLOUD_PROJECT;
    const localEndpoint = (value?: string) => /^(127\.0\.0\.1|localhost|\[::1\]):([1-9][0-9]{0,4})$/.test(value ?? '') && Number(value?.slice(value.lastIndexOf(':') + 1)) <= 65535;
    if (env.FUNCTIONS_EMULATOR !== 'true' || !/^demo-[a-z0-9-]+$/.test(project ?? '') || !localEndpoint(env.FIRESTORE_EMULATOR_HOST) || !localEndpoint(env.FIREBASE_STORAGE_EMULATOR_HOST)) {
      throw new JobError('Workspace emulators require the Functions emulator, a demo project, and both loopback storage endpoints.', 503, 'storage_configuration');
    }
    return { mode: 'emulator' as const, database: '(default)', bucket: `${project}.appspot.com` };
  }
  if (env.JOB_WORKSPACE_MODE === 'fixture') {
    if (env.FUNCTIONS_EMULATOR !== 'true' || !env.JOB_WORKSPACE_FIXTURE_DIR) throw new JobError('Workspace fixtures require the Functions emulator and an explicit private directory.', 503, 'storage_configuration');
    return { mode: 'fixture' as const, directory: env.JOB_WORKSPACE_FIXTURE_DIR };
  }
  if (env.JOB_WORKSPACE_MODE !== 'live' || !env.JOB_WORKSPACE_DATABASE || !env.JOB_WORKSPACE_BUCKET) throw new JobError('Configure JOB_WORKSPACE_MODE, JOB_WORKSPACE_DATABASE, and JOB_WORKSPACE_BUCKET for private workspace storage.', 503, 'storage_configuration');
  if (env.FIRESTORE_EMULATOR_HOST || env.FIREBASE_STORAGE_EMULATOR_HOST || env.FUNCTIONS_EMULATOR === 'true') throw new JobError('Live workspace storage cannot use emulator configuration. Select emulator mode explicitly.', 503, 'storage_configuration');
  return { mode: 'live' as const, database: env.JOB_WORKSPACE_DATABASE, bucket: env.JOB_WORKSPACE_BUCKET };
}
export async function configuredStores() {
  const config = storageConfiguration();
  if (config.mode === 'fixture') return fixtureStores(config.directory);
  const app = adminApp();
  return { db: firestoreStore(getFirestore(app, config.database)), objects: cloudObjectStore(getStorage(app).bucket(config.bucket)) };
}
