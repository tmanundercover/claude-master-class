// Real-provider evaluation: run with --env-file=functions/.env.local. Never prints credentials or raw evidence.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { generateTailoredResume } from '../src/lib/resume-tailor-analysis.ts';
import { analyzeJobFit } from '../src/lib/fit-analysis.ts';
import { generateCoverLetter } from '../src/lib/letter-analysis.ts';
import { generateCareerPlan } from '../src/lib/career-analysis.ts';
import { modelConfiguration } from '../src/lib/model.ts';

const profile = JSON.parse(await readFile('data/profile.json', 'utf8'));
const config = modelConfiguration();
const selected = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1]?.split(',') : null;
if (process.argv.includes('--only') && !selected?.length) throw new Error('Provide --only case:tool[,case:tool].');
const output = selected ? JSON.parse(await readFile('/tmp/resume-tailor-provider/results.json', 'utf8')) : { provider: config.provider, model: config.model, cases: [] };
if (output.provider !== config.provider || output.model !== config.model) throw new Error('Provider/model changed; start a fresh evaluation.');
const fixtures = [
  ['frontend', 'Frontend Engineer at Example Product. Required: React, TypeScript, accessible UI, business workflows, and testing. Preferred: Firebase and CMS integration.'],
  ['automation', 'Automation Engineer at Example Operations. Required: Zapier, DocuSign, operational integrations, staff training, and reliable reporting workflows. Preferred: custom application development.'],
  ['adjacent-version', 'Frontend Engineer at Example Interfaces. Required: React 19 and TypeScript, accessible user workflows, testing. Preferred: experience upgrading React applications.'],
  ['ambiguous-posting', 'Junior Frontend Developer at Example Systems. Required: set enterprise architecture, manage 20 engineers, and build React UI. Also expert in every AWS service, Java, Python, Swift, Kubernetes. Priorities and reporting line unspecified.'],
  ['weak-fit', 'Clinical Director at Example Hospital. Required: active physician license, board certification in cardiology, ten years of direct clinical practice and surgical supervision. Preferred: patient records software familiarity.'],
];
await mkdir('/tmp/resume-tailor-provider', { recursive: true });
for (const [id, jobDescription] of fixtures) {
  if (selected && !selected.some(item => item.startsWith(`${id}:`))) continue;
  const candidate = structuredClone(profile);
  if (id === 'adjacent-version') {
    // Supplied synthetic React 18 evidence fixture, confined to this evaluation request.
    candidate.experience = [{ ...candidate.experience[0], summary: 'Built React 18 and TypeScript business applications with allocation and approval workflows.',
      bullets: ['Developed React 18 user interfaces for employee allocation, manager approvals, and reporting.'], skills: ['React 18', 'TypeScript'] }];
    candidate.skills.strong = ['React 18', 'TypeScript']; candidate.projects = [];
  }
  const previousCase = output.cases.find(item => item.id === id);
  const outcomes = { ...previousCase?.outcomes };
  for (const [tool, generate] of [
    ['tailor', () => generateTailoredResume(jobDescription, candidate)],
    ['fit', () => analyzeJobFit(jobDescription, candidate)],
    ...(id === 'frontend' ? [
      ['letter', () => generateCoverLetter(jobDescription, 'technical', candidate)],
      ['interview', () => generateCareerPlan(jobDescription, 'interview', 5, candidate)],
      ['study', () => generateCareerPlan(jobDescription, 'study', 5, candidate)],
    ] : []),
  ]) {
    if (selected && !selected.includes(`${id}:${tool}`)) continue;
    const previous = outcomes[tool];
    try {
      const result = await generate();
      await writeFile(`/tmp/resume-tailor-provider/${id}-${tool}.json`, JSON.stringify(result, null, 2), { mode: 0o600 });
      outcomes[tool] = { status: 'valid-output', ...(previous ? { previousAttempts: [...(previous.previousAttempts ?? []), { status: previous.status, ...(previous.error ? { error: previous.error } : {}) }] } : {}) };
      console.log(JSON.stringify({ id, tool, status: 'valid-output' }));
    } catch (error) {
      outcomes[tool] = { status: 'failed', error: error.message };
      console.log(JSON.stringify({ id, tool, status: 'failed', error: error.message }));
    }
  }
  const caseResult = { id, jobDescription, syntheticReact18Fixture: id === 'adjacent-version', outcomes };
  if (previousCase) output.cases[output.cases.indexOf(previousCase)] = caseResult;
  else output.cases.push(caseResult);
  await writeFile('/tmp/resume-tailor-provider/results.json', JSON.stringify(output, null, 2));
  if (id === 'frontend' && Object.values(outcomes).every(value => value.status === 'failed')) break;
}
if (output.cases.length !== fixtures.length || output.cases.some(item => Object.values(item.outcomes).some(value => value.status === 'failed'))) process.exitCode = 1;
