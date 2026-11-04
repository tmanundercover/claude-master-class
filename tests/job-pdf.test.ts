import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fixtureStores } from '../src/server/jobs/storage.ts';
import { JobRepository } from '../src/server/jobs/repository.ts';
import { generateArtifact, artifactDocuments } from '../src/server/jobs/generation.ts';
import { generatePdf, renderArtifactPdf } from '../src/server/jobs/pdf.ts';
import { generationInput } from '../src/lib/job-contracts.ts';

test('PDF failure is separate, retry uses saved text and late retired output is discarded', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'job-pdf-')); const stores = await fixtureStores(dir); const repo = new JobRepository({ uid: 'pdf-owner', role: 'terrell' }, stores.db, stores.objects);
  try {
    const { workspace } = await repo.create('Engineer posting', randomUUID()); let calls = 0;
    const run = async () => { const pair = await repo.pair(workspace.id, 'cover-letter'); return generateArtifact(repo, workspace.id, 'cover-letter', generationInput({ attemptId: randomUUID(), mode: pair.current ? 'start-over' : 'initial', expectedState: pair.state, descriptionId: workspace.descriptionId, settings: {} }), { generate: async () => { calls++; return { letter: Array(220).fill('Supported').join(' '), evidenceUsed: ['Business workflow.', 'Property website.'], factsToVerify: ['REVIEW-SENTINEL'] }; }, automaticPdf: async () => {} }); };
    const first = await run();
    await assert.rejects(generatePdf(repo, workspace.id, 'cover-letter', first.version.id, async () => { throw new Error('render failure'); }));
    assert.equal((await repo.retained(workspace.id, 'cover-letter', first.version.id)).pdf.state, 'failed');
    assert.equal((await repo.readVersion(workspace.id, 'cover-letter', first.version.id)).markdown, first.markdown);
    const ready = await generatePdf(repo, workspace.id, 'cover-letter', first.version.id);
    assert.equal(ready.pdf.state, 'ready'); assert.equal(calls, 1);
    if (ready.pdf.state === 'ready') assert.equal(ready.pdf.sourceHash, ready.result.hash);
    const second = await run(); let release!: () => void; const barrier = new Promise<void>(resolve => { release = resolve; }); let start!: () => void; const started = new Promise<void>(resolve => { start = resolve; });
    const late = generatePdf(repo, workspace.id, 'cover-letter', second.version.id, async (...args) => { start(); await barrier; return renderArtifactPdf(...args); }); await started;
    await run(); await run(); release(); await assert.rejects(late);
    await assert.rejects(repo.retained(workspace.id, 'cover-letter', second.version.id));
    assert.equal(calls, 4);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('document adapters keep review metadata and notes out of print content', async () => {
  const docs = artifactDocuments('cover-letter', { letter: 'Application document.', evidenceUsed: ['EVIDENCE-SENTINEL'], factsToVerify: ['REVIEW-SENTINEL'] });
  assert.equal(docs.markdown, 'Application document.'); assert.doesNotMatch(JSON.stringify(docs.content), /SENTINEL/);
  const bytes = await renderArtifactPdf('study-plan', { mode: 'study' }, '# Long study plan\n\n' + Array(200).fill('A complete paragraph with https://example.test/' + 'long-path-'.repeat(15)).join('\n\n'));
  assert.equal(bytes.subarray(0, 5).toString(), '%PDF-'); assert.ok(bytes.length > 5000);
});

test('standard résumé refresh is deterministic and depends only on the public document model', async () => {
  const { readFile } = await import('node:fs/promises');
  const { publicResumeDocument } = await import('../src/lib/resume-document.ts');
  const { renderResumePdf } = await import('../src/server/jobs/pdf.ts');
  const profile = JSON.parse(await readFile('data/profile.json', 'utf8'));
  const original = publicResumeDocument(profile, { full: true });
  const refreshed = publicResumeDocument({ ...profile, headline: 'Refreshed public headline' }, { full: true });
  assert.deepEqual(original.experience.map(role => role.bullets), profile.experience.map((role: { bullets: string[] }) => role.bullets));
  assert.equal(original.experience.length, profile.experience.length);
  assert.equal(original.projects.length, profile.projects.length);
  for (const [index, project] of original.projects.entries()) {
    assert.equal(project.title, profile.projects[index].title);
    assert.ok(!project.description.includes('\n'));
    assert.deepEqual(project.links.map(link => link.url), [...(profile.projects[index].url ? [profile.projects[index].url] : []), ...(profile.projects[index].links ?? []).map((link: { url: string }) => link.url)]);
  }
  const first = await renderResumePdf(original, undefined, { compactProjects: true }); const repeat = await renderResumePdf(original, undefined, { compactProjects: true }); const changed = await renderResumePdf(refreshed, undefined, { compactProjects: true });
  assert.deepEqual(first, repeat); assert.notDeepEqual(first, changed);
  assert.equal(refreshed.headline, 'Refreshed public headline');
  assert.ok(!JSON.stringify(original).includes(profile.projects[0].evidence));
});
