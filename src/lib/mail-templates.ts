import type { PublicProfile } from '../app-types';
import { publicResumeDocument, renderResumeDocument } from './resume-document.ts';
export { PORTFOLIO_URL, escapeEmail, resumeContactLink } from './resume-document.ts';
export type MailTemplate = { id: string; name: string; description: string; subject: string; text: string; html: string };
export function resumeMailTemplate(profile: PublicProfile): MailTemplate {
  return { id: 'resume', name: 'Send my résumé', description: 'A clean résumé document with a skills column, experience, and restrained portfolio accents.',
    subject: `${profile.name} — Résumé`, ...renderResumeDocument(publicResumeDocument(profile), true) };
}
/** Even edited HTML previews cannot run scripts, submit forms, or load external resources. */
export function previewEmailDocument(html: string): string {
  return `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'">${html}`;
}
