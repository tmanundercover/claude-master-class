import { emulatorOwnerBrowserSignIn } from './emulator-auth.mjs';
// Controlled generation through Auth, Hosting, and Functions emulators; no provider calls.
import { chromium } from 'playwright';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const base = process.env.TEST_BASE_URL;
if (!base || process.env.TEST_MODEL_FIXTURES !== 'true') throw new Error('Run through the Firebase emulator harness with --model-fixtures.');
const users = JSON.parse(await readFile(process.env.TEST_AUTH_USERS_FILE, 'utf8'));
const owner = users.find(user => user.role === 'terrell');
const directory = '.firebase/fit-scoring-browser';
await mkdir(directory, { recursive: true });
const posting = '[fixture:fit-success] Required: React. Responsibilities: Build business applications. Preferred: Kubernetes. Location: Boston. Hybrid: three days on site.';
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const results = [];
try {
  for (const width of [375, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/dashboard/fit-analyzer`);
    await page.waitForURL('**/login');
     await emulatorOwnerBrowserSignIn(page, owner.email);
    await page.waitForURL('**/dashboard');
    await page.getByRole('link', { name: /Job Fit Analyzer/ }).click();
    await page.waitForURL('**/dashboard/fit-analyzer');
    let caseNumber = 0;
    async function run(jd, status = 200) {
      await page.goto(`${base}/dashboard/fit-analyzer`);
      jd += ` Requisition browser-${width}-${++caseNumber}.`;
      await page.locator('#jd').fill(jd);
      const pending = page.waitForResponse(response => response.url().endsWith('/artifacts/job-fit/generate'));
      await page.getByRole('button', { name: 'Run tool', exact: true }).click();
      const response = await pending;
      assert.equal(response.status(), status);
      const value = await response.json(); return response.ok() ? value.result : value;
    }
    const result = await run(posting);
    assert.equal(result.score, 80);
    await page.getByRole('heading', { name: 'Technical & role fit', exact: true }).waitFor();
    await page.getByLabel('Technical and role fit: 80 out of 100', { exact: true }).waitFor();
    assert.equal(await page.locator('.fit-breakdown-card').count(), 3);
    for (const label of ['Supported', 'Partially supported', 'Unsupported evidence']) await page.locator('.fit-requirement-list').getByText(label, { exact: true }).waitFor();
    assert.deepEqual(result.breakdown.map(group => group.contribution), [70, 10, 0]);
    const business = page.locator('.fit-requirement-list > li').filter({ has: page.getByText('Build business applications', { exact: true }) });
    await business.locator('.fit-references summary').click();
    await business.getByText(result.requirements[1].references[0].text, { exact: true }).waitFor();
    assert.equal(await page.locator('.fit-logistics-card').count(), 2);
    assert.equal(await page.locator('.fit-logistics-card .fit-status').getByText('Needs confirmation', { exact: true }).count(), 2);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    await page.screenshot({ path: `${directory}/breakdown-${width}.png`, fullPage: true });
    const missing = await run('[fixture:fit-missing-category] Required: React.');
    assert.equal(missing.score, 100);
    assert.deepEqual(missing.breakdown.map(group => group.effectiveWeight), [100, 0, 0]);
    await page.getByLabel('Technical and role fit: 100 out of 100', { exact: true }).waitFor();
    assert.equal(await page.locator('.fit-logistics-card .fit-status').getByText('Not stated', { exact: true }).count(), 2);
    const empty = await run('[fixture:fit-logistics-only] Location: Boston. Hybrid: three days on site.');
    assert.equal(empty.score, null);
    await page.getByLabel('No scorable requirements stated', { exact: true }).waitFor();
    assert.equal(await page.locator('.fit-requirement-list').count(), 0);
    for (const marker of ['fit-unknown-reference', 'fit-provider-score', 'malformed']) {
      await run(`[fixture:${marker}] Required: React.`, 502);
      await page.getByRole('alert').filter({ hasText: /did not match/ }).waitFor();
      assert.equal(await page.locator('.fit-result').count(), 0);
    }
    await run('[fixture:rate-limit] Required: React.', 429);
    await page.getByRole('alert').filter({ hasText: /17 seconds/ }).waitFor();
    // A successful-looking API envelope with bad arithmetic must fail client validation.
    await page.route('**/artifacts/job-fit/versions/*', async route => { const response = await route.fetch(); const saved = await response.json(); await route.fulfill({ response, json: { ...saved, result: { ...saved.result, score: 99 } } }); }, { times: 1 });
    await run(posting);
    await page.getByRole('alert').filter({ hasText: 'invalid job-fit result' }).waitFor();
    assert.equal(await page.locator('.fit-result').count(), 0);
    await run(posting);
    await page.getByRole('heading', { name: 'Technical & role fit', exact: true }).waitFor();
    let release, reached;
    const gate = new Promise(resolve => { release = resolve; });
    const started = new Promise(resolve => { reached = resolve; });
    await page.route('**/artifacts/job-fit/generate', async route => { reached(); await gate; await route.fulfill({ status: 502, json: { error: 'Controlled provider failure.' } }); }, { times: 1 });
    await page.getByRole('button', { name: 'Start over', exact: true }).click();
    await started;
    assert.equal(await page.locator('.fit-result').count(), 1);
    await page.getByRole('status').filter({ hasText: 'Your saved documents remain available.' }).waitFor();
    release();
    await page.getByRole('alert').filter({ hasText: 'Controlled provider failure.' }).waitFor();
    assert.equal(await page.locator('.fit-result').count(), 1);
    assert.deepEqual(errors, []);
    results.push({ width, score: 80, weightedBreakdown: true, classificationsAndReferences: true, separateLogistics: true,
      missingCategoriesNormalized: true, logisticsOnlyScore: null, invalidEvidenceRejected: true,
      numericProviderScoreRejected: true, clientArithmeticValidated: true, savedAnalysisPreservedDuringFailedReplacement: true, noOverflow: true, errors });
    await context.close();
  }
  await writeFile(`${directory}/results.json`, JSON.stringify({ controlledModelFixture: true, results }, null, 2) + '\n');
  console.log(JSON.stringify(results));
} finally { await browser.close(); }
