import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile } from 'node:fs/promises';
import { getApps, deleteApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { adminApp } from '../src/lib/auth.ts';
import { configuredStores, storageConfiguration, hash } from '../src/server/jobs/storage.ts';
import { JobRepository } from '../src/server/jobs/repository.ts';
import { generateArtifact } from '../src/server/jobs/generation.ts';
import { generationInput } from '../src/lib/job-contracts.ts';

const config = storageConfiguration();
assert.equal(config.mode, 'emulator');
const stores = await configuredStores();
const principal = { uid: `sdk-${randomUUID()}`, role: 'terrell' };
const repo = new JobRepository(principal, stores.db, stores.objects);
const child = promisify(execFile);
const input = (descriptionId, expectedState) => generationInput({ attemptId: randomUUID(), descriptionId, expectedState, mode: expectedState ? 'start-over' : 'initial', settings: {} });
const letter = word => ({ letter: Array(220).fill(word).join(' '), evidenceUsed: ['Business workflow.', 'Property website.'], factsToVerify: ['REVIEW-PRIVATE'] });
after(async () => { await Promise.all(getApps().map(app => deleteApp(app))); });

test('SDK adapters persist descriptions, artifact bytes, pair and notes across application restart', async () => {
  const posting = `Emulator Engineer at Synthetic Company ${randomUUID()}`;
  const [first, duplicate] = await Promise.all([repo.create(posting, randomUUID()), repo.create(posting, randomUUID())]);
  assert.equal(first.workspace.id, duplicate.workspace.id);
  const { id, descriptionId } = first.workspace;
  await repo.saveNotes(id, 0, { note_restart: 'PRIVATE-RESTART-NOTE' });
  const initial = await generateArtifact(repo, id, 'cover-letter', input(descriptionId, 0), { generate: async () => letter('Initial') });
  assert.equal(initial.version.pdf.state, 'ready');
  const next = await generateArtifact(repo, id, 'cover-letter', input(descriptionId, 1), { generate: async () => letter('Replacement') });
  assert.equal(next.version.pdf.state, 'ready');
  const script = `import {configuredStores,hash} from './src/server/jobs/storage.ts';
    import {JobRepository} from './src/server/jobs/repository.ts';
    import {getApps,deleteApp} from 'firebase-admin/app';
    const s=await configuredStores();const r=new JobRepository(JSON.parse(process.argv[1]),s.db,s.objects);
    const id=process.argv[2]; const pair=await r.pair(id,'cover-letter');
    const v=await r.readVersion(id,'cover-letter',pair.current.id);
    const pdf=await s.objects.read(v.version.pdf.content,10485760);
    console.log(JSON.stringify({description:(await r.description(id)).text,pair,markdownHash:hash(v.markdown),pdfHash:hash(pdf),notes:await r.notes(id)}));
    await Promise.all(getApps().map(app=>deleteApp(app)));`;
  const restarted = JSON.parse((await child(process.execPath, ['--experimental-strip-types', '--input-type=module', '-e', script, JSON.stringify(principal), id], { timeout: 30000 })).stdout);
  assert.equal(restarted.description, posting);
  assert.deepEqual(restarted.pair, next.pair);
  assert.equal(restarted.markdownHash, hash(next.markdown));
  assert.equal(restarted.pdfHash, next.version.pdf.content.hash);
  assert.equal(restarted.notes.values.note_restart, 'PRIVATE-RESTART-NOTE');
  const swapped = await repo.undo(id, 'cover-letter', 2);
  const back = await repo.undo(id, 'cover-letter', swapped.state);
  assert.equal(back.current.id, next.version.id);
  await assert.rejects(repo.undo(id, 'cover-letter', 2), /changed/);
  const third = await generateArtifact(repo, id, 'cover-letter', input(descriptionId, back.state), { generate: async () => letter('Third') });
  assert.equal(third.pair.previous.id, next.version.id);
  await assert.rejects(repo.readVersion(id, 'cover-letter', initial.version.id), error => error.status === 410);
  for (const manifest of repo.versionObjects(initial.version)) await assert.rejects(stores.objects.read(manifest, 10485760), error => error.code === 404);
  assert.equal((await stores.db.list(`${repo.path(id)}/cleanup`, 10)).length, 0);
  const foreign = new JobRepository({ uid: `foreign-${randomUUID()}`, role: 'terrell' }, stores.db, stores.objects);
  await assert.rejects(foreign.workspace(id), error => error.status === 404);
});

test('Firestore transaction conflict permits exactly one concurrent artifact promotion', async () => {
  const { workspace } = await repo.create(`Concurrency ${randomUUID()}`, randomUUID());
  let release;
  const barrier = new Promise(resolve => { release = resolve; });
  let arrived = 0;
  const generate = async () => { if (++arrived === 2) release(); await barrier; return letter('Concurrent'); };
  const outcomes = await Promise.allSettled([1, 2].map(() => generateArtifact(repo, workspace.id, 'cover-letter', input(workspace.descriptionId, 0), { generate, automaticPdf: async () => {} })));
  assert.equal(outcomes.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(outcomes.find(result => result.status === 'rejected').reason.status, 409);
  const pair = await repo.pair(workspace.id, 'cover-letter');
  assert.equal(pair.state, 1); assert.equal(pair.previous, null);
  assert.equal((await stores.db.list(`${repo.path(workspace.id)}/cleanup`, 10)).length, 0);
});

test('Cloud Storage SDK bounded reads detect altered content and missing objects', async () => {
  const { workspace } = await repo.create(`Integrity ${randomUUID()}`, randomUUID());
  const original = await repo.writeObject(workspace.id, 'integrity.txt', 'original', 'text/plain');
  assert.equal(hash(await stores.objects.read(original, 100)), original.hash);
  await assert.rejects(stores.objects.read(original, 1));
  await assert.rejects(stores.objects.read({ ...original, hash: 'wrong-hash' }, 100), /integrity/);
  // The emulator does not implement GCS generation preconditions; the injected SDK
  // contract test verifies those options. Integrity verification still rejects tampering.
  await getStorage(adminApp()).bucket(config.bucket).file(original.path).save('tampered', { resumable: false });
  await assert.rejects(stores.objects.read(original, 100));
  await stores.objects.delete(original);
  await assert.rejects(stores.objects.read(original, 100), error => error.code === 404);
});

test('checked-in rules deny direct Firestore and Storage clients including Google-signed-in owner', async () => {
  const users = JSON.parse(await readFile(process.env.TEST_AUTH_USERS_FILE, 'utf8'));
  const owner = users.find(user => user.role === 'terrell');
  const { emulatorUserToken } = await import('../scripts/emulator-auth.mjs');
  const idToken = await emulatorUserToken(owner); assert.ok(idToken);
  const ownerRepo = new JobRepository({ uid: owner.uid, role: 'terrell' }, stores.db, stores.objects);
  const { workspace } = await ownerRepo.create(`Rules ${randomUUID()}`, randomUUID());
  const manifest = (await ownerRepo.description(workspace.id)).content;
  const firestore = `http://${process.env.FIRESTORE_EMULATOR_HOST}/v1/projects/${process.env.GCLOUD_PROJECT}/databases/(default)/documents`;
  const storage = `http://${process.env.FIREBASE_STORAGE_EMULATOR_HOST}/v0/b/${config.bucket}/o`;
  for (const token of [null, idToken]) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    for (const path of [`${repo.root}/workspaces/${workspace.id}`, `careerOwners/${owner.uid}/workspaces/${workspace.id}`, 'unmatched/private']) {
      assert.equal((await fetch(`${firestore}/${path}`, { headers })).status, 403);
      assert.equal((await fetch(`${firestore}/${path}`, { method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { value: { stringValue: 'forged' } } }) })).status, 403);
    }
    assert.equal((await fetch(`${storage}/${encodeURIComponent(manifest.path)}?alt=media`, { headers })).status, 403);
    assert.equal((await fetch(`${storage}?name=${encodeURIComponent(`career/${owner.uid}/${workspace.id}/forged.txt`)}`, { method: 'POST', headers: { ...headers, 'Content-Type': 'text/plain' }, body: 'forged upload' })).status, 403);
    assert.equal((await fetch(`${storage}/${encodeURIComponent(manifest.path)}`, { method: 'DELETE', headers })).status, 403);
    assert.equal((await fetch(`${storage}?prefix=career/`, { headers })).status, 403);
  }
});
