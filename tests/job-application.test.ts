import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { JobRepository } from '../src/server/jobs/repository.ts';
import { fixtureStores, hash } from '../src/server/jobs/storage.ts';
import { prepareApplication, applicationReturn, snapshotFiles, applicationLink } from '../src/server/jobs/application.ts';
import { generateArtifact } from '../src/server/jobs/generation.ts';
import { generationInput, type ArtifactKind } from '../src/lib/job-contracts.ts';
import { FixtureMailbox } from '../src/server/mail/fixture.ts';
import { isSavedArtifactResult } from '../src/lib/job-result.ts';
import { applicationMailTemplate } from '../src/lib/application-template.ts';
import type { Composition } from '../src/lib/mail-types.ts';
const content: Composition = { to: ['controlled@example.test'], cc: [], bcc: [], subject: 'Edited subject', text: 'Edited copy', html: '<p>Edited copy</p>', attachments: [{ filename: 'manual.txt', contentType: 'text/plain', content: Buffer.from('MANUAL-CONTENT').toString('base64') }] };
async function setup() {
  const directory = await mkdtemp(join(tmpdir(), 'application-test-')); const stores = await fixtureStores(directory); const repo = new JobRepository({ uid: 'application-owner', role: 'terrell' }, stores.db, stores.objects);
  const { workspace } = await repo.create('Engineer at Acme. React. [fixture:valid]', randomUUID()); const mail = new FixtureMailbox('contact@example.test');
  const { id: draftId } = await mail.saveDraft(null, content, randomUUID());
  const fixture = await import(new URL('../scripts/emulator-model-fixture.mjs', import.meta.url).href);
  async function generate(kind: ArtifactKind) { const pair = await repo.pair(workspace.id, kind); return generateArtifact(repo, workspace.id, kind, generationInput({ attemptId: randomUUID(), expectedState: pair.state, descriptionId: workspace.descriptionId, mode: pair.current ? 'start-over' : 'initial', settings: {} }), { generate: request => fixture.emulatorModelFixture(request, {}) }); }
  return { repo, workspace, mail, draftId, generate, async close() { await rm(directory, { recursive: true, force: true }); } };
}
const request = (draftId: string) => ({ attemptId: randomUUID(), draftId, content, action: 'apply' as const, standardResume: false, omitResume: false, omitCoverLetter: false });

test('application copy is deterministic, escaped, attachment-aware, neutral and has no inferred recipients', () => {
  const template = applicationMailTemplate({ name: 'Candidate' }, { company: 'Acme <script>', title: 'Engineer', location: null, requisition: null }, { resume: 'tailored', coverLetter: true });
  assert.match(template.subject, /Candidate.*Acme.*Engineer|Candidate.*Engineer.*Acme/); assert.doesNotMatch(template.html, /<script>/); assert.match(template.text, /résumé and cover letter attached/);
  const unknown = applicationMailTemplate({ name: 'Candidate' }, { company: null, title: null, location: null, requisition: null }, { resume: null, coverLetter: false });
  assert.doesNotMatch(unknown.text, /attached|@|Acme|Engineer/);
});

test('all five registered artifact kinds save independently and optional PDFs stay optional', async () => {
  const ctx = await setup(); try {
    for (const kind of ['job-fit', 'resume', 'cover-letter', 'interview-prep', 'study-plan'] as const) {
      const saved = await ctx.generate(kind); assert.equal(isSavedArtifactResult(kind, saved.result, 5), true); if (kind === 'job-fit') assert.equal(isSavedArtifactResult(kind, { ...(saved.result as object), score: 99 }, 5), false); assert.equal((await ctx.repo.readVersion(ctx.workspace.id, kind, saved.version.id)).markdown, saved.markdown);
      assert.equal(saved.version.pdf.state, kind === 'resume' || kind === 'cover-letter' ? 'ready' : 'not-requested');
    }
  } finally { await ctx.close(); }
});

test('native application snapshots and manual files survive source retirement; refresh preserves copy', async () => {
  const ctx = await setup(); const { repo, workspace, mail, draftId } = ctx;
  try {
    await ctx.generate('resume'); await ctx.generate('cover-letter');
    const input = request(draftId); const prepared = await prepareApplication(repo, workspace.id, input, mail, { name: 'Candidate' });
    assert.equal(prepared.link.snapshots.length, 3); assert.equal(prepared.draft.to?.[0], 'controlled@example.test');
    assert.match(prepared.link.snapshots.find(file => file.kind === 'resume')!.filename, /^candidate-resume-\d{4}\.pdf$/);
    assert.match(prepared.link.snapshots.find(file => file.kind === 'cover-letter')!.filename, /^candidate-cover-letter-\d{4}\.pdf$/);
    assert.match(prepared.content.text, /résumé and cover letter attached/);
    const bytes = await snapshotFiles(repo, prepared.link); const nativeBefore = await mail.draft(draftId);
    assert.equal((await prepareApplication(repo, workspace.id, input, mail, { name: 'Candidate' })).link?.draftId, draftId);
    await ctx.generate('resume'); await ctx.generate('resume'); await ctx.generate('cover-letter'); await ctx.generate('cover-letter');
    assert.deepEqual((await mail.draft(draftId)).attachments, nativeBefore.attachments);
    assert.deepEqual(await snapshotFiles(repo, prepared.link), bytes);
    const refreshed = await prepareApplication(repo, workspace.id, { ...request(draftId), action: 'refresh', content: { ...content, text: 'KEEP MY EDITS', attachments: bytes } }, mail, { name: 'Candidate' });
    assert.equal(refreshed.content.text, 'KEEP MY EDITS'); assert.equal(refreshed.link.snapshots.filter(file => !file.managed).length, 1);
    assert.equal((await applicationReturn(repo, prepared.link.returnRef)).draftId, draftId);
    // This send uses only the synthetic in-memory mailbox, never an external provider.
    const sent = await mail.sendDraft(draftId, randomUUID()); assert.ok(sent.id);
    const threads = await mail.threads({ folder: 'sent' }); const messages = await mail.messages(threads.data[0].id); const outbound = messages.data.find(message => message.id === sent.id)!;
    assert.equal(outbound.attachments.length, 3);
    const attachment = await mail.attachment(threads.data[0].id, sent.id, outbound.attachments[0].id); assert.equal(Buffer.from(attachment.bytes).toString(), 'MANUAL-CONTENT');
  } finally { await ctx.close(); }
});

