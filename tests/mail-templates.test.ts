import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import type { PublicProfile } from '../src/app-types';
import { resumeMailTemplate, resumeContactLink, previewEmailDocument } from '../src/lib/mail-templates.ts';
import { RESUME_ICON_NAMES } from '../src/lib/resume-icon-names.ts';
import { PORTFOLIO_URL, publicResumeDocument, renderResumeDocument } from '../src/lib/resume-document.ts';

const profile = JSON.parse(readFileSync(new URL('../data/profile.json', import.meta.url), 'utf8')) as PublicProfile;
test('all résumé formats use the résumé site while the business website remains a project', () => {
  assert.equal(PORTFOLIO_URL, 'https://resume.terrellsingleton.com/');
  const template = resumeMailTemplate(profile);
  const full = renderResumeDocument(publicResumeDocument(profile, { full: true }));
  for (const document of [template, full]) {
    assert.ok(document.text.includes(`Portfolio: ${PORTFOLIO_URL}`));
    assert.ok(document.html.includes(`href="${PORTFOLIO_URL}"`));
    assert.ok(!document.text.includes('Portfolio: https://thehandsomestnerd.com'));
    assert.ok(!document.html.includes('resume.terrellsingleton.com//'));
  }
  assert.ok(full.html.includes('href="https://thehandsomestnerd.com/"'));
  assert.ok(full.text.includes('AI automation'));
});
test('résumé email keeps full active contact links, emphasizes usernames, and packages every referenced PNG icon', () => {
  const template = resumeMailTemplate(profile);
  for (const skill of profile.skills.strong) {
    const slug = skill.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    assert.ok(RESUME_ICON_NAMES.includes(slug), `${skill} missing from the generated icon manifest`);
    assert.ok(existsSync(new URL(`../src/assets/mail-icons/${slug}.png`, import.meta.url)), `${skill} missing raster artwork`);
  }
  for (const url of [profile.contact.linkedin, profile.contact.github]) {
    const username = new URL(url).pathname.split('/').at(-1)!;
    const link = resumeContactLink(url, url === profile.contact.github ? 'github' : 'linkedin');
    assert.ok(link.includes(`href="${url}"`));
    assert.ok(link.includes(`>${username}</strong>`));
    assert.ok(link.replace(/<[^>]*>/g, '').includes(url));
    assert.ok(template.text.includes(url));
  }
  for (const match of template.html.matchAll(/\/email-icons\/([a-z0-9-]+)\.png/g)) assert.ok(existsSync(new URL(`../src/assets/mail-icons/${match[1]}.png`, import.meta.url)), match[1]);
  assert.ok(template.html.includes(profile.education[0]));
  assert.ok(Buffer.byteLength(template.html + template.text) < 512 * 1024);
  assert.throws(() => resumeContactLink('javascript:alert(1)', 'github'));
});
test('template escapes profile text and never serializes private project evidence', () => {
  const dirty = structuredClone(profile);
  dirty.name = '<script>alert("resume")</script>';
  (dirty.projects[0] as unknown as Record<string, unknown>).evidence = ['PRIVATE-EVIDENCE-SENTINEL'];
  const template = resumeMailTemplate(dirty);
  assert.ok(!template.html.includes('<script>'));
  assert.ok(template.html.includes('&lt;script&gt;'));
  assert.ok(!JSON.stringify(template).includes('PRIVATE-EVIDENCE-SENTINEL'));
  const preview = previewEmailDocument('<script>alert(1)</script><form action="https://example.test"></form>');
  assert.ok(preview.indexOf("default-src 'none'") < preview.indexOf('<script>'));
  assert.ok(preview.includes("form-action 'none'"));
});
