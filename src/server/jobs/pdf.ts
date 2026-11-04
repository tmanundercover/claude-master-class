// Server/build only. No model-provided resources, HTML, fonts or URLs are fetched.
import { createElement as h, type ReactNode, Children } from 'react';
import { Document, Page, Text, View, Image, Link, renderToBuffer, StyleSheet } from '@react-pdf/renderer';
import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { JobError, JOB_LIMITS, type ArtifactKind, type PdfState } from '../../lib/job-contracts.ts';
import { RESUME_DESIGN, PORTFOLIO_URL, approvedProjectUrl, type ResumeDocument } from '../../lib/resume-document.ts';
import { RESUME_ICON_NAMES } from '../../lib/resume-icon-names.ts';
import { JobRepository } from './repository.ts';
export const PDF_RENDERER_VERSION = 'react-pdf-4.9.0-layout-3';
const s = StyleSheet.create({
  page: { padding: 38, fontFamily: 'Helvetica', fontSize: 10, color: RESUME_DESIGN.ink },
  title: { fontSize: 25, fontFamily: 'Helvetica-Bold', marginBottom: 6 },
  headline: { fontSize: 12, color: RESUME_DESIGN.accent, marginBottom: 12 },
  contacts: { fontSize: 8, color: RESUME_DESIGN.muted, borderBottomWidth: 2, borderBottomColor: RESUME_DESIGN.rule, paddingBottom: 12, marginBottom: 15 },
  heading: { fontSize: 10, color: RESUME_DESIGN.accent, fontFamily: 'Helvetica-Bold', marginTop: 14, marginBottom: 7, letterSpacing: 1 },
  role: { fontFamily: 'Helvetica-Bold', fontSize: 12, marginTop: 9 },
  muted: { fontSize: 9, color: RESUME_DESIGN.muted, marginBottom: 5 },
  paragraph: { marginBottom: 8 },
  columns: { flexDirection: 'row', gap: 20 }, skills: { width: '27%' }, experience: { width: '73%' },
  skill: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 }, icon: { width: 10, height: 10, marginRight: 5 },
  footer: { position: 'absolute', bottom: 19, left: 38, right: 38, fontSize: 8, color: RESUME_DESIGN.muted },
});
const text = (value: string, style: typeof s[keyof typeof s] = s.paragraph) => h(Text, { style }, value);
const heading = (value: string) => h(Text, { style: s.heading, minPresenceAhead: 40 }, value);
const node = (key: string | number, value: ReactNode) => h(View, { key }, ...Children.toArray(value));
export async function renderResumePdf(document: ResumeDocument, iconDirectory?: string, { compactProjects = false }: { compactProjects?: boolean } = {}): Promise<Buffer> {
  const icons = new Map<string, Buffer>();
  if (iconDirectory) for (const skill of document.skills) {
    const slug = skill.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!RESUME_ICON_NAMES.includes(slug)) continue;
    try { icons.set(skill, await readFile(join(iconDirectory, slug + '.png'))); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  }
  const children = [
    text(document.name, s.title), text(document.headline, s.headline),
    text([document.location, document.contact.email, PORTFOLIO_URL, document.contact.linkedin, document.contact.github].join('\n'), s.contacts),
    heading('PROFILE'), text(document.summary),
    h(View, { style: s.columns },
      h(View, { style: s.skills }, heading('SKILLS'), ...document.skills.map(skill => h(View, { style: s.skill, key: skill, wrap: false }, icons.has(skill) ? h(Image, { style: s.icon, src: { data: icons.get(skill)!, format: 'png' } }) : null, h(Text, { style: { fontSize: 9, flex: 1 } }, skill)))),
      h(View, { style: s.experience }, heading('EXPERIENCE'), ...document.experience.map((role, index) => node(index, [h(View, { key: 'role-heading', wrap: false }, text(role.title, s.role), text(`${role.organization} · ${role.period}`, s.muted), text(role.summary)), ...role.bullets.map((bullet, i) => node(`bullet-${i}`, text(`• ${bullet}`)))])))),
    ...(document.previousExperienceAvailableUponRequest ? [heading('PREVIOUS EXPERIENCE'), text('Previous experience available upon request.')] : []),
    ...(document.additionalSkills?.length ? [heading('ADDITIONAL SKILLS'), h(View, { style: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 } }, ...document.additionalSkills.map(skill => h(Text, { key: skill, style: { fontSize: 8, padding: 4, backgroundColor: '#edf0f5', borderRadius: 3 } }, skill)))] : []),
    ...(document.projects.length ? [heading('PROJECTS'), ...document.projects.map((project, index) => compactProjects
      ? h(Text, { key: `project-${index}`, style: s.paragraph, orphans: 2, widows: 2 }, h(Text, { style: { fontFamily: 'Helvetica-Bold' } }, project.title), ` — ${project.description}`, ...project.links.map((link, i) => h(Link, { key: `link-${i}`, src: approvedProjectUrl(link.url), style: { color: RESUME_DESIGN.accent } }, ` · ${link.label}`)))
      : node(`project-${index}`, [text(project.title, s.role), text(project.context, s.muted), text(project.description), ...project.links.map((link, i) => node(`link-${i}`, text(`${link.label}: ${link.url}`, s.muted)))]))] : []),
    heading('EDUCATION'), ...document.education.map((education, index) => node(`education-${index}`, text(education))),
  ];
  return renderToBuffer(h(Document, { title: `${document.name} — Résumé`, author: document.name, creator: 'Portfolio documents', creationDate: new Date('2020-01-01T00:00:00Z'), modificationDate: new Date('2020-01-01T00:00:00Z') }, h(Page, { size: 'A4', style: s.page, wrap: true }, ...children.map((child, index) => node(`section-${index}`, child)), h(Text, { fixed: true, style: s.footer, render: ({ pageNumber, totalPages }) => `${document.name} · ${pageNumber} / ${totalPages}` }))));
}
export async function renderArtifactPdf(kind: ArtifactKind, content: Record<string, unknown>, markdown: string, iconDirectory?: string): Promise<Buffer> {
  if (kind === 'resume') return renderResumePdf(content.document as ResumeDocument, iconDirectory);
  const blocks = markdown.split(/\n\n+/).filter(Boolean);
  return renderToBuffer(h(Document, { title: kind === 'cover-letter' ? 'Cover letter' : kind.replace(/-/g, ' '), creator: 'Portfolio documents' }, h(Page, { size: 'A4', style: kind === 'cover-letter' ? { ...s.page, padding: 54, fontSize: 11 } : s.page, wrap: true }, ...blocks.map((block, index) => /^#{1,6} /.test(block) ? h(Text, { key: index, style: s.heading, minPresenceAhead: 40 }, block.replace(/^#+ /, '')) : h(Text, { key: index, style: s.paragraph, orphans: 2, widows: 2 }, block)), h(Text, { style: s.footer, fixed: true, render: ({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}` }))));
}
export async function pdfIconsDirectory() {
  for (const path of [join(process.cwd(), 'dist/pdf-icons'), join(process.cwd(), 'src/assets/mail-icons')]) { try { await access(path); return path; } catch { /* Try the packaged resource directory. */ } }
  return undefined;
}
export async function generatePdf(repo: JobRepository, id: string, kind: ArtifactKind, versionId: string, render = renderArtifactPdf) {
  const attempt = randomUUID(); const path = repo.artifactPath(id, kind);
  const started = await repo.db.transaction(async tx => {
    const pair = await repo.pair(id, kind, tx); const selected = [pair.current, pair.previous].find(version => version?.id === versionId);
    if (!selected) throw new JobError('This version is no longer retained.', 410);
    if (selected.pdf.state === 'ready') return false;
    if (selected.pdf.state === 'pending' && Date.now() - Date.parse(selected.pdf.startedAt ?? '') < 120000) throw new JobError('PDF generation is already running.', 409, 'in_progress');
    const pdf: PdfState = { state: 'pending', attempt, startedAt: new Date().toISOString() };
    tx.set(path, { ...pair, current: pair.current?.id === versionId ? { ...pair.current, pdf } : pair.current, previous: pair.previous?.id === versionId ? { ...pair.previous, pdf } : pair.previous }); return true;
  });
  if (!started) return repo.retained(id, kind, versionId);
  let staged: Awaited<ReturnType<JobRepository['writeObject']>> | undefined;
  try {
    const saved = await repo.readVersion(id, kind, versionId);
    const bytes = await render(kind, saved.result as Record<string, unknown>, saved.markdown, await pdfIconsDirectory());
    if (!bytes.subarray(0, 5).equals(Buffer.from('%PDF-'))) throw new JobError('Renderer did not produce a PDF.', 503);
    staged = await repo.writeObject(id, `artifacts/${kind}/${versionId}/pdf-${attempt}.pdf`, bytes, 'application/pdf', JOB_LIMITS.pdfBytes);
    const content = staged;
    await update({ state: 'ready', content, sourceHash: saved.version.result.hash, rendererVersion: PDF_RENDERER_VERSION });
    return repo.retained(id, kind, versionId);
  } catch (error) {
    if (staged) await repo.discardObjects(id, kind, [staged]);
    try { await update({ state: 'failed', error: 'PDF creation failed. Saved text is preserved; retry PDF creation.' }); } catch { /* A retired version cannot be recreated. */ }
    throw error;
  }
  async function update(pdf: PdfState) {
    await repo.db.transaction(async tx => { const pair = await repo.pair(id, kind, tx); const selected = [pair.current, pair.previous].find(version => version?.id === versionId); if (!selected || selected.pdf.state !== 'pending' || selected.pdf.attempt !== attempt) throw new JobError('PDF source changed or retired.', 409); tx.set(path, { ...pair, current: pair.current?.id === versionId ? { ...pair.current, pdf } : pair.current, previous: pair.previous?.id === versionId ? { ...pair.previous, pdf } : pair.previous }); });
  }
}
