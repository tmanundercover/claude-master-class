import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const base = process.env.TEST_BASE_URL;
if (!base) throw new Error('Run through the isolated Firebase emulator browser harness.');
const directory = await mkdtemp(join(tmpdir(), 'project-navigation-browser-'));
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const outcomes = [];
try {
  for (const width of [375, 1440]) for (const reducedMotion of ['no-preference', 'reduce']) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion });
    const page = await context.newPage(); const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error' && /hydration/i.test(message.text())) errors.push(message.text()); });
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    const links = page.locator('.experience-projects a');
    assert.ok(await links.count() >= 12);
    for (const href of await links.evaluateAll(elements => elements.map(element => element.getAttribute('href')))) {
      const id = new URL(href, base).hash.slice(1);
      assert.equal(await page.locator(`[id="${id}"]`).count(), 1, href);
    }
    const founder = page.getByRole('article', { name: /Software Architect \/ Founder at The Handsomest Nerd/ });
    const link = founder.getByRole('link', { name: 'The Handsomest Nerd', exact: true });
    const card = page.locator('#project-the-handsomest-nerd');
    const arrive = async () => {
      await page.waitForFunction(() => document.querySelector('#project-the-handsomest-nerd')?.classList.contains('project-arrival'));
      assert.equal(new URL(page.url()).hash, '#project-the-handsomest-nerd');
      assert.equal(await card.evaluate(element => document.activeElement === element), true);
      await page.waitForFunction(() => getComputedStyle(document.querySelector('#project-the-handsomest-nerd')).borderColor === 'rgb(152, 184, 255)');
      const styles = await card.evaluate(element => ({ bounce: getComputedStyle(element).animationName, shimmer: getComputedStyle(element, '::after').animationName, top: element.getBoundingClientRect().top, border: getComputedStyle(element).borderColor }));
      assert.ok(styles.top >= 0 && styles.top < 100, `Card top ${styles.top} at ${width}`);
      assert.equal(styles.bounce, reducedMotion === 'reduce' ? 'none' : 'project-bounce');
      assert.equal(styles.shimmer, reducedMotion === 'reduce' ? 'none' : 'project-shimmer');
      assert.equal(styles.border, 'rgb(152, 184, 255)');
    };
    await link.click(); await arrive();
    assert.equal(await card.getByRole('link', { name: /Visit project/ }).getAttribute('href'), 'https://thehandsomestnerd.com/');
    await page.screenshot({ path: join(directory, `project-${width}-${reducedMotion}.png`) });
    // Repeated activation must restart the destination effect, including keyboard activation.
    await link.focus(); await link.press('Enter'); await arrive();
    await page.waitForFunction(() => !document.querySelector('#project-the-handsomest-nerd')?.classList.contains('project-arrival'));
    // Project cards without an external URL still support experience-to-project navigation.
    await page.locator('.experience-projects a[href$="#project-application-generator"]').click();
    await page.waitForFunction(() => document.querySelector('#project-application-generator')?.classList.contains('project-arrival'));
    assert.equal(await page.locator('#project-application-generator').evaluate(element => document.activeElement === element), true);
    await page.goto(base + '/#project-the-handsomest-nerd'); await arrive();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    assert.deepEqual(errors, []);
    outcomes.push({ width, reducedMotion, linkTargets: await links.count(), repeatAndKeyboard: true, deepLink: true, overflow: false, errors });
    await context.close();
  }
  await writeFile(join(directory, 'results.json'), JSON.stringify(outcomes, null, 2));
  console.log(JSON.stringify({ directory, outcomes }, null, 2));
} finally { await browser.close(); }
