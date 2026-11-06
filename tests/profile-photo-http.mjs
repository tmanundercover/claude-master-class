import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { emulatorUserToken } from '../scripts/emulator-auth.mjs';
const base = process.env.TEST_BASE_URL;
const users = JSON.parse(await readFile(process.env.TEST_AUTH_USERS_FILE, 'utf8'));
const jpeg = await readFile('public/profile-photo.jpg');
const changed = Buffer.concat([jpeg.subarray(0, 2), Buffer.from([0xff, 0xfe, 0, 4, 65, 66]), jpeg.subarray(2)]);
const cookies = new Map();
const app = initializeApp({ projectId: process.env.GCLOUD_PROJECT }, 'photo-http');
after(() => deleteApp(app));
const request = (path, options = {}) => fetch(base + path, { ...options, redirect: 'manual', signal: AbortSignal.timeout(30000) });
before(async () => {
  for (const user of users) {
    const idToken = await emulatorUserToken(user);
    const login = await request('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body: JSON.stringify({ role: user.role, idToken }) });
    assert.equal(login.status, 200); cookies.set(user.role, login.headers.get('set-cookie').split(';')[0]);
  }
});
const upload = (bytes, revision, cookie = cookies.get('terrell'), origin = base, type = 'image/jpeg') => request('/api/profile-photo', { method: 'POST', headers: { 'Content-Type': type, 'If-Match': `"${revision}"`, Origin: origin, ...(cookie ? { Cookie: cookie } : {}) }, body: bytes });

test('profile photo requires the owner for changes; public image bytes and private settings have separate access', async () => {
  const initial = await request('/api/profile-photo'); assert.equal(initial.status, 200); assert.equal(initial.headers.get('content-type'), 'image/jpeg');
  assert.equal((await request('/api/profile-photo/settings')).status, 401);
  for (const [role, expected] of [['', 401], ['recruiter', 403], ['interviewer', 403]]) {
    assert.equal((await upload(jpeg, 'none', cookies.get(role) || '')).status, expected);
  }
  assert.equal((await upload(jpeg, 'none', cookies.get('terrell'), 'https://other.test')).status, 403);
  assert.equal((await upload(Buffer.from('<svg/>'), 'none', cookies.get('terrell'), base, 'image/svg+xml')).status, 415);
  assert.equal((await upload(Buffer.from('not an image'), 'none')).status, 400);
  assert.equal((await upload(Buffer.alloc(2 * 1024 * 1024 + 1), 'none')).status, 413);
});
test('actual Storage upload, Firestore reference, public ETag refresh, stale rejection and retired photo cleanup', async () => {
  const readSettings = () => request('/api/profile-photo/settings', { headers: { Cookie: cookies.get('terrell') } });
  const before = await (await readSettings()).json();
  const uploaded = await upload(jpeg, before.revision); assert.equal(uploaded.status, 200, await uploaded.clone().text());
  const first = await uploaded.json(); assert.match(first.url, /^\/api\/profile-photo\?v=[a-f0-9]{64}$/);
  const doc = getFirestore(app).doc('portfolio/profilePhoto'); const saved = (await doc.get()).data();
  assert.match(saved.content.path, /^profile-photos\//); assert.equal(saved.content.mime, 'image/jpeg');
  const file = getStorage(app).bucket(`${process.env.GCLOUD_PROJECT}.appspot.com`).file(saved.content.path);
  assert.deepEqual((await file.download())[0], jpeg);
  const photo = await request(first.url); assert.deepEqual(Buffer.from(await photo.arrayBuffer()), jpeg); assert.equal(photo.headers.get('x-content-type-options'), 'nosniff');
  assert.equal((await request('/api/profile-photo', { headers: { 'If-None-Match': photo.headers.get('etag') } })).status, 304);
  const denied = await fetch(`http://${process.env.FIREBASE_STORAGE_EMULATOR_HOST}/v0/b/${process.env.GCLOUD_PROJECT}.appspot.com/o/${encodeURIComponent(saved.content.path)}?alt=media`); assert.equal(denied.status, 403);
  assert.equal((await upload(changed, first.revision)).status, 200);
  assert.equal((await upload(jpeg, first.revision)).status, 409);
  assert.deepEqual(Buffer.from(await (await request('/api/profile-photo')).arrayBuffer()), changed);
  assert.equal((await file.exists())[0], false);
  assert.equal((await getFirestore(app).collection('profilePhotoCleanup').get()).size, 0);
  const settings = await readSettings(); assert.match(settings.headers.get('cache-control'), /private.*no-store/); assert.ok(!JSON.stringify(await settings.json()).includes('profile-photos/'));
});
