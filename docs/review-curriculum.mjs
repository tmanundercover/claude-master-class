// Documentation-only walkthrough: node docs/review-curriculum.mjs
import { readFile, writeFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lessons, slides } from './slides/course.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const read = path => readFile(resolve(root, path), 'utf8');
const report = { scope: 'Materials walkthrough, not application runtime acceptance', checks: [], lessons: [], promptHashes: [], linksChecked: 0, failures: [] };
function check(label, pass) { report.checks.push({ label, pass }); if (!pass) report.failures.push(label); }
const readme = await read('README.md');
const exerciseTexts = [];
const workflowBlocks = text => [...text.matchAll(/```text\n([\s\S]*?)```/g)].map(x => x[1]).filter(x => x.startsWith('$openspec-explore\n'));
for (const [i, [file, title, name]] of lessons.entries()) {
  const path = `exercises/${file}`; const text = await read(path); exerciseTexts.push([path, text]);
  const heading = text.split('\n')[0];
  check(`Lesson ${i} heading and stable path`, heading === `# Lesson ${i} — ${title}`);
  check(`Lesson ${i} in README sequence`, readme.includes(`| ${i} | [${title}](exercises/${file}) |`));
  const prev = i === 0 ? '../docs/pre-class.md' : lessons[i - 1][0];
  const next = i === 10 ? '../README.md#class-path' : lessons[i + 1][0];
  const navigation = text.split('\n').findLast(line => line.startsWith('Previous:')) || '';
  check(`Lesson ${i} previous/next transition`, navigation.includes(`](${prev})`) && navigation.includes(`](${next})`));
  if (i > 0) {
    check(`Lesson ${i} Explore/refine and no-edit wrapper`, workflowBlocks(text).length > 0 && text.includes('Do not edit implementation files or\ncreate planning artifacts yet.'));
    check(`Lesson ${i} separate named Propose/Apply`, text.includes(`$openspec-propose ${name}`) && text.includes(`$openspec-apply-change ${name}`));
    check(`Lesson ${i} review/verification/recovery gates`, text.includes('Review the proposal, design, applicable specs, and tasks.') && text.includes('## Verify before continuing') && text.includes(`same \`${name}\` change`));
    const blocks = workflowBlocks(text); if (i === 1) blocks.reverse();
    for (const [block, prompt] of blocks.entries()) {
      const rendered = slides.filter(slide => slide.promptSource === file && slide.promptBlock === block).map(slide => slide.prompt).join('');
      check(`Lesson ${i} full prompt ${block + 1} in slide paste order`, rendered === prompt);
    }
  }
  report.lessons.push({ number: i, title, path, previous: prev, next });
}
const baseline = JSON.parse(await read('docs/curriculum-prompt-baseline.json'));
check('All six original preserved blocks have baselines', baseline.prompts.length === 6);
for (const entry of baseline.prompts) {
  const text = await read(entry.sourcePath);
  const candidates = workflowBlocks(text).map(block => block.slice(block.indexOf('\n\n') + 2));
  const matches = candidates.filter(body => createHash('sha256').update(body, 'utf8').digest('hex') === entry.sha256 && Buffer.byteLength(body, 'utf8') === entry.bytes);
  const pass = matches.length === 1; report.promptHashes.push({ sourcePath: entry.sourcePath, block: entry.block, sha256: entry.sha256, pass });
  check(`${entry.sourcePath} ${entry.block} exact original bytes`, pass);
}
const personal = exerciseTexts.find(([path]) => path.endsWith('00-personalize.md'))[1];
check('Source-fact approval precedes portfolio implementation', personal.indexOf('## Source-fact approval gate') < personal.indexOf('## Explore and refine') && personal.includes('before requesting the personalization proposal') && personal.includes('Wait for my approval.'));
const files = [['README.md', readme], ...exerciseTexts];
for (const file of ['docs/pre-class.md', 'docs/deploy-firebase.md', 'docs/slides/README.md', 'docs/curriculum-review.md']) files.push([file, await read(file)]);
function slug(text) { return text.toLowerCase().replace(/[^\p{L}\p{N}_\- ]/gu, '').replaceAll(' ', '-'); }
for (const [path, text] of files) {
  for (const match of text.matchAll(/(?<!!)\[[^\]]*\]\(([^)]+)\)/g)) {
    const destination = match[1]; if (/^[a-z][a-z\d+.-]*:/i.test(destination)) continue;
    const [relative, anchor] = destination.split('#'); const target = relative ? resolve(root, dirname(path), relative) : resolve(root, path);
    report.linksChecked++;
    try {
      await stat(target);
      if (anchor && target.endsWith('.md')) {
        const source = await readFile(target, 'utf8');
        const headings = [...source.matchAll(/^#{1,6} (.+)$/gm)].map(x => slug(x[1]));
        check(`Link anchor ${path} → ${destination}`, headings.includes(anchor));
      }
    } catch { check(`Relative link ${path} → ${destination}`, false); }
  }
}
check('Core stopping point and continuation scope', readme.includes('stop after Lesson 5') && readme.includes('Lessons 6–10'));
report.result = report.failures.length ? 'fail' : 'pass';
await writeFile(resolve(root, 'docs/curriculum-materials-review.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ result: report.result, lessons: report.lessons.length, checks: report.checks.length, preservedBlocks: report.promptHashes.length, relativeLinks: report.linksChecked, failures: report.failures }, null, 2));
if (report.failures.length) process.exitCode = 1;
