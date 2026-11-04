import { chromium } from 'playwright';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const base = process.env.TEST_BASE_URL;
if (!base || process.env.TEST_MODEL_FIXTURES !== 'true') throw new Error('Run with the Auth/Hosting/Functions harness and --model-fixtures.');
const users = JSON.parse(await readFile(process.env.TEST_AUTH_USERS_FILE, 'utf8'));
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const directory = '/tmp/job-workspace-browser-evidence'; await mkdir(directory, { recursive: true });
const outcomes = []; let activePage;
try {
  for (const width of [375, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await context.newPage(); activePage = page; page.setDefaultTimeout(15000); const errors = []; const sends = []; page.on('request', request => { if (/\/send$/.test(new URL(request.url()).pathname)) sends.push(request.url()); }); page.on('pageerror', error => errors.push(error.message));
    async function api(path, method = 'GET', body) { return page.evaluate(async ({ path, method, body }) => { const response = await fetch(path, { method, headers: body === undefined ? {} : { 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }); const value = await response.json(); if (!response.ok) throw new Error(`${response.status}: ${value.error}`); return value; }, { path, method, body }); }
    const noOverflow = async label => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${label} overflow at ${width}px`);
    await page.goto(base + '/');
    const publicLink = page.getByRole('link', { name: 'Download résumé (PDF)' }); await publicLink.focus();
    assert.equal(await publicLink.evaluate(element => getComputedStyle(element).outlineStyle !== 'none'), true);
    const download = page.waitForEvent('download'); await publicLink.click(); assert.match((await download).suggestedFilename(), /^james-terrell-singleton-resume-\d{4}\.pdf$/); await noOverflow('Public page');
    await page.goto(base + '/dashboard/jobs'); await page.waitForURL('**/login');
    await page.locator('#role').selectOption('terrell'); const owner = users.find(user => user.role === 'terrell');
    await page.getByLabel('Email', { exact: true }).fill(owner.email); await page.getByLabel('Password', { exact: true }).fill(owner.password); await page.getByRole('button', { name: 'Continue as Terrell', exact: true }).click(); await page.waitForURL('**/dashboard');
    const generationAttempts = [];
    if (width === 1440) await page.route('**/artifacts/cover-letter/generate', async route => { generationAttempts.push(route.request().postDataJSON().attemptId); const response = await route.fetch(); if (generationAttempts.length === 1) await route.abort('connectionreset'); else await route.fulfill({ response }); });
    const jd = `Engineer at Acme. React. Build business applications. Browser ${width} [fixture:success]`;
    await page.goto(base + '/dashboard/cover-letter'); await page.locator('#jd').fill(jd); await page.getByRole('button', { name: 'Run tool', exact: true }).click(); await page.waitForURL('**/dashboard/jobs/**');
    if (width === 1440) {
      await page.getByRole('button', { name: 'Reconcile attempt', exact: true }).waitFor(); await page.reload(); await page.getByRole('link', { name: 'Download PDF', exact: true }).waitFor(); assert.equal(generationAttempts.length, 1, 'Reload must not repeat a lost successful generation');
      const reconciled = page.waitForResponse(response => response.url().endsWith('/artifacts/cover-letter/generate')); await page.getByRole('button', { name: 'Reconcile attempt', exact: true }).click(); assert.equal((await (await reconciled).json()).replay, true); await page.getByRole('button', { name: 'Reconcile attempt', exact: true }).waitFor({ state: 'hidden' }); assert.equal(generationAttempts[0], generationAttempts[1]); await page.unroute('**/artifacts/cover-letter/generate');
    }
    await page.getByRole('link', { name: 'Download PDF', exact: true }).waitFor(); const id = new URL(page.url()).pathname.split('/').at(-1);
    assert.equal(await page.getByRole('button', { name: 'Undo / Switch back', exact: true }).count(), 0); assert.equal(await page.getByRole('heading', { name: 'Compare Current and Previous' }).count(), 0);
    const notes = page.locator('section.panel').filter({ has: page.getByRole('heading', { name: 'Private interview notes', exact: true }) });
    await notes.getByLabel('Interview observations', { exact: true }).fill(`PRIVATE-BROWSER-NOTE-${width}`); await notes.getByText('Saved', { exact: true }).waitFor();
    const first = await api(`/api/job-workspaces/${id}/artifacts/cover-letter`);
    // Controlled unequal-length sections exercise comparison alignment without changing saved source documents.
    await page.route('**/api/job-workspaces/*/artifacts/cover-letter/versions/*', async route => { const response = await route.fetch(); const saved = await response.json(); if (saved.version) saved.markdown = `# Opening\n\n${saved.markdown}\n\n# ${saved.version.mode === 'initial' ? 'Earlier ending' : 'Focused examples'}\n\n` + ('Comparison paragraph. '.repeat(saved.version.mode === 'initial' ? 80 : 180)); await route.fulfill({ response, json: saved }); });
    await page.getByLabel('Requested changes', { exact: true }).fill('Make the opening more direct.'); await page.getByRole('button', { name: 'Revise', exact: true }).click(); await page.getByRole('heading', { name: 'Current · revise', exact: true }).waitFor(); await page.getByRole('heading', { name: 'Compare Current and Previous', exact: true }).waitFor();
    await page.getByLabel('Synchronize scrolling', { exact: true }).check();
    const scroll = page.locator('.comparison-scroll:visible').last(); await scroll.focus(); await scroll.press('PageDown'); await page.waitForTimeout(200); assert.ok(await scroll.evaluate(element => element.scrollTop > 0));
    await page.getByLabel('Synchronize scrolling', { exact: true }).uncheck();
    if (width === 375) { await page.getByRole('tab', { name: 'Previous', exact: true }).click(); assert.equal(await page.locator('.comparison-previous').isVisible(), true); await page.getByRole('tab', { name: 'Current', exact: true }).click(); }
    await noOverflow('Comparison'); await page.screenshot({ path: `${directory}/compare-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Start over', exact: true }).click(); await page.getByRole('heading', { name: 'Current · start-over', exact: true }).waitFor();
    const third = await api(`/api/job-workspaces/${id}/artifacts/cover-letter`); assert.equal(third.previous.id === first.current.id, false);
    const retired = await page.evaluate(async path => (await fetch(path)).status, `/api/job-workspaces/${id}/artifacts/cover-letter/versions/${first.current.id}`); assert.equal(retired, 410);
    await page.getByRole('button', { name: 'Undo / Switch back', exact: true }).click(); await page.getByRole('heading', { name: 'Current · revise', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Undo / Switch back', exact: true }).click(); await page.getByRole('heading', { name: 'Current · start-over', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Undo / Switch back', exact: true }).click(); await page.getByRole('heading', { name: 'Current · revise', exact: true }).waitFor();
    const swappedPair = await api(`/api/job-workspaces/${id}/artifacts/cover-letter`); const selectedPdf = await page.getByRole('link', { name: 'Download PDF', exact: true }).getAttribute('href'); assert.ok(selectedPdf.includes(swappedPair.current.id));
    const selectedHash = await page.evaluate(async path => { const bytes = await (await fetch(path)).arrayBuffer(); return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(value => value.toString(16).padStart(2, '0')).join(''); }, selectedPdf); assert.equal(selectedHash, swappedPair.current.pdf.content.hash);
    await page.reload(); await page.getByRole('heading', { name: 'Current · revise', exact: true }).waitFor(); assert.equal(await notes.getByLabel('Interview observations', { exact: true }).inputValue(), `PRIVATE-BROWSER-NOTE-${width}`);
    await page.unroute('**/api/job-workspaces/*/artifacts/cover-letter/versions/*');
    for (const [kind, label] of [['resume', 'Tailored résumé'], ['job-fit', 'Job Fit'], ['interview-prep', 'Interview Prep'], ['study-plan', 'Study Plan']]) {
      await page.getByLabel('Application material', { exact: true }).selectOption(kind); const generated = page.waitForResponse(response => response.url().endsWith(`/artifacts/${kind}/generate`) && response.request().method() === 'POST'); await page.getByRole('button', { name: `Generate ${label}`, exact: true }).click(); assert.equal((await generated).status(), 200); await page.getByRole('heading', { name: 'Current · initial', exact: true }).waitFor();
      const pair = await api(`/api/job-workspaces/${id}/artifacts/${kind}`); assert.equal(pair.current.pdf.state, kind === 'resume' ? 'ready' : 'not-requested');
      if (kind !== 'resume') { await page.getByRole('button', { name: 'Generate PDF', exact: true }).click(); await page.getByRole('link', { name: 'Download PDF', exact: true }).waitFor(); }
      await noOverflow(kind);
    }
    await page.route('**/artifacts/study-plan/generate', route => route.fulfill({ status: 502, json: { error: 'Controlled replacement failure.' } }));
    const beforeFailure = await api(`/api/job-workspaces/${id}/artifacts/study-plan`);
    await page.getByRole('button', { name: 'Start over', exact: true }).click(); await page.getByRole('alert').filter({ hasText: 'Controlled replacement failure.' }).waitFor();
    assert.equal((await api(`/api/job-workspaces/${id}/artifacts/study-plan`)).current.id, beforeFailure.current.id);
    await page.unroute('**/artifacts/study-plan/generate');
    await page.route('**/notes', route => route.request().method() === 'PUT' ? route.fulfill({ status: 409, json: { error: 'Controlled stale note save.' } }) : route.continue());
    const noteField = notes.locator('textarea').first(); await noteField.fill('FAILED-SAVE-RETAINED-LOCALLY'); await notes.getByText('Save failed', { exact: true }).waitFor(); assert.equal(await noteField.inputValue(), 'FAILED-SAVE-RETAINED-LOCALLY'); await page.unroute('**/notes');
    await page.getByText('Job details and saved description', { exact: true }).click(); await page.getByLabel('Company', { exact: true }).fill(`Corrected Acme ${width}`); await page.getByRole('button', { name: 'Save job details', exact: true }).click(); await page.getByRole('heading', { level: 1, name: new RegExp(`Corrected Acme ${width}`) }).waitFor();
    await page.getByLabel('Saved job description', { exact: true }).fill(jd + '\nUpdated requirements.'); await page.getByRole('button', { name: 'Save description update', exact: true }).click(); await page.getByText('Based on an earlier job description.', { exact: false }).waitFor();
    const reused = await api('/api/job-workspaces', 'POST', { jobDescription: jd, attemptId: crypto.randomUUID() }); assert.equal(reused.workspace.id, id);
    const missingJob = await api('/api/job-workspaces', 'POST', { jobDescription: `Missing résumé Engineer at Acme. React. ${width} [fixture:success]`, attemptId: crypto.randomUUID() });
    await page.goto(base + '/dashboard/inbox'); await page.getByRole('button', { name: 'Compose', exact: true }).click(); const composer = page.getByRole('region', { name: 'Mail composer', exact: true });
    await composer.getByLabel('TO', { exact: true }).fill(`browser-${width}@example.test`); await composer.getByLabel('Subject', { exact: true }).fill('MY EDITED SUBJECT'); await composer.getByLabel('Message', { exact: true }).fill('MY MANUAL COPY');
    await composer.locator('input[type=file]').setInputFiles({ name: 'manual.txt', mimeType: 'text/plain', buffer: Buffer.from('MANUAL-BROWSER-CONTENT') });
    const appTools = composer.locator('details.mail-html-section').filter({ hasText: 'Choose a saved job.' }).first(); await appTools.locator('summary').first().click(); await appTools.getByLabel('Job workspace', { exact: true }).selectOption(id);
    await appTools.getByText('Preview job application copy', { exact: true }).click(); assert.equal(await composer.getByLabel('Subject', { exact: true }).inputValue(), 'MY EDITED SUBJECT');
    const applicationResponse = page.waitForResponse(response => response.url().endsWith('/application-draft') && response.request().method() === 'POST'); await appTools.getByRole('button', { name: 'Use job application template', exact: true }).click(); const preparedApplication = await (await applicationResponse).json(); assert.ok(preparedApplication.link); await composer.getByText('Saved application document snapshots:', { exact: true }).waitFor();
    assert.match(await composer.getByLabel('Message', { exact: true }).inputValue(), /résumé and cover letter attached/); assert.equal(await composer.getByLabel('TO', { exact: true }).inputValue(), `browser-${width}@example.test`);
    const pinnedResume = preparedApplication.link.snapshots.find(file => file.kind === 'resume');
    for (let replacement = 0; replacement < 2; replacement++) { const job = await api(`/api/job-workspaces/${id}`); const pair = job.artifacts.resume; await api(`/api/job-workspaces/${id}/artifacts/resume/generate`, 'POST', { attemptId: crypto.randomUUID(), mode: 'start-over', expectedState: pair.state, descriptionId: job.workspace.descriptionId, settings: {} }); }
    const retiredPdf = await page.evaluate(async path => (await fetch(path)).status, `/api/job-workspaces/${id}/artifacts/resume/versions/${pinnedResume.versionId}/files/pdf`); assert.equal(retiredPdf, 410);
    const retainedDraft = await api(`/api/inbox/drafts/${preparedApplication.link.draftId}`); assert.equal(retainedDraft.attachments.length, 3);
    await composer.getByLabel('Message', { exact: true }).fill('KEEP THESE MANUAL EDITS'); await appTools.getByRole('button', { name: 'Refresh documents', exact: true }).click(); await composer.getByText('Saved', { exact: true }).waitFor(); assert.equal(await composer.getByLabel('Message', { exact: true }).inputValue(), 'KEEP THESE MANUAL EDITS'); assert.ok((await composer.textContent()).includes('manual.txt'));
    await appTools.getByRole('button', { name: 'Edit tailored résumé', exact: true }).click(); await page.waitForURL('**/dashboard/jobs/**'); await page.getByRole('link', { name: 'Return to application email', exact: true }).waitFor(); await context.clearCookies(); await page.getByRole('link', { name: 'Return to application email', exact: true }).click(); await page.waitForURL('**/login?applicationReturn=*');
    await page.locator('#role').selectOption('terrell'); await page.getByLabel('Email', { exact: true }).fill(owner.email); await page.getByLabel('Password', { exact: true }).fill(owner.password); await page.getByRole('button', { name: 'Continue as Terrell', exact: true }).click(); await page.waitForURL('**/dashboard/inbox?applicationReturn=*');
    await composer.getByLabel('Message', { exact: true }).waitFor(); assert.equal(await composer.getByLabel('Message', { exact: true }).inputValue(), 'KEEP THESE MANUAL EDITS'); assert.ok((await composer.textContent()).includes('manual.txt')); await noOverflow('Returned composer'); await page.screenshot({ path: `${directory}/application-${width}.png`, fullPage: true });
    // Exercise both missing-résumé choices, an initially blank composer and save-before-navigation failure.
    await composer.getByRole('button', { name: 'Close composer', exact: true }).click(); await page.getByRole('button', { name: 'Compose', exact: true }).click();
    const choices = composer.locator('details.mail-html-section').filter({ hasText: 'Choose a saved job.' }).first(); await choices.locator('summary').first().click(); await choices.getByLabel('Job workspace', { exact: true }).selectOption(missingJob.workspace.id); await choices.getByText('No tailored résumé is saved for this job.', { exact: true }).waitFor();
    await page.route('**/api/inbox/drafts', route => route.request().method() === 'POST' ? route.fulfill({ status: 503, json: { error: 'Controlled native save failure.' } }) : route.continue());
    await choices.getByRole('button', { name: 'Create tailored résumé', exact: true }).click(); await composer.getByRole('alert').filter({ hasText: 'Controlled native save failure.' }).waitFor(); assert.ok(page.url().includes('/dashboard/inbox')); assert.match(await composer.getByLabel('Subject', { exact: true }).inputValue(), /Engineer.*Acme/); assert.doesNotMatch(await composer.getByLabel('Message', { exact: true }).inputValue(), /attached/); await page.unroute('**/api/inbox/drafts');
    await choices.getByRole('button', { name: 'Create tailored résumé', exact: true }).click(); await page.waitForURL('**/dashboard/jobs/**'); assert.ok(page.url().includes(missingJob.workspace.id));
    await page.getByRole('link', { name: 'Return to application email', exact: true }).click(); await page.waitForURL('**/dashboard/inbox?applicationReturn=*');
    await choices.getByRole('button', { name: 'Use standard résumé', exact: true }).click(); await choices.getByRole('button', { name: 'Use job application template', exact: true }).click(); await composer.getByText(/james-terrell-singleton-.*resume-\d{4}\.pdf/).first().waitFor();
    const fallbackPreparation = await api(`/api/job-workspaces/application-returns/${new URL(page.url()).searchParams.get('applicationReturn')}`); const snapshot = await api(`/api/job-workspaces/application-drafts/${fallbackPreparation.draftId}`); const standard = snapshot.link.snapshots.find(file => file.kind === 'standard'); assert.ok(standard);
    const publicHash = await page.evaluate(async () => { const bytes = await (await fetch('/resume.pdf')).arrayBuffer(); return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(value => value.toString(16).padStart(2, '0')).join(''); }); assert.equal(standard.hash, publicHash);
    await choices.getByRole('button', { name: 'Create tailored résumé', exact: true }).click(); await page.waitForURL('**/dashboard/jobs/**'); await page.getByRole('button', { name: 'Generate Tailored résumé', exact: true }).click(); await page.getByRole('link', { name: 'Download PDF', exact: true }).waitFor(); await page.getByRole('link', { name: 'Return to application email', exact: true }).click(); await page.waitForURL('**/dashboard/inbox?applicationReturn=*');
    await choices.getByRole('button', { name: 'Refresh documents', exact: true }).click(); await composer.getByText('Saved', { exact: true }).waitFor(); const refreshedMissing = await api(`/api/job-workspaces/application-drafts/${fallbackPreparation.draftId}`); assert.ok(refreshedMissing.link.snapshots.some(file => file.kind === 'resume')); assert.equal(refreshedMissing.link.snapshots.some(file => file.kind === 'standard'), false);
    assert.equal(sends.length, 0, 'Template, refresh, fallback and tailoring actions must never send');
    assert.deepEqual(errors, []); outcomes.push({ width, workspaceId: id, tools: 5, compare: true, notes: true, applicationRoundTrip: true, reauthenticatedReturn: true, lostResponseReconciled: width === 1440, missingResumeChoices: true, saveFailureRetained: true, sent: false }); await context.close();
  }
  await writeFile(`${directory}/results.json`, JSON.stringify(outcomes, null, 2)); console.log(JSON.stringify({ passed: true, evidence: directory, outcomes }));
} catch (error) { if (activePage) await activePage.screenshot({ path: `${directory}/failure.png`, fullPage: true }).catch(() => {}); throw error; }
finally { await browser.close(); }
