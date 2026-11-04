// Real model, private file-backed repository. No live storage or external mail is used.
// node --env-file=functions/.env.local --experimental-strip-types scripts/evaluate-workspace-writing.mjs
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { JobRepository } from '../src/server/jobs/repository.ts';
import { fixtureStores } from '../src/server/jobs/storage.ts';
import { generateArtifact, extractMetadata } from '../src/server/jobs/generation.ts';
import { modelConfiguration } from '../src/lib/model.ts';
import { generationInput } from '../src/lib/job-contracts.ts';
const config = modelConfiguration();
const directory = await mkdtemp(join(tmpdir(), 'workspace-real-model-'));
const output = '/tmp/job-workspace-provider-evidence'; await mkdir(output, { recursive: true, mode: 0o700 });
const stores = await fixtureStores(directory); const repo = new JobRepository({ uid: 'provider-evaluation', role: 'terrell' }, stores.db, stores.objects);
const jobDescription = 'Frontend Engineer at Example Product. Required: React, TypeScript, accessible interfaces, business workflows and testing. Preferred: Firebase and CMS integration. Build dependable user workflows with a collaborative product team.';
const { workspace } = await repo.create(jobDescription, randomUUID());
const evidence = { provider: config.provider, model: config.model, storage: 'private-file-fixture', jobDescription, results: [], metadata: null };
for (const kind of ['cover-letter', 'resume']) {
  for (const mode of ['initial', 'revise', 'start-over']) {
    const pair = await repo.pair(workspace.id, kind);
    try {
      const saved = await generateArtifact(repo, workspace.id, kind, generationInput({ attemptId: randomUUID(), mode, expectedState: pair.state, descriptionId: workspace.descriptionId, settings: { tone: 'technical', weeklyHours: 5 }, ...(mode === 'revise' ? { changeMessage: kind === 'cover-letter' ? 'Make the opening more direct. Keep both supported examples and the required length. Emphasize business workflow delivery.' : 'Make the summary more direct and emphasize documented React, TypeScript and business-workflow contributions. Preserve supported facts and selected experience.' } : {}) }));
      await writeFile(join(output, `${kind}-${mode}.json`), JSON.stringify(saved, null, 2), { mode: 0o600 });
      if (saved.version.pdf.state === 'ready') await writeFile(join(output, `${kind}-${mode}.pdf`), await repo.objects.read(saved.version.pdf.content, 10 * 1024 * 1024), { mode: 0o600 });
      evidence.results.push({ kind, mode, status: 'saved-and-retrieved', version: saved.version.id, promptVersion: saved.version.promptVersion, evidenceVersion: saved.version.evidenceVersion, pdf: saved.version.pdf.state, pairState: saved.pair.state });
      console.log(JSON.stringify(evidence.results.at(-1)));
    } catch (error) { evidence.results.push({ kind, mode, status: 'failed', error: error.message }); console.log(JSON.stringify({ kind, mode, status: 'failed', error: error.message })); break; }
  }
}
const unknown = await repo.create('Software Engineer. Build React interfaces. Company, location and requisition are not specified.', randomUUID());
await extractMetadata(repo, unknown.workspace.id); const metadata = await repo.workspace(unknown.workspace.id);
evidence.metadata = { company: metadata.company, title: metadata.title, location: metadata.location, requisition: metadata.requisition, extraction: metadata.extraction };
await writeFile(join(output, 'results.json'), JSON.stringify(evidence, null, 2), { mode: 0o600 });
console.log(JSON.stringify({ metadata: evidence.metadata, evidence: output }));
if (evidence.results.length !== 6 || evidence.results.some(result => result.status === 'failed') || metadata.extraction !== 'ready') process.exitCode = 1;
