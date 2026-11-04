// Local-file review: no HTTP server, provider calls, app mutations or new dependencies.
import { chromium } from 'playwright';
import { mkdtemp, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { slides } from './course.mjs';
const out = await mkdtemp(join(tmpdir(), 'portfolio-curriculum-review-'));
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const result = { slides: slides.length, bounds: [], assets: [], console: [], navigation: {}, speaker: {}, pdf: {}, directory: out };
const normalize = text => text.normalize('NFKC').replace(/\s/g, '');
try {
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', error => result.console.push(error.message));
  await page.goto(new URL('portfolio-career-workspace.html', import.meta.url).href);
  await page.waitForFunction(() => window.Reveal?.isReady()); await page.evaluate(() => document.fonts.ready);
  for (let i = 0; i < slides.length; i++) {
    await page.evaluate(index => { Reveal.slide(index); Reveal.navigateFragment(999); }, i);
    await page.waitForFunction(index => Reveal.getIndices().h === index, i);
    await page.waitForFunction(() => [...Reveal.getCurrentSlide().querySelectorAll('.fragment')].every(el => parseFloat(getComputedStyle(el).opacity) > 0.99));
    const issues = await page.evaluate(() => {
      const section = Reveal.getCurrentSlide(); const box = section.getBoundingClientRect();
      return [...section.querySelectorAll('h1,h2,h3,p,li,pre,td,th,.foot,.rail,.lesson-nav,.course-lines,.body,.hero-copy,img')].filter(el => {
        if (!el.getClientRects().length || el.closest('.notes')) return false;
        const b = el.getBoundingClientRect();
        const grid = el.closest('.slide-grid'); const footer = grid?.querySelector('.foot')?.getBoundingClientRect();
        return b.right > box.right + 2 || b.bottom > box.bottom + 2 || b.left < box.left - 2 || b.top < box.top - 2 ||
          (el.matches('pre,.course-lines') && footer && b.bottom > footer.top - 4) ||
          (el.clientHeight && el.scrollHeight > el.clientHeight + 2 && getComputedStyle(el).overflowY === 'hidden');
      }).map(el => ({ element: el.tagName, text: el.textContent.slice(0, 90) }));
    });
    if (issues.length) result.bounds.push({ slide: i + 1, issues });
    const badImages = await page.evaluate(() => [...Reveal.getCurrentSlide().querySelectorAll('img')].filter(img => !img.complete || !img.naturalWidth).map(img => img.alt));
    if (badImages.length) result.assets.push({ slide: i + 1, images: badImages });
    await page.screenshot({ path: join(out, `html-${i + 1}.png`) });
  }
  await page.evaluate(() => Reveal.slide(0));
  await page.keyboard.press('ArrowRight'); result.navigation.right = await page.evaluate(() => Reveal.getIndices().h === 1);
  await page.keyboard.press('ArrowLeft'); result.navigation.left = await page.evaluate(() => Reveal.getIndices().h === 0);
  await page.keyboard.press('PageDown'); result.navigation.pageDown = await page.evaluate(() => Reveal.getIndices().h === 1);
  await page.keyboard.press('Escape'); result.navigation.overview = await page.evaluate(() => Reveal.isOverview());
  await page.keyboard.press('Escape');
  await page.evaluate(() => Reveal.slide([...document.querySelectorAll('#presentation .slides > section')].findIndex(section => section.dataset.lesson === '0')));
  await page.locator('.present a[href="#/lesson-8"]').click();
  result.navigation.lesson = await page.evaluate(() => Reveal.getCurrentSlide().dataset.lesson === '8');
  const popupReady = page.waitForEvent('popup'); await page.keyboard.press('s'); const speaker = await popupReady;
  await speaker.waitForSelector('#speaker-thumbnails button'); await speaker.evaluate(() => document.fonts.ready);
  result.speaker.thumbnails = await speaker.locator('#speaker-thumbnails button').count();
  await speaker.locator('#speaker-thumbnails button').nth(3).click();
  await page.waitForFunction(() => Reveal.getIndices().h === 3); result.speaker.selectionSync = true;
  await page.keyboard.press('ArrowRight');
  await speaker.waitForFunction(() => document.querySelector('#speaker-counter').textContent.startsWith('5 /'));
  result.speaker.audienceSync = true;
  result.speaker.notes = Boolean(await speaker.locator('#speaker-notes').textContent());
  result.speaker.current = await speaker.locator('#current-preview section').count() === 1;
  result.speaker.next = await speaker.locator('#next-preview section').count() === 1;
  await speaker.screenshot({ path: join(out, 'speaker.png'), fullPage: false });
  await speaker.locator('#speaker-thumbnails button').last().click();
  result.speaker.lastHasNoNext = await speaker.locator('#next-preview section').count() === 0;
  await speaker.close(); await page.close();
  try {
    execFileSync(process.env.PDF_REVIEW_PYTHON || 'python3', [fileURLToPath(new URL('pdf-review.py', import.meta.url)), fileURLToPath(new URL('portfolio-career-workspace.pdf', import.meta.url)), out], { stdio: 'pipe' });
    const pdf = JSON.parse(await readFile(join(out, 'pdf-text.json'), 'utf8'));
    result.pdf.pages = pdf.count; result.pdf.countMatches = pdf.count === slides.length;
    result.pdf.titleOrderMismatches = slides.flatMap((s, i) => normalize(pdf.pages[i] || '').includes(normalize(s.title)) ? [] : [{ page: i + 1, title: s.title }]);
    // Every visible canonical prompt part must appear on the matching PDF page.
    result.pdf.promptMismatches = slides.flatMap((s, i) => s.prompt === undefined || normalize(pdf.pages[i] || '').includes(normalize(s.prompt)) ? [] : [i + 1]);
    result.pdf.emptyPages = pdf.pages.flatMap((text, i) => text.trim() ? [] : [i + 1]);
  } catch (error) { result.pdf.unperformed = `PDF inspection requires an isolated Python environment with PyMuPDF: ${error.message}`; }
  // Contact sheets make a complete visual pass possible without opening one hundred windows.
  const sheet = await context.newPage({ viewport: { width: 1600, height: 1000 } });
  for (const type of ['html', ...(result.pdf.pages ? ['pdf'] : [])]) {
    for (let start = 0; start < slides.length; start += 12) {
      let body = '';
      for (let i = start; i < Math.min(start + 12, slides.length); i++) {
        const png = await readFile(join(out, `${type}-${i + 1}.png`));
        body += `<figure><img src="data:image/png;base64,${png.toString('base64')}"><figcaption>${i + 1}. ${slides[i].title.replaceAll('&', '&amp;').replaceAll('<', '&lt;')}</figcaption></figure>`;
      }
      await sheet.setContent(`<html><style>body{margin:16px;display:grid;grid-template-columns:repeat(4,1fr);gap:14px;background:#dde3e9}figure{margin:0;font:13px system-ui}img{width:100%}figcaption{height:40px;padding:5px}</style>${body}</html>`);
      await sheet.screenshot({ path: join(out, `${type}-sheet-${1 + start / 12}.png`), fullPage: true });
    }
  }
  await sheet.close(); await context.close();
} finally { await browser.close(); await writeFile(join(out, 'review.json'), JSON.stringify(result, null, 2) + '\n'); }
console.log(JSON.stringify(result, null, 2));
if (result.bounds.length || result.assets.length || result.console.length || Object.values(result.navigation).some(x => !x) || result.speaker.thumbnails !== slides.length || Object.values(result.speaker).some(x => x === false) || result.pdf.unperformed || result.pdf.countMatches === false || result.pdf.titleOrderMismatches?.length || result.pdf.promptMismatches?.length || result.pdf.emptyPages?.length) process.exitCode = 1;
