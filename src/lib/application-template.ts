import { escapeEmail, PORTFOLIO_URL } from './resume-document.ts';
import type { JobMetadata } from './job-contracts.ts';
export function applicationMailTemplate(candidate: { name: string }, job: JobMetadata, documents: { resume: 'tailored' | 'standard' | null; coverLetter: boolean }) {
  const opportunity = job.title && job.company ? `${job.title} at ${job.company}` : job.title ?? (job.company ? `an opportunity at ${job.company}` : 'your advertised opportunity');
  const subject = `${candidate.name} — Application for ${opportunity}`.replace(/[\r\n]+/g, ' ');
  const attached = [documents.resume ? `${documents.resume === 'standard' ? 'standard ' : ''}résumé` : '', documents.coverLetter ? 'cover letter' : ''].filter(Boolean);
  const paragraphs = ['Hello,', `I am writing to express my interest in ${opportunity}.`, ...(attached.length ? [`Please find my ${attached.join(' and ')} attached for your consideration.`] : []), 'I would welcome a conversation about how my experience could support your team.', `Best regards,\n${candidate.name}\n${PORTFOLIO_URL}`];
  return { id: 'job-application', name: 'Job application', description: 'Prepare an application from a saved job and its available PDFs.', subject, text: paragraphs.join('\n\n'), html: `<div style="font-family:Arial,sans-serif;color:#15243d;line-height:1.6">${paragraphs.map(p => `<p>${escapeEmail(p).replaceAll('\n', '<br>')}</p>`).join('')}</div>` };
}