test('missing résumé requires explicit choice; handoff preserves useful draft and standard bytes are exact', async () => {
  const ctx = await setup(); const { repo, workspace, mail, draftId } = ctx;
  try {
    await assert.rejects(prepareApplication(repo, workspace.id, request(draftId), mail, { name: 'Candidate' }), error => (error as { code: string }).code === 'resume_choice_needed');
    const standard = Buffer.from('%PDF-synthetic-standard');
    const result = await prepareApplication(repo, workspace.id, { ...request(draftId), standardResume: true }, mail, { name: 'Candidate' }, async () => standard);
    const file = result.link.snapshots.find(file => file.kind === 'standard')!; assert.equal(file.hash, hash(standard));
    const handoff = await prepareApplication(repo, workspace.id, { ...request(draftId), action: 'handoff', content: { ...content, attachments: result.content.attachments } }, mail, { name: 'Candidate' });
    assert.equal(handoff.content.attachments?.length, 2); assert.equal(handoff.content.text, content.text);
    const empty: Composition = { to: [], cc: [], bcc: [], subject: '', text: '', html: '' };
    const seeded = await mail.saveDraft(null, { ...empty, subject: 'Application draft' }, randomUUID());
    const blank = await prepareApplication(repo, workspace.id, { ...request(seeded.id), action: 'handoff', content: empty }, mail, { name: 'Candidate' });
    assert.match(blank.content.subject, /Application/); assert.doesNotMatch(blank.content.text, /attached/);
    const foreign = new JobRepository({ uid: 'foreign-owner', role: 'terrell' }, repo.db, repo.objects);
    await assert.rejects(applicationReturn(foreign, result.link.returnRef), /not found/);
  } finally { await ctx.close(); }
});

test('uncertain native update reconciles once and pending PDFs never silently select Previous', async () => {
  const ctx = await setup(); const { repo, workspace, mail, draftId } = ctx;
  try {
    await ctx.generate('resume');
    const save = mail.saveDraft.bind(mail); let calls = 0;
    mail.saveDraft = async (...args) => { calls++; const saved = await save(...args); if (calls === 1) throw new Error('response lost'); return saved; };
    const input = request(draftId);
    await assert.rejects(prepareApplication(repo, workspace.id, input, mail, { name: 'Candidate' }), /uncertain/);
    const reconciled = await prepareApplication(repo, workspace.id, input, mail, { name: 'Candidate' }); assert.ok(reconciled.link); assert.equal(calls, 1);
    const pair = await repo.pair(workspace.id, 'resume');
    await repo.db.transaction(async tx => { tx.set(repo.artifactPath(workspace.id, 'resume'), { ...pair, current: { ...pair.current, pdf: { state: 'failed' } } }); });
    const before = await mail.draft(draftId);
    await assert.rejects(prepareApplication(repo, workspace.id, { ...request(draftId), action: 'refresh', content: reconciled.content }, mail, { name: 'Candidate' }), /PDF is failed/);
    assert.deepEqual(await mail.draft(draftId), before);
    assert.ok(await applicationLink(repo, draftId));
  } finally { await ctx.close(); }
});

test('foreign workspace, excess attachments and source retirement fail before native mutation', async () => {
  const ctx = await setup(); const { repo, workspace, mail, draftId } = ctx;
  try {
    const source = await ctx.generate('resume'); const before = await mail.draft(draftId); let mutations = 0; const save = mail.saveDraft.bind(mail);
    mail.saveDraft = async (...args) => { mutations++; return save(...args); };
    const other = new JobRepository({ uid: 'unrelated-owner', role: 'terrell' }, repo.db, repo.objects);
    await assert.rejects(prepareApplication(other, workspace.id, request(draftId), mail, { name: 'Candidate' }), /not found/);
    await assert.rejects(prepareApplication(repo, workspace.id, { ...request(draftId), content: { ...content, attachments: Array(11).fill(content.attachments![0]) } }, mail, { name: 'Candidate' }), /at most 10/);
    assert.equal(source.version.pdf.state, 'ready');
    const sourcePath = source.version.pdf.state === 'ready' ? source.version.pdf.content.path : '';
    const read = repo.objects.read; let retire = true;
    repo.objects.read = async (manifest, limit) => { const bytes = await read(manifest, limit); if (retire && manifest.path === sourcePath) { retire = false; await ctx.generate('resume'); await ctx.generate('resume'); } return bytes; };
    await assert.rejects(prepareApplication(repo, workspace.id, request(draftId), mail, { name: 'Candidate' }), error => (error as { code: string }).code === 'stale_source');
    assert.equal(mutations, 0); assert.deepEqual(await mail.draft(draftId), before);
  } finally { await ctx.close(); }
});
