// Run from any directory: node docs/slides/export.mjs [--html-only]
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { renderSections, slides } from './course.mjs';
const at = name => new URL(name, import.meta.url);
const read = name => readFile(at(name), 'utf8');
const [fonts, revealStyle, brand, course, logo, reveal, presenter] = await Promise.all([
  read('fonts.css'), read('reveal.css'), read('brand.css'), read('course.css'), read('logo.svg'), read('reveal.js'), read('presenter.js'),
]);
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Portfolio career workspace · OpenSpec course</title>
<style>${fonts}\n${revealStyle}\n${brand}\n${course}</style></head>
<body>${logo}<div id="presentation" class="reveal"><div class="slides">${renderSections()}</div></div>
<div class="course-toolbar"><button id="previous-button">← Previous</button><button id="next-button">Next →</button><button id="overview-button">Overview (Esc)</button><button id="speaker-button">Presenter (S)</button><span id="presenter-status" role="status"></span></div>
<main id="speaker"></main><script>${reveal}</script><script>${presenter}</script></body></html>\n`;
await writeFile(at('portfolio-career-workspace.html'), html);
if (!process.argv.includes('--html-only')) {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    await page.goto(at('portfolio-career-workspace.html').href + '?print-pdf');
    await page.waitForFunction(() => window.Reveal?.isReady());
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => document.querySelectorAll('.pdf-page').length > 0);
    await page.pdf({ path: fileURLToPath(at('portfolio-career-workspace.pdf')), width: '1600px', height: '900px', printBackground: true, preferCSSPageSize: true });
    await page.close();
  } finally { await browser.close(); }
}
console.log(`Exported ${slides.length} ordered slides${process.argv.includes('--html-only') ? ' (HTML only)' : ' (HTML and PDF)'}.`);
