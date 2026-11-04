import { renderResumeDocument, type ResumeDocument } from './resume-document';
import { previewEmailDocument } from './mail-templates';
import { previewEmailIcons } from './mail-icons';

/** The exact same inert, self-contained HTML is used for preview and download. */
export function resumeExports(document: ResumeDocument) {
  const rendered = renderResumeDocument(document);
  const html = previewEmailDocument(previewEmailIcons(rendered.html));
  if (/src="https?:/i.test(html)) throw new Error('A résumé icon could not be bundled. Please try again.');
  return { text: rendered.text, html };
}
