import { chromium } from 'playwright';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const base = process.env.TEST_BASE_URL;
if (!base || !process.env.TEST_AUTH_USERS_FILE) throw new Error('Run through scripts/test-firebase-emulator.mjs --browser-script scripts/test-mail-browser.mjs');
const users = JSON.parse(await readFile(process.env.TEST_AUTH_USERS_FILE, 'utf8'));
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const screenshots = '/tmp/owner-inbox-browser-evidence'; await mkdir(screenshots, { recursive: true });
const evidence = [];
let activePage;
try {
  for (const width of [375, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await context.newPage(), errors = [];
    async function openTool(name) { await page.getByLabel('Account menu', { exact: true }).click(); await page.getByRole('navigation', { name: 'Mailbox tools' }).getByRole('button', { name, exact: true }).click(); } activePage = page; page.setDefaultTimeout(12000);
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error' && /hydration|hydrating|Minified React/.test(message.text())) errors.push(message.text()); });
    const visitor = `Browser Visitor ${width}`;
    await page.goto(`${base}/#contact`);
    const form = page.locator('.contact-form');
    await form.getByLabel('Name', { exact: true }).fill(visitor);
    await form.getByLabel('Email', { exact: true }).fill(`browser-${width}@example.test`);
    await form.getByLabel('What would you like to discuss?').fill(`Browser acceptance ${width}`);
    for (const field of ['Name', 'Email', 'What would you like to discuss?']) {
      await form.getByLabel(field, { exact: true }).focus();
      const collisions = await form.evaluate(form => {
        const focused = document.activeElement, rect = focused.getBoundingClientRect(), style = getComputedStyle(focused);
        const outset = parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
        return Array.from(form.querySelectorAll('input:not([name=website]),textarea,button')).filter(element => element !== focused).filter(element => { const other = element.getBoundingClientRect(); return rect.left - outset < other.right && rect.right + outset > other.left && rect.top - outset < other.bottom && rect.bottom + outset > other.top; }).length;
      });
      assert.equal(collisions, 0, `${field} focus ring overlaps another control at ${width}px`);
    }
    await form.screenshot({ path: `${screenshots}/contact-focus-${width}.png` });
    const contactKeys = [];
    if (width === 1440) await page.route('**/api/contact', async route => {
      contactKeys.push(route.request().postDataJSON().attempt);
      if (contactKeys.length === 1) { await route.fetch(); await route.abort('connectionreset'); } else await route.continue();
    });
    await form.getByRole('button', { name: 'Send message', exact: true }).click();
    if (width === 1440) {
      await form.getByRole('status').filter({ hasText: 'couldn’t confirm' }).waitFor();
      assert.equal(await form.getByLabel('What would you like to discuss?').inputValue(), `Browser acceptance ${width}`);
      await form.getByRole('button', { name: 'Send message', exact: true }).click();
    }
    await form.getByRole('status').filter({ hasText: 'Your response was recorded for James Terrell Singleton.' }).waitFor();
    if (width === 1440) { assert.equal(contactKeys.length, 2); assert.equal(contactKeys[0], contactKeys[1]); await page.unroute('**/api/contact'); }
    assert.equal(new URL(page.url()).search, '');
    if (width === 1440) {
      await form.getByLabel('Name', { exact: true }).fill(visitor);
      await form.getByLabel('Email', { exact: true }).fill('feedback@example.test');
      await form.getByLabel('What would you like to discuss?').fill('Keep this response if sending fails.');
      await page.route('**/api/contact', route => route.fulfill({ status: 503, json: { error: 'PRIVATE-PROVIDER-ERROR-SENTINEL', code: 'unavailable' } }));
      await form.getByRole('button', { name: 'Send message', exact: true }).click();
      await form.getByRole('status').filter({ hasText: 'We couldn’t send your response to James Terrell Singleton.' }).waitFor();
      assert.equal(await form.getByLabel('What would you like to discuss?').inputValue(), 'Keep this response if sending fails.');
      assert.equal(await form.getByText('PRIVATE-PROVIDER-ERROR-SENTINEL').count(), 0);
      await page.unroute('**/api/contact');
      await page.route('**/api/contact', route => route.fulfill({ status: 202, json: { status: 'accepted', localTest: false } }));
      await form.getByRole('button', { name: 'Send message', exact: true }).click();
      await form.getByRole('status').filter({ hasText: 'Your response was recorded and shared with James Terrell Singleton. He’ll also receive an email.' }).waitFor();
      assert.equal(await form.getByLabel('What would you like to discuss?').inputValue(), '');
      await page.unroute('**/api/contact');
    }

    await page.goto(`${base}/dashboard/inbox`); await page.waitForURL('**/login');
    await page.locator('#role').selectOption('terrell');
    const owner = users.find(user => user.role === 'terrell');
    await page.getByLabel('Email', { exact: true }).fill(owner.email); await page.getByLabel('Password', { exact: true }).fill(owner.password);
    await page.getByRole('button', { name: 'Continue as Terrell', exact: true }).click(); await page.waitForURL('**/dashboard');
    const dashboardInbox = page.getByRole('region', { name: 'Inbox summary', exact: true });
    await dashboardInbox.getByText('Local test inbox', { exact: true }).waitFor();
    const refreshInbox = dashboardInbox.getByRole('button', { name: 'Refresh inbox', exact: true });
    assert.equal(await refreshInbox.textContent(), '');
    assert.equal(await refreshInbox.locator('svg').count(), 1);
    const summaryReload = page.waitForResponse(response => response.url().endsWith('/api/inbox/summary'));
    await refreshInbox.click(); await summaryReload;
    await dashboardInbox.locator('.mail-row').filter({ hasText: `Website message from ${visitor}` }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1), false, `Dashboard horizontal overflow at ${width}`);
    await dashboardInbox.screenshot({ path: `${screenshots}/dashboard-inbox-${width}.png` });
    await dashboardInbox.getByRole('link', { name: 'Open inbox', exact: true }).click();
    await page.locator('.inbox-card').getByText('Local test inbox', { exact: false }).waitFor();
    await page.getByRole('button', { name: 'Copy owner email', exact: true }).click();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'terrell.singleton@thehandsomestnerd.com');
    // Stall each folder read so loading and wrong-folder flashes are observable.
    const folderNav = page.getByRole('navigation', { name: 'Mail folders' });
    const seedThread = await page.evaluate(async () => (await (await fetch('/api/inbox/threads?folder=inbox')).json()).data[0]);
    let pendingFolder;
    const folderPattern = '**/api/inbox/threads?**', draftPattern = '**/api/inbox/drafts';
    async function delayedFolder(route) {
      const url = new URL(route.request().url()), name = url.pathname.endsWith('/drafts') ? 'drafts' : url.searchParams.get('folder');
      const pending = pendingFolder;
      if (!pending || pending.name !== name || route.request().method() !== 'GET') return route.continue();
      pending.started(); await pending.gate;
      await route.fulfill({ json: { data: [name === 'drafts' ? { id: 'loading-draft', to: ['visitor@example.test'], subject: 'Folder view drafts', updated_at: seedThread.received_at } : { ...seedThread, folder: name, subject: `Folder view ${name}` }], has_more: false } }).catch(() => {});
    }
    await page.route(folderPattern, delayedFolder); await page.route(draftPattern, delayedFolder);
    await page.evaluate(() => {
      window.__folderPaints = [];
      window.__folderObserver = new MutationObserver(() => {
        const list = document.querySelector('.mail-list');
        if (list) window.__folderPaints.push({ heading: list.querySelector('h2')?.textContent, subjects: Array.from(list.querySelectorAll('.mail-row-subject')).map(row => row.textContent) });
      });
      window.__folderObserver.observe(document.querySelector('.mail-content'), { childList: true, subtree: true, characterData: true });
    });
    for (const name of ['sent', 'archive', 'spam', 'trash', 'inbox', 'drafts']) {
      let started, release;
      const ready = new Promise(resolve => { started = resolve; }), gate = new Promise(resolve => { release = resolve; });
      pendingFolder = { name, started, gate };
      await page.evaluate(() => { window.__folderPaints = []; });
      const folderButton = folderNav.getByRole('button', { name: name[0].toUpperCase() + name.slice(1), exact: true });
      await folderButton.click();
      if (name === 'drafts') await page.getByRole('button', { name: 'Refresh mail', exact: true }).click();
      await ready;
      await page.waitForFunction(() => document.querySelector('.mail-folders [aria-pressed=true]')?.getAttribute('aria-busy') === 'true');
      assert.equal(await folderButton.locator('.mail-icon-loading').count(), 1);
      assert.equal(await folderNav.locator('button:not([aria-pressed=true]) .mail-icon-loading').count(), 0);
      assert.equal(await page.locator('.mail-list .mail-row').count(), 0);
      assert.equal(await page.locator('.mail-list .mail-empty').count(), 0);
      assert.equal(await page.getByRole('status').filter({ hasText: /Loading|Refreshing/ }).evaluateAll(nodes => nodes.some(node => !node.classList.contains('sr-only'))), false);
      const loadingBounds = await page.locator('.mail-list-heading').boundingBox();
      release(); await page.locator('.mail-thread').filter({ hasText: `Folder view ${name}` }).waitFor();
      assert.equal(await folderButton.locator('.mail-icon-loading').count(), 0);
      assert.deepEqual(await page.locator('.mail-list-heading').boundingBox(), loadingBounds);
      const paints = await page.evaluate(() => window.__folderPaints);
      const heading = name[0].toUpperCase() + name.slice(1);
      assert.equal(paints.filter(paint => paint.heading === heading).some(paint => paint.subjects.some(subject => subject !== `Folder view ${name}`)), false, `Wrong folder painted while loading ${name}`);
      pendingFolder = null;
    }
    // Refreshing the same resource keeps its own content, with no inserted notice.
    let startedRefresh, releaseRefresh;
    const refreshReady = new Promise(resolve => { startedRefresh = resolve; });
    pendingFolder = { name: 'drafts', started: startedRefresh, gate: new Promise(resolve => { releaseRefresh = resolve; }) };
    await page.getByRole('button', { name: 'Refresh mail', exact: true }).click(); await refreshReady;
    assert.equal(await page.locator('.mail-thread').filter({ hasText: 'Folder view drafts' }).count(), 1);
    releaseRefresh(); await page.waitForFunction(() => !document.querySelector('.mail-folders [aria-pressed=true] .mail-icon-loading'));
    pendingFolder = null; await page.unroute(folderPattern, delayedFolder); await page.unroute(draftPattern, delayedFolder);
    await page.evaluate(() => window.__folderObserver.disconnect()); await page.goto(`${base}/dashboard/inbox`);
    await page.locator('.mail-thread').filter({ hasText: `Website message from ${visitor}` }).waitFor();
    await page.getByLabel('Account menu', { exact: true }).click();
    await page.getByRole('button', { name: 'Sign out', exact: true }).waitFor();
    await page.screenshot({ path: `${screenshots}/account-menu-${width}.png`, fullPage: true });
    await page.keyboard.press('Escape'); assert.equal(await page.locator('.mail-account-menu[open]').count(), 0);
    assert.equal(await page.getByLabel('Account menu', { exact: true }).evaluate(node => node === document.activeElement), true);
    await page.getByLabel('Account menu', { exact: true }).click(); await page.locator('.mail-title').click();
    assert.equal(await page.locator('.mail-account-menu[open]').count(), 0);
    evidence.push({ width, folderLoadingIcons: ['inbox', 'sent', 'drafts', 'archive', 'spam', 'trash'], noWrongFolderPaints: true, sameFolderRefreshRetainsRows: true, noLoadingNoticeLayoutShift: true, accountMenuKeyboardAndDismissal: true });
    const filters = page.locator('.mail-filters');
    await filters.getByLabel('Search', { exact: true }).fill(`Browser acceptance ${width}`); await filters.getByRole('button', { name: 'Apply filters' }).click();
    await page.locator('.mail-thread').filter({ hasText: `Website message from ${visitor}` }).click();
    assert.equal(await page.evaluate(() => document.activeElement?.tagName), 'H2');
    await page.getByRole('region', { name: 'Conversation', exact: true }).getByRole('button', { name: 'Reply', exact: true }).first().click();
    let composer = page.getByRole('region', { name: 'Mail composer' });
    assert.equal(await composer.getByLabel('TO', { exact: true }).inputValue(), `browser-${width}@example.test`);
    await composer.getByLabel('Message', { exact: true }).fill(`Owner response ${width}`);
    await composer.getByRole('button', { name: 'Send message', exact: true }).click();
    await composer.getByRole('status').filter({ hasText: 'Accepted for sending' }).waitFor();
    await composer.getByRole('button', { name: 'Close composer' }).click();
    await page.locator('.mail-text').filter({ hasText: `Owner response ${width}` }).waitFor();
    await page.getByRole('button', { name: 'Back to conversations' }).click();
    await filters.getByLabel('Search', { exact: true }).fill(''); await filters.getByRole('button', { name: 'Apply filters' }).click();
    const firstRow = page.locator('.mail-row').first(); await firstRow.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Mark selected conversations read', exact: true }).click();
    await page.waitForFunction(() => !document.querySelector('.mail-row-checked'));
    await page.screenshot({ path: `${screenshots}/mail-list-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Next conversation page', exact: true }).click(); await page.getByRole('button', { name: 'First conversation page' }).click();
    await openTool('Labels');
    await page.getByLabel('Label name', { exact: true }).fill(`Follow up ${width}`); await page.getByLabel('Color', { exact: true }).fill('#3366aa'); await page.getByRole('button', { name: 'Create label' }).click();
    await page.getByRole('button', { name: `Edit Follow up ${width}` }).waitFor();
    await page.getByRole('button', { name: `Edit Follow up ${width}` }).click(); await page.getByLabel('Label name', { exact: true }).fill(`Priority ${width}`); await page.getByRole('button', { name: 'Save label', exact: true }).click();
    await page.getByRole('button', { name: `Edit Priority ${width}` }).waitFor();
    await openTool('Contacts');
    await page.getByLabel('First name', { exact: true }).fill('Visitor'); await page.getByLabel('Last name', { exact: true }).fill(String(width)); await page.getByLabel('Email', { exact: true }).fill(`saved-${width}@example.test`); await page.getByRole('button', { name: 'Add contact', exact: true }).click();
    await page.getByRole('button', { name: `Edit saved-${width}@example.test`, exact: true }).waitFor();
    await page.getByRole('button', { name: `Edit saved-${width}@example.test`, exact: true }).click(); await page.getByLabel('First name', { exact: true }).fill('Updated'); await page.getByRole('button', { name: 'Save contact', exact: true }).click();
    const draftWrites = [];
    const recordDraft = request => { if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/inbox/drafts') draftWrites.push(request.postDataJSON()); };
    page.on('request', recordDraft);
    await page.getByRole('button', { name: 'Compose', exact: true }).click();
    composer = page.getByRole('region', { name: 'Mail composer' });
    await page.waitForTimeout(1200);
    assert.equal(draftWrites.length, 0, 'Opening Compose must not create an empty draft');
    assert.equal(await composer.getByRole('alert').count(), 0);
    assert.equal(await composer.getByRole('button', { name: 'Save draft', exact: true }).isDisabled(), true);
    assert.equal(await composer.getByRole('button', { name: 'Close composer', exact: true }).isEnabled(), true);
    await composer.getByLabel('Subject', { exact: true }).fill('Temporary subject'); await composer.getByLabel('Subject', { exact: true }).fill('');
    await page.waitForTimeout(1200); assert.equal(draftWrites.length, 0, 'Clearing an unsaved draft must not create an empty draft');
    await composer.getByRole('button', { name: 'Send message', exact: true }).click();
    await composer.getByRole('alert').filter({ hasText: 'Add a recipient, subject, and message' }).waitFor();
    assert.equal(draftWrites.length, 0);
    assert.equal(await composer.getByRole('link', { name: 'Sign in in another tab' }).count(), 0);
    await composer.getByRole('button', { name: 'Close composer', exact: true }).click();
    await page.getByRole('button', { name: 'Compose', exact: true }).click();
    composer = page.getByRole('region', { name: 'Mail composer' });
    await composer.getByLabel('Message', { exact: true }).fill('Start with the message, before recipients or subject.');
    await composer.getByRole('status').filter({ hasText: /^Saved$/ }).waitFor();
    assert.equal(draftWrites.length, 1);
    assert.equal(draftWrites[0].content.subject, ''); assert.deepEqual(draftWrites[0].content.to, []);
    await composer.getByRole('button', { name: 'Discard draft', exact: true }).click();
    page.off('request', recordDraft);
    evidence.push({ width, pristineComposeHasNoWriteOrError: true, emptyComposerCloses: true, clearedUnsavedDraftStaysLocal: true, emptySendValidatesLocally: true, bodyOnlyDraftAutosaves: true });
    await page.getByRole('button', { name: 'Compose', exact: true }).click();
    composer = page.getByRole('region', { name: 'Mail composer' });
    await composer.getByLabel('TO', { exact: true }).fill(`saved-${width}@example.test`); await composer.getByLabel('CC', { exact: true }).fill('cc@example.test'); await composer.getByLabel('BCC', { exact: true }).fill('bcc@example.test');
    await composer.getByLabel('Subject', { exact: true }).fill(`Saved draft ${width}`); await composer.getByLabel('Message', { exact: true }).fill(`Draft content ${width}`);
    await composer.locator('input[type=file]').setInputFiles({ name: 'browser-note.txt', mimeType: 'text/plain', buffer: Buffer.from('Browser attachment') });
    // Browsing is read-only; Edit HTML makes an editable copy in this draft.
    await composer.locator('.mail-html-section > summary').filter({ hasText: 'HTML & templates' }).click();
    await composer.getByLabel('Email template', { exact: true }).selectOption('resume');
    await composer.getByRole('button', { name: 'Preview template', exact: true }).click();
    const preview = composer.frameLocator('iframe[title="HTML email preview"]');
    await preview.getByRole('heading', { name: 'James Terrell Singleton', exact: true }).waitFor();
    const linkedIn = preview.getByRole('link', { name: 'https://linkedin.com/in/terrell-singleton', exact: true });
    assert.equal(await linkedIn.getAttribute('href'), 'https://linkedin.com/in/terrell-singleton');
    assert.equal(await linkedIn.locator('strong').textContent(), 'terrell-singleton');
    assert.ok(await preview.locator('img').evaluateAll(images => images.every(img => img.complete && img.naturalWidth > 0)));
    assert.equal(await composer.getByLabel('Message', { exact: true }).inputValue(), `Draft content ${width}`);
    await composer.screenshot({ path: `${screenshots}/template-preview-${width}.png` });
    if (width === 1440) {
      const documentPage = await context.newPage(); await documentPage.setViewportSize({ width: 760, height: 1000 });
      await documentPage.setContent(await composer.locator('iframe[title="HTML email preview"]').getAttribute('srcdoc'));
      await documentPage.screenshot({ path: `${screenshots}/resume-document.png`, fullPage: true }); await documentPage.close();
    }
    await composer.getByRole('button', { name: 'Edit HTML', exact: true }).click();
    assert.equal(await composer.getByLabel('Subject', { exact: true }).inputValue(), 'James Terrell Singleton — Résumé');
    assert.equal(await composer.getByLabel('TO', { exact: true }).inputValue(), `saved-${width}@example.test`);
    assert.equal(await composer.getByLabel('CC', { exact: true }).inputValue(), 'cc@example.test');
    await composer.getByText('browser-note.txt', { exact: true }).waitFor();
    const templateHtml = await composer.getByLabel('HTML message', { exact: true }).inputValue();
    assert.ok(templateHtml.includes('/email-icons/react.png'));
    const oneTimeNote = `Additional information for this recruiter ${width}`;
    const customizedHtml = templateHtml.replace('</body>', `<p>${oneTimeNote}</p></body>`);
    await composer.getByLabel('HTML message', { exact: true }).fill(customizedHtml);
    await composer.getByRole('button', { name: 'Preview', exact: true }).click();
    await preview.getByText(oneTimeNote, { exact: true }).waitFor();
    await composer.getByLabel('Preview content', { exact: true }).selectOption('template');
    await preview.getByRole('heading', { name: 'James Terrell Singleton', exact: true }).waitFor();
    await preview.getByText(oneTimeNote, { exact: true }).waitFor({ state: 'hidden' });
    assert.equal(await preview.getByText(oneTimeNote, { exact: true }).count(), 0, 'One-time edits must not change the template');
    await composer.getByRole('button', { name: 'Edit HTML', exact: true }).click();
    assert.equal(await composer.getByLabel('HTML message', { exact: true }).inputValue(), customizedHtml, 'Editing again must retain the draft copy');
    await composer.getByLabel('HTML message', { exact: true }).fill('');
    await composer.getByRole('button', { name: 'Preview', exact: true }).click();
    await preview.getByText('No HTML in this message yet. Choose a template or edit the HTML.', { exact: true }).waitFor();
    await composer.getByRole('button', { name: 'Edit HTML', exact: true }).click();
    assert.equal(await composer.getByLabel('HTML message', { exact: true }).inputValue(), '', 'Intentionally cleared HTML must stay cleared');
    await composer.getByLabel('HTML message', { exact: true }).fill(customizedHtml);
    if (width === 1440) {
      const originalHtml = await composer.getByLabel('HTML message', { exact: true }).inputValue();
      let previewRequests = 0;
      await page.route('https://preview-tracker.invalid/**', route => { previewRequests++; return route.abort(); });
      await composer.getByLabel('HTML message', { exact: true }).fill('<p>Edited preview</p><script>parent.__templateAttack=true</script><img src="https://preview-tracker.invalid/pixel.png">');
      await composer.getByRole('button', { name: 'Preview', exact: true }).click();
      await preview.getByText('Edited preview', { exact: true }).waitFor();
      assert.equal(await composer.locator('iframe[title="HTML email preview"]').getAttribute('sandbox'), '');
      assert.equal(await page.evaluate(() => window.__templateAttack), undefined);
      assert.equal(previewRequests, 0);
      await page.unroute('https://preview-tracker.invalid/**');
      await composer.getByRole('button', { name: 'Edit HTML', exact: true }).click();
      await composer.getByLabel('HTML message', { exact: true }).fill(originalHtml);
    }

    await composer.getByLabel('Subject', { exact: true }).fill(`Saved draft ${width}`);
    await composer.getByLabel('Message', { exact: true }).fill(`Draft content ${width}`);
    await composer.getByRole('status').filter({ hasText: /^Saved$/ }).waitFor();
    await composer.getByRole('button', { name: 'Close composer' }).click();
    await openTool('Mail'); await page.getByRole('navigation', { name: 'Mail folders' }).getByRole('button', { name: 'Drafts', exact: true }).click();
    await page.locator('.mail-thread').filter({ hasText: `Saved draft ${width}` }).click();
    composer = page.getByRole('region', { name: 'Mail composer' }); assert.equal(await composer.getByLabel('Message', { exact: true }).inputValue(), `Draft content ${width}`);
    await composer.getByText('browser-note.txt', { exact: true }).waitFor();
    await composer.locator('.mail-html-section > summary').filter({ hasText: 'HTML & templates' }).click();
    await composer.frameLocator('iframe[title="HTML email preview"]').getByRole('heading', { name: 'James Terrell Singleton', exact: true }).waitFor();
    await composer.frameLocator('iframe[title="HTML email preview"]').getByText(oneTimeNote, { exact: true }).waitFor();
    await composer.getByRole('button', { name: 'Send message', exact: true }).click(); await composer.getByRole('status').filter({ hasText: 'Accepted for sending' }).waitFor(); await composer.getByRole('button', { name: 'Close composer' }).click();
    await page.getByRole('navigation', { name: 'Mail folders' }).getByRole('button', { name: 'Sent', exact: true }).click(); await page.locator('.mail-thread').filter({ hasText: `Saved draft ${width}` }).click();
    await page.getByRole('button', { name: 'Read sanitized HTML', exact: true }).click();
    await page.frameLocator('iframe').getByText(oneTimeNote, { exact: true }).waitFor();
    evidence.push({ width, editTemplateWithoutUseButton: true, oneTimeHtmlEditsRetained: true, baseTemplateUnchanged: true, clearedHtmlNotReplaced: true, customTemplateDraftReopened: true, customTemplateSentThroughFixture: true });
    const download = page.waitForEvent('download'); await page.getByRole('link', { name: /browser-note.txt/ }).click(); assert.equal((await download).suggestedFilename(), 'browser-note.txt');
    await page.getByRole('button', { name: 'Forward', exact: true }).first().click();
    composer = page.getByRole('region', { name: 'Mail composer' }); await composer.getByLabel('TO', { exact: true }).fill('forward@example.test'); await composer.getByRole('button', { name: 'Send message', exact: true }).click(); await composer.getByRole('status').filter({ hasText: 'Accepted for sending' }).waitFor(); await composer.getByRole('button', { name: 'Close composer' }).click();
    await page.getByRole('button', { name: 'Move to archive', exact: true }).click(); await page.getByRole('button', { name: 'Move to trash', exact: true }).click(); await page.getByRole('button', { name: 'Restore to Inbox', exact: true }).click();
    await page.locator('.mail-thread-labels > summary').click(); await page.getByRole('checkbox', { name: `Priority ${width}` }).click();
    await page.waitForFunction(name => Array.from(document.querySelectorAll('.mail-checkbox')).find(label => label.textContent === name)?.querySelector('input')?.checked, `Priority ${width}`);
    await page.getByRole('button', { name: 'Mark unread', exact: true }).click(); await page.getByRole('button', { name: 'Mark read', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Back to conversations' }).click();
    await page.getByRole('navigation', { name: 'Mail folders' }).getByRole('button', { name: 'Spam', exact: true }).click();
    await page.getByRole('navigation', { name: 'Mail folders' }).getByRole('button', { name: 'Inbox', exact: true }).click();
    await filters.getByLabel('Search', { exact: true }).fill('A local conversation'); await filters.getByRole('button', { name: 'Apply filters' }).click(); await page.locator('.mail-thread').filter({ hasText: 'A local conversation' }).click();
    await page.getByRole('button', { name: 'Read sanitized HTML', exact: true }).click();
    let remoteLoads = 0;
    await page.route('https://tracker.invalid/**', route => { remoteLoads++; return route.fulfill({ status: 200, contentType: 'image/gif', body: Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64') }); });
    const iframe = page.frameLocator('iframe'); await iframe.getByText('Local HTML message', { exact: true }).waitFor(); assert.equal(await page.evaluate(() => window.__mailAttack), undefined); assert.equal(await iframe.locator('script,form,input,img').count(), 0);
    assert.equal(remoteLoads, 0);
    const remoteRequest = page.waitForResponse('https://tracker.invalid/**'); await page.getByRole('button', { name: 'Load remote images', exact: true }).click(); await remoteRequest;
    assert.equal(remoteLoads, 1); await iframe.getByText('Local HTML message', { exact: true }).waitFor(); assert.equal(await iframe.locator('script,form,input').count(), 0); await page.unroute('https://tracker.invalid/**');
    await page.screenshot({ path: `${screenshots}/inbox-${width}.png`, fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1); assert.equal(overflow, false, `Horizontal overflow at ${width}`);
    await openTool('Settings'); await page.getByLabel('Inbox name', { exact: true }).fill(`Owner inbox ${width}`); await page.getByLabel('Instructions', { exact: true }).fill('No autonomous actions.'); await page.getByRole('button', { name: 'Save settings', exact: true }).click(); await page.getByRole('status').filter({ hasText: 'Settings saved.' }).waitFor();
    assert.equal(await page.getByRole('group', { name: 'Allowed autonomous actions — explicit save required' }).locator('input:checked').count(), 0);
    if (width === 1440) {
      await page.goto(`${base}/dashboard/inbox`);
      await page.locator('.inbox-card').getByText('Local test inbox', { exact: false }).waitFor();
      // Unknown and stale counts stay visibly distinct from valid empty provider data.
      let summaryMode = 'empty';
      await page.route('**/api/inbox/summary', route => summaryMode === 'empty'
        ? route.fulfill({ json: { email_address: 'local@example.test', unread: 0, drafts: 0, last_received: null, recent: [], mode: 'fixture' } })
        : route.fulfill({ status: 503, json: { error: 'Test provider unavailable', code: 'unavailable' } }));
      await page.getByRole('button', { name: 'Refresh mail', exact: true }).click();
      await page.getByText('Your inbox is empty.', { exact: true }).waitFor();
      summaryMode = 'error';
      await page.getByRole('button', { name: 'Refresh mail', exact: true }).click();
      await page.getByRole('alert').filter({ hasText: 'Last known values; refresh failed.' }).waitFor();
      await page.unroute('**/api/inbox/summary');
      // Failed autosave and session expiry preserve editable text in the active composer.
      await page.getByRole('button', { name: 'Compose', exact: true }).click();
      composer = page.getByRole('region', { name: 'Mail composer' });
      await page.route('**/api/inbox/drafts', route => route.request().method() === 'POST' ? route.fulfill({ status: 503, json: { error: 'Test save unavailable', code: 'unavailable' } }) : route.continue());
      await composer.getByLabel('TO', { exact: true }).fill('recover@example.test');
      await composer.getByLabel('Subject', { exact: true }).fill('Recovery acceptance');
      await composer.getByLabel('Message', { exact: true }).fill('Preserved through failures');
      await composer.getByRole('status').filter({ hasText: 'Save failed' }).waitFor();
      assert.equal(await composer.getByLabel('Message', { exact: true }).inputValue(), 'Preserved through failures');
      await page.unroute('**/api/inbox/drafts');
      await composer.getByRole('button', { name: 'Save draft', exact: true }).click();
      await composer.getByRole('status').filter({ hasText: /^Saved$/ }).waitFor();
      await page.route('**/api/inbox/drafts/*', route => route.request().method() === 'PATCH' ? route.fulfill({ status: 401, json: { error: 'Test session expired' } }) : route.continue());
      await composer.getByLabel('Message', { exact: true }).fill('Retained after session expiry');
      await composer.getByRole('status').filter({ hasText: 'Save failed' }).waitFor();
      assert.equal(await composer.getByLabel('Message', { exact: true }).inputValue(), 'Retained after session expiry');
      await page.unroute('**/api/inbox/drafts/*');
      await composer.getByRole('button', { name: 'Save draft', exact: true }).click(); await composer.getByRole('status').filter({ hasText: /^Saved$/ }).waitFor();
      let lost = false; const sendKeys = [];
      await page.route('**/api/inbox/drafts/*/send', async route => {
        sendKeys.push(route.request().postDataJSON().attempt);
        if (!lost) { lost = true; await route.fetch(); await route.abort('connectionreset'); } else await route.continue();
      });
      await composer.getByRole('button', { name: 'Send message', exact: true }).click(); await composer.getByRole('status').filter({ hasText: 'Send uncertain' }).waitFor();
      assert.equal(await composer.getByLabel('Message', { exact: true }).isDisabled(), true);
      await composer.getByRole('button', { name: 'Retry unchanged send', exact: true }).click(); await composer.getByRole('status').filter({ hasText: 'Accepted for sending' }).waitFor();
      assert.equal(sendKeys.length, 2); assert.equal(sendKeys[0], sendKeys[1]);
      await page.unroute('**/api/inbox/drafts/*/send'); await composer.getByRole('button', { name: 'Close composer' }).click();
      const recovered = await page.evaluate(async () => (await fetch('/api/inbox/threads?folder=sent&query=Recovery%20acceptance')).json()); assert.equal(recovered.data.length, 1);
      // Obsolete responses cannot replace a newer search.
      let releaseOld, oldStarted;
      const oldReady = new Promise(resolve => { oldStarted = resolve; });
      const oldGate = new Promise(resolve => { releaseOld = resolve; });
      const seed = recovered.data[0];
      await page.route('**/api/inbox/threads?**', async route => {
        const q = new URL(route.request().url()).searchParams.get('query');
        if (q === 'old-pending') { oldStarted(); await oldGate; await route.fulfill({ json: { data: [{ ...seed, subject: 'Obsolete result' }], has_more: false } }).catch(() => {}); }
        else if (q === 'new-result') await route.fulfill({ json: { data: [{ ...seed, subject: 'Current result' }], has_more: false } });
        else await route.continue();
      });
      await filters.getByLabel('Search', { exact: true }).fill('old-pending'); await filters.getByRole('button', { name: 'Apply filters' }).click(); await oldReady;
      await filters.getByLabel('Search', { exact: true }).fill('new-result'); await filters.getByRole('button', { name: 'Apply filters' }).click(); await page.locator('.mail-thread').filter({ hasText: 'Current result' }).waitFor(); releaseOld();
      await page.waitForTimeout(100); assert.equal(await page.getByText('Obsolete result', { exact: true }).count(), 0);
      await page.unroute('**/api/inbox/threads?**');
      // Exercise visible-tab polling and backoff with browser time, no extra server.
      await page.clock.install(); await page.reload();
      await page.locator('.inbox-card').getByText('Local test inbox', { exact: false }).waitFor(); let reads = 0;
      await page.route('**/api/inbox/summary', route => { reads++; return route.fulfill({ status: 429, headers: { 'Retry-After': '60' }, json: { error: 'Test rate limit', code: 'rate_limit' } }); });
      await page.clock.fastForward(16000); await page.getByRole('alert').filter({ hasText: 'Test rate limit' }).waitFor();
      const afterLimit = reads; await page.clock.fastForward(30000); assert.equal(reads, afterLimit);
      await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
      await page.clock.fastForward(90000); assert.equal(reads, afterLimit);
      await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
      await page.waitForTimeout(50); assert.ok(reads > afterLimit);
      await page.unroute('**/api/inbox/summary'); await page.clock.resume();
      await openTool('Contacts'); await page.getByRole('button', { name: `Delete account contact saved-${width}@example.test`, exact: true }).click();
      await openTool('Labels'); await page.getByRole('button', { name: `Delete Priority ${width}`, exact: true }).click();
      evidence.push({ recovery: true, sessionExpiry: true, uncertainSendDeduplicated: true, emptyStaleError: true, obsoleteResponsesSuppressed: true, hiddenTabPollingPaused: true, rateLimitBackoff: true });
    }
    assert.deepEqual(errors, []);
    evidence.push({ width, dashboardInbox: true, iconRefresh: true, contact: true, reply: true, compose: true, drafts: true, ccBcc: true, attachments: true, forward: true, labels: true, searchPagination: true, organization: true, contacts: true, settings: true, htmlSandbox: true, templatePreview: true, templateDraftRetained: true, fullContactLinks: true, copyEmail: true, bulkRead: true, contactFocusSpacing: true, overflow: false, hydrationErrors: errors });
    await page.getByLabel('Account menu', { exact: true }).click(); await page.getByRole('button', { name: 'Sign out', exact: true }).click(); await page.waitForURL('**/login');
    const guest = users.find(user => user.role === 'interviewer');
    await page.locator('#role').selectOption('interviewer'); await page.locator('#email').fill(guest.email); await page.locator('#password').fill(guest.password);
    await page.getByRole('button', { name: 'Continue as Interviewer', exact: true }).click(); await page.waitForURL('**/interview');
    await page.goto(`${base}/dashboard/inbox`); await page.waitForURL('**/interview');
    assert.equal(await page.evaluate(async () => (await fetch('/api/inbox/summary')).status), 403);
    evidence.push({ width, guestInboxDenied: true });
    console.log(`Browser acceptance passed at ${width}px`); await context.close();
  }
} catch (error) { await activePage?.screenshot({ path: `${screenshots}/failure.png`, fullPage: true }).catch(() => {}); throw error; } finally { await browser.close(); await writeFile(`${screenshots}/results.json`, JSON.stringify(evidence, null, 2)); }
console.log(JSON.stringify(evidence, null, 2));
