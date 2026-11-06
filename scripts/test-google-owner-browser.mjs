import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { emulatorOwnerBrowserSignIn } from './emulator-auth.mjs';
const base = process.env.TEST_BASE_URL;
if (!base || !process.env.FIREBASE_AUTH_EMULATOR_HOST) throw new Error('Run through the isolated Firebase emulator harness.');
const users = JSON.parse(await readFile(process.env.TEST_AUTH_USERS_FILE, 'utf8'));
const owner = users.find(user => user.role === 'terrell');
const directory = '.firebase/google-owner-browser'; await mkdir(directory, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const outcomes = [];
try {
  for (const width of [375, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 } });
    const page = await context.newPage(); const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/login'); await page.locator('#role').selectOption('terrell');
    assert.equal(await page.locator('input[type=password], input[type=email]').count(), 0);
    await page.getByText('terrell.singleton@gmail.com', { exact: true }).waitFor();
    await page.screenshot({ path: `${directory}/login-${width}.png` });
    const opened = page.waitForEvent('popup'); await page.getByRole('button', { name: 'Continue with Google', exact: true }).click(); const popup = await opened;
    await popup.waitForFunction(() => typeof window.toggleForm === 'function');
    await popup.locator('#add-account-button button').click(); await popup.locator('#email-input').fill('wrong-owner@example.test');
    await popup.locator('#display-name-input').fill('Wrong account'); await popup.locator('#sign-in').click();
    await page.getByRole('alert').filter({ hasText: 'Use the Google account terrell.singleton@gmail.com' }).waitFor();
    assert.equal((await context.cookies()).some(cookie => cookie.name === '__session'), false);
    await emulatorOwnerBrowserSignIn(page, owner.email); await page.waitForURL('**/dashboard');
    assert.equal((await context.cookies()).some(cookie => cookie.name === '__session'), true);
    assert.equal(await page.evaluate(async () => (await fetch('/api/inbox/summary')).status), 200);
    assert.equal(await page.evaluate(async () => (await fetch('/api/auth', { method: 'DELETE' })).status), 200);
    await page.goto(base + '/login');
    const guest = users.find(user => user.role === 'recruiter');
    await page.getByLabel('Email', { exact: true }).fill(guest.email); await page.getByLabel('Password', { exact: true }).fill(guest.password);
    await page.getByRole('button', { name: 'Continue as Recruiter', exact: true }).click(); await page.waitForURL('**/interview');
    assert.equal(await page.evaluate(async () => (await fetch('/api/inbox/summary')).status), 403);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false); assert.deepEqual(errors, []);
    outcomes.push({ width, ownerGoogleSignIn: true, wrongGoogleDenied: true, guestPasswordPreserved: true, privateAccess: true, errors });
    await context.close();
  }
  await writeFile(`${directory}/results.json`, JSON.stringify(outcomes, null, 2)); console.log(JSON.stringify({ outcomes }, null, 2));
} finally { await browser.close(); }
