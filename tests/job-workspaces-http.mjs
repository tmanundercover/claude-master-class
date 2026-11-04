import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp } from 'firebase-admin/app';
const base = process.env.TEST_BASE_URL;
const users = JSON.parse(await readFile(process.env.TEST_AUTH_USERS_FILE, 'utf8'));
const cookies = new Map();
async function request(path, method = 'GET', body, cookie = cookies.get('terrell'), origin = base) { return fetch(base + path, { method, redirect: 'manual', headers: { ...(cookie ? { Cookie: cookie } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json', Origin: origin }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(30000) }); }
before(async () => { for (const user of users) {
  const signed = await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=emulator-only`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, password: user.password, returnSecureToken: true }) });
  const { idToken } = await signed.json(); const session = await request('/api/auth', 'POST', { role: user.role, idToken }, '', base); assert.equal(session.status, 200); cookies.set(user.role, session.headers.get('set-cookie').split(';')[0]);
}
  const admin = getAuth(initializeApp({ projectId: process.env.GCLOUD_PROJECT }, 'job-http-second-owner'));
  const foreign = await admin.createUser({ email: 'another-workspace-owner@example.test', password: 'Emulator-Only-84!' });
  await admin.setCustomUserClaims(foreign.uid, { portfolioRole: 'terrell' });
  const response = await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=emulator-only`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'another-workspace-owner@example.test', password: 'Emulator-Only-84!', returnSecureToken: true }) });
  const { idToken } = await response.json(); const session = await request('/api/auth', 'POST', { role: 'terrell', idToken }, '', base); assert.equal(session.status, 200); cookies.set('foreign-owner', session.headers.get('set-cookie').split(';')[0]);
});
const create = async jd => { const response = await request('/api/job-workspaces', 'POST', { jobDescription: jd, attemptId: randomUUID() }); assert.ok([200, 201].includes(response.status), await response.clone().text()); return response.json(); };

test('workspace HTTP authorization, strict inputs, owner retrieval and same-origin mutations', async () => {
  for (const cookie of ['', '__session=forged', cookies.get('recruiter'), cookies.get('interviewer')]) { const denied = await request('/api/job-workspaces', 'GET', undefined, cookie); assert.equal(denied.status, cookie && !cookie.includes('forged') ? 403 : 401); assert.match(denied.headers.get('cache-control'), /no-store/); }
  for (const jobDescription of ['', 'a'.repeat(15001)]) assert.equal((await request('/api/job-workspaces', 'POST', { jobDescription, attemptId: randomUUID() })).status, 400);
  assert.equal((await request('/api/job-workspaces', 'POST', { jobDescription: 'Engineer', attemptId: randomUUID(), uid: 'forged' })).status, 400);
  assert.equal((await request('/api/job-workspaces', 'POST', { jobDescription: 'Engineer', attemptId: randomUUID() }, cookies.get('terrell'), 'https://evil.example')).status, 403);
  const attemptId = randomUUID(); const payload = { jobDescription: 'HTTP Engineer at Acme. React. [fixture:success]', attemptId };
  const first = await (await request('/api/job-workspaces', 'POST', payload)).json(); const second = await (await request('/api/job-workspaces', 'POST', payload)).json(); assert.equal(first.workspace.id, second.workspace.id);
  const read = await request(`/api/job-workspaces/${first.workspace.id}`); assert.equal(read.status, 200); assert.match(read.headers.get('cache-control'), /private.*no-store/); assert.match(read.headers.get('vary'), /\bCookie\b/);
  const dashboard = await read.json(); assert.equal(dashboard.description.text, payload.jobDescription);
  assert.equal((await request(`/api/job-workspaces/${first.workspace.id}`, 'GET', undefined, cookies.get('foreign-owner'))).status, 404);
  const forged = await fetch(`${base}/api/job-workspaces/${first.workspace.id}`, { headers: { Cookie: cookies.get('foreign-owner'), 'X-Owner-Uid': first.workspace.id } }); assert.equal(forged.status, 404);
  assert.equal((await request(`/api/job-workspaces/${randomUUID()}`)).status, 404);
  assert.equal((await request('/api/job-workspaces?limit=51')).status, 400);
  await create('Another distinct HTTP posting.'); const page = await (await request('/api/job-workspaces?limit=1')).json(); assert.equal(page.items.length, 1); assert.ok(page.next); const next = await (await request(`/api/job-workspaces?limit=1&after=${page.next}`)).json(); assert.notEqual(page.items[0].id, next.items[0].id);
  for (const selector of [{ path: 'career/forged/document.pdf' }, { url: 'https://untrusted.example/document.pdf' }, { revisionId: randomUUID() }]) assert.equal((await request(`/api/job-workspaces/${first.workspace.id}/application-draft`, 'POST', { attemptId: randomUUID(), draftId: 'forged-draft', action: 'apply', ...selector })).status, 400);
  const changed = await request(`/api/job-workspaces/${first.workspace.id}`, 'PATCH', { expectedState: dashboard.workspace.metadataVersion, metadata: { company: 'Corrected company', title: 'Corrected role', location: null, requisition: null } }); assert.equal(changed.status, 200);
  assert.equal((await request(`/api/job-workspaces/${first.workspace.id}/notes`, 'PUT', { expectedState: 0, values: { note_http123: 'PRIVATE-HTTP-NOTE' } })).status, 200);
  assert.equal((await request(`/api/job-workspaces/${first.workspace.id}/notes`, 'PUT', { expectedState: 0, values: {} })).status, 409);
  const publicPage = await (await request('/', 'GET', undefined, '')).text(); assert.doesNotMatch(publicPage, /PRIVATE-HTTP-NOTE|Corrected company/);
  assert.equal((await request('/resume.pdf', 'GET', undefined, '')).headers.get('content-type'), 'application/pdf');
});

test('failed initial generation retains saved workspace and description', async () => {
  const { workspace } = await create('Failure Engineer posting [fixture:provider-error]');
  const response = await request(`/api/job-workspaces/${workspace.id}/artifacts/cover-letter/generate`, 'POST', { attemptId: randomUUID(), mode: 'initial', expectedState: 0, descriptionId: workspace.descriptionId, settings: {} });
  assert.ok([502, 503].includes(response.status)); const saved = await (await request(`/api/job-workspaces/${workspace.id}`)).json(); assert.equal(saved.workspace.id, workspace.id); assert.equal(saved.artifacts['cover-letter'].current, null);
});

test('saved generations, legacy reconciliation, PDF downloads, pair retirement, undo and notes', { skip: process.env.TEST_MODEL_FIXTURES !== 'true' }, async () => {
  const { workspace } = await create('HTTP versioned Engineer at Acme. React. [fixture:success]'); const id = workspace.id;
  let state = 0; let previous; let retired;
  for (const mode of ['initial', 'revise', 'start-over']) {
    const input = { attemptId: randomUUID(), mode, expectedState: state, descriptionId: workspace.descriptionId, settings: {}, ...(mode === 'revise' ? { changeMessage: 'Shorten the introduction.' } : {}) };
    const generated = await request(`/api/job-workspaces/${id}/artifacts/cover-letter/generate`, 'POST', input); assert.equal(generated.status, 200, await generated.clone().text()); const saved = await generated.json(); state = saved.pair.state;
    assert.equal(saved.version.pdf.state, 'ready'); assert.match(saved.result.letter, mode === 'initial' ? /Initial/ : mode === 'revise' ? /Revised/ : /Fresh/);
    const replay = await (await request(`/api/job-workspaces/${id}/artifacts/cover-letter/generate`, 'POST', input)).json(); assert.equal(replay.version.id, saved.version.id);
    if (mode === 'initial') retired = saved.version.id;
    if (previous) assert.equal(saved.pair.previous.id, previous);
    previous = saved.version.id;
    const pdf = await request(`/api/job-workspaces/${id}/artifacts/cover-letter/versions/${saved.version.id}/files/pdf`); assert.equal(pdf.status, 200); assert.equal(Buffer.from(await pdf.arrayBuffer()).subarray(0, 5).toString(), '%PDF-'); assert.match(pdf.headers.get('content-disposition'), /attachment; filename="james-terrell-singleton-.*cover-letter-\d{4}\.pdf"/); assert.ok(!pdf.headers.get('content-disposition').includes(saved.version.id));
    const md = await request(`/api/job-workspaces/${id}/artifacts/cover-letter/versions/${saved.version.id}/files/markdown`); assert.equal(md.status, 200); assert.equal(await md.text(), saved.markdown);
  }
  assert.equal((await request(`/api/job-workspaces/${id}/artifacts/cover-letter/versions/${retired}`)).status, 410);
  const undo = await request(`/api/job-workspaces/${id}/artifacts/cover-letter/undo`, 'POST', { expectedState: state }); assert.equal(undo.status, 200); assert.equal((await undo.json()).state, state + 1);
  assert.equal((await request(`/api/job-workspaces/${id}/artifacts/cover-letter/undo`, 'POST', { expectedState: state })).status, 409);
  for (const mode of ['interview', 'study']) {
    const attempt = randomUUID(); const payload = { jobDescription: 'Legacy HTTP React Engineer [fixture:success]', mode };
    const call = () => fetch(base + '/api/career-plan', { method: 'POST', headers: { Cookie: cookies.get('terrell'), Origin: base, 'Content-Type': 'application/json', 'X-Generation-Attempt': attempt }, body: JSON.stringify(payload) });
    const response = await call(); assert.equal(response.status, 200); const version = response.headers.get('x-artifact-version'); assert.ok(version); assert.equal((await response.json()).mode, mode); const replay = await call(); assert.equal(replay.headers.get('x-artifact-version'), version);
  }
  for (const cookie of ['', cookies.get('recruiter')]) assert.equal((await request(`/api/job-workspaces/${id}/artifacts/cover-letter/versions/${previous}/files/pdf`, 'GET', undefined, cookie)).status, cookie ? 403 : 401);
});
