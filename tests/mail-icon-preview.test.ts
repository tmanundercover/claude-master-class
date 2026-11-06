import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import type { PublicProfile } from '../src/app-types';
import { inlineEmailIcons } from '../src/lib/mail-icon-preview.ts';
import { PORTFOLIO_URL, publicResumeDocument, renderResumeDocument } from '../src/lib/resume-document.ts';

const iconDirectory = new URL('../src/assets/mail-icons/', import.meta.url);
const images = Object.fromEntries(readdirSync(iconDirectory).map(name => [
  `../assets/mail-icons/${name}`, `data:image/png;base64,${readFileSync(new URL(name, iconDirectory)).toString('base64')}`,
]));

test('résumé preview embeds every current icon while preserving portfolio and project links', () => {
  const profile = JSON.parse(readFileSync(new URL('../data/profile.json', import.meta.url), 'utf8')) as PublicProfile;
  const rendered = renderResumeDocument(publicResumeDocument(profile, { full: true }));
  const preview = inlineEmailIcons(rendered.html, images);
  const iconCount = [...rendered.html.matchAll(/<img /g)].length;
  assert.ok(iconCount > 4);
  assert.equal([...preview.matchAll(/src="data:image\/png;base64,/g)].length, iconCount);
  assert.doesNotMatch(preview, /src="https?:/i);
  assert.ok(preview.includes(`href="${PORTFOLIO_URL}"`));
  assert.ok(preview.includes('href="https://thehandsomestnerd.com/"'));
});

test('older draft icons still embed without replacing links or unfamiliar images', () => {
  const oldIcon = 'https://thehandsomestnerd.com/email-icons/react.png';
  const html = `<a href="${oldIcon}">Icon link</a><img src="${oldIcon}">`;
  assert.equal(inlineEmailIcons(html, images), `<a href="${oldIcon}">Icon link</a><img src="${images['../assets/mail-icons/react.png']}">`);
  for (const url of [
    `${PORTFOLIO_URL}email-icons/missing.png`,
    'https://example.test/email-icons/react.png',
    'https://resume.terrellsingleton.com.evil.test/email-icons/react.png',
  ]) {
    const image = `<img src="${url}">`;
    assert.equal(inlineEmailIcons(image, images), image);
  }
});
