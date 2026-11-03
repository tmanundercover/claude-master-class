import type { PublicProfile } from '../app-types';

export type MailTemplate = { id: string; name: string; description: string; subject: string; text: string; html: string };
export const PORTFOLIO_URL = 'https://thehandsomestnerd.com';
export function escapeEmail(value: string): string {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
}
function icon(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `<img src="${PORTFOLIO_URL}/email-icons/${slug}.png" width="16" height="16" alt="" style="vertical-align:middle;display:inline-block;margin-right:7px;border:0">`;
}
export function resumeContactLink(value: string, kind: 'linkedin' | 'github' | 'portfolio' | 'email'): string {
  const e = escapeEmail;
  const href = kind === 'email' ? `mailto:${value}` : value;
  if (kind !== 'email' && new URL(value).protocol !== 'https:') throw new Error('Résumé links must use HTTPS.');
  const identity = kind === 'email' ? value.split('@')[0] : kind === 'portfolio' ? new URL(value).hostname.split('.')[0] : new URL(value).pathname.split('/').filter(Boolean).at(-1) ?? '';
  const index = value.lastIndexOf(identity);
  return `<a href="${e(href)}" style="color:#68778a;text-decoration:none;word-break:break-all">${icon(kind)}${e(value.slice(0, index))}<strong style="font-weight:600;color:#233f67">${e(identity)}</strong>${e(value.slice(index + identity.length))}</a>`;
}

/** Only the existing public profile projection is accepted; private evidence is never imported here. */
export function resumeMailTemplate(profile: PublicProfile): MailTemplate {
  const e = escapeEmail;
  const experience = profile.experience.map(role => `<tr><td style="padding:14px 0;border-bottom:1px solid #dde3ec"><p style="margin:0 0 5px;color:#536987;font-size:11px">${e(role.period)}</p><h3 style="margin:0 0 5px;font-size:15px;color:#15243d">${e(role.title)}</h3><p style="margin:0 0 8px;color:#536075;font-size:12px">${e(role.organization)}</p><p style="margin:0;color:#334155;line-height:1.6;font-size:13px">${e(role.summary)}</p></td></tr>`).join('');
  const text = `Hi,\n\nI'm sharing my résumé below. I'd be happy to discuss how my experience could support your team.\n\n${profile.name}\n${profile.headline}\n${profile.location}\n\n${profile.pitch}\n\nEXPERIENCE\n\n${profile.experience.map(role => `${role.title} · ${role.organization}\n${role.period}\n${role.summary}`).join('\n\n')}\n\nSKILLS\n${profile.skills.strong.join(' · ')}\n\nEDUCATION\n${profile.education.join('\n')}\n\nEmail: ${profile.contact.email}\nPortfolio: ${PORTFOLIO_URL}\nLinkedIn: ${profile.contact.linkedin}\nGitHub: ${profile.contact.github}\n\nBest,\n${profile.name}`;
  return {
    id: 'resume', name: 'Send my résumé', description: 'A clean résumé document with a skills column, experience, and restrained portfolio accents.',
    subject: `${profile.name} — Résumé`, text,
    html: `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${e(profile.name)} — Résumé</title><style>@media(max-width:520px){.resume-columns{display:flex!important;flex-direction:column-reverse!important}.resume-cell{display:block!important;width:auto!important;padding-left:0!important;padding-right:0!important}.resume-sheet{padding:24px 20px!important}}</style></head><body style="margin:0;background:#edf0f5;font-family:Arial,Helvetica,sans-serif;color:#15243d"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="700" cellspacing="0" cellpadding="0" style="width:100%;max-width:700px;background:#fff"><tr><td class="resume-sheet" style="padding:36px 38px"><p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:#536075">Hi, I'm sharing my résumé below. I'd be happy to discuss how my experience could support your team.</p><h1 style="margin:0 0 8px;font-size:32px;line-height:1.1;letter-spacing:-1px;color:#15243d">${e(profile.name)}</h1><p style="margin:0 0 16px;font-size:14px;color:#47668f">${e(profile.headline)}</p><p style="margin:0;padding-bottom:18px;border-bottom:3px solid #789bd1;font-size:11px;color:#536075;line-height:1.8"><span style="display:block;margin-bottom:5px">${e(profile.location)}</span>${resumeContactLink(PORTFOLIO_URL, 'portfolio')}<br>${resumeContactLink(profile.contact.email, 'email')}<br>${resumeContactLink(profile.contact.linkedin, 'linkedin')}<br>${resumeContactLink(profile.contact.github, 'github')}</p><h2 style="margin:22px 0 9px;font-size:11px;letter-spacing:2px;color:#47668f">PROFILE</h2><p style="margin:0;font-size:13px;line-height:1.7;color:#334155">${e(profile.pitch)}</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr class="resume-columns"><td class="resume-cell" width="27%" valign="top" style="padding:25px 22px 0 0"><h2 style="margin:0 0 13px;font-size:11px;letter-spacing:2px;color:#47668f">SKILLS</h2><p style="margin:0;font-size:11px;line-height:1.95;color:#536075">${profile.skills.strong.map(skill => `<span style="display:inline-block;margin-bottom:5px">${icon(skill)}${e(skill)}</span><br>`).join('')}</p></td><td class="resume-cell" width="73%" valign="top" style="padding:25px 0 0 22px"><h2 style="margin:0;font-size:11px;letter-spacing:2px;color:#47668f">EXPERIENCE</h2><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${experience}</table></td></tr></table><h2 style="margin:24px 0 10px;font-size:11px;letter-spacing:2px;color:#47668f">EDUCATION</h2><p style="margin:0;font-size:12px;line-height:1.6;color:#536075">${profile.education.map(e).join('<br>')}</p><p style="margin:24px 0 0;padding-top:14px;border-top:1px solid #dde3ec;font-size:11px;color:#536075">${e(profile.name)} · <a href="${PORTFOLIO_URL}" style="color:#47668f">View portfolio and selected work →</a></p></td></tr></table></td></tr></table></body></html>`,
  };
}
/** Even edited HTML previews cannot run scripts, submit forms, or load external resources. */
export function previewEmailDocument(html: string): string {
  return `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'">${html}`;
}
