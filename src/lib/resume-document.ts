import type { PublicProfile } from '../app-types';
import { RESUME_ICON_NAMES } from './resume-icon-names.ts';
export type ResumeDocument = {
  name: string; headline: string; location: string; summary: string;
  contact: { email: string; linkedin: string; github: string }; education: string[]; skills: string[];
  experience: { title: string; organization: string; period: string; summary: string; bullets: string[] }[];
  projects: { title: string; context: string; description: string; links: { label: string; url: string }[] }[];
  previousExperienceAvailableUponRequest?: boolean;
  additionalSkills?: string[];
};
export function publicResumeDocument(profile: PublicProfile, { full = false }: { full?: boolean } = {}): ResumeDocument {
  return { name: profile.name, headline: profile.headline, location: profile.location, summary: profile.pitch,
    contact: { email: profile.contact.email, linkedin: profile.contact.linkedin, github: profile.contact.github },
    education: [...profile.education], skills: [...profile.skills.strong],
    experience: profile.experience.map(role => ({ title: role.title, organization: role.organization, period: role.period, summary: role.summary, bullets: full ? [...role.bullets] : [] })),
    projects: full ? profile.projects.map(project => ({ title: project.title, context: project.context, description: project.summary.split(/(?<=[.!?])\s+/)[0], links: [...(project.url ? [{ label: 'View project', url: project.url }] : []), ...(project.links ?? [])].map(link => ({ label: link.label, url: link.url })) })) : [] };
}
export const RESUME_DESIGN = { ink: '#15243d', accent: '#47668f', muted: '#536075', rule: '#789bd1' } as const;
export const PORTFOLIO_URL = 'https://thehandsomestnerd.com';
export function escapeEmail(value: string): string {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
}
function icon(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!RESUME_ICON_NAMES.includes(slug)) return "";
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

export function approvedProjectUrl(value: string): string {
  if (new URL(value).protocol !== 'https:') throw new Error('Project links must use HTTPS.');
  return value;
}
export function renderResumeDocument(document: ResumeDocument, email = false): { html: string; text: string } {
  const e = escapeEmail;
  const experience = document.experience.map(role => `<tr><td style="padding:14px 0;border-bottom:1px solid #dde3ec"><p style="margin:0 0 5px;color:#536987;font-size:11px">${e(role.period)}</p><h3 style="margin:0 0 5px;font-size:15px;color:#15243d">${e(role.title)}</h3><p style="margin:0 0 8px;color:#536075;font-size:12px">${e(role.organization)}</p><p style="margin:0;color:#334155;line-height:1.6;font-size:13px">${e(role.summary)}</p>${role.bullets.length ? `<ul style="padding-left:18px;color:#334155;font-size:13px;line-height:1.6">${role.bullets.map(bullet => `<li>${e(bullet)}</li>`).join("")}</ul>` : ""}</td></tr>`).join('');
  const previousExperience = document.previousExperienceAvailableUponRequest ? '<h2 style="margin:24px 0 10px;font-size:11px;letter-spacing:2px;color:#47668f">PREVIOUS EXPERIENCE</h2><p style="font-size:13px;color:#334155">Previous experience available upon request.</p>' : '';
  const additionalSkills = document.additionalSkills?.length ? `<h2 style="margin:24px 0 10px;font-size:11px;letter-spacing:2px;color:#47668f">ADDITIONAL SKILLS</h2><div>${document.additionalSkills.map(skill => `<span style="display:inline-block;margin:0 5px 5px 0;padding:5px 8px;background:#edf0f5;border-radius:3px;font-size:11px;color:#334155">${e(skill)}</span>`).join('')}</div>` : '';
  const projects = document.projects.length ? `<h2 style="margin:24px 0 10px;font-size:11px;letter-spacing:2px;color:#47668f">PROJECTS</h2>${document.projects.map(project => `<h3 style="font-size:15px;color:#15243d">${e(project.title)}</h3><p style="font-size:12px;color:#536075">${e(project.context)}</p><p style="font-size:13px;color:#334155;line-height:1.6">${e(project.description)}</p>${project.links.map(link => `<p style="font-size:12px;overflow-wrap:anywhere"><a href="${e(approvedProjectUrl(link.url))}" style="color:#47668f">${e(link.label)}: ${e(link.url)}</a></p>`).join('')}`).join('')}` : '';
  const text = `${email ? "Hi,\n\nI'm sharing my résumé below. I'd be happy to discuss how my experience could support your team.\n\n" : ""}${document.name}\n${document.headline}\n${document.location}\n\n${document.summary}\n\nEXPERIENCE\n\n${document.experience.map(role => `${role.title} · ${role.organization}\n${role.period}\n${role.summary}${role.bullets.length ? "\n" + role.bullets.map(bullet => `• ${bullet}`).join("\n") : ""}`).join('\n\n')}${document.previousExperienceAvailableUponRequest ? '\n\nPREVIOUS EXPERIENCE\nPrevious experience available upon request.' : ''}${document.additionalSkills?.length ? '\n\nADDITIONAL SKILLS\n' + document.additionalSkills.join(' · ') : ''}${document.projects.length ? "\n\nPROJECTS\n\n" + document.projects.map(project => `${project.title} · ${project.context}\n${project.description}\n${project.links.map(link => `${link.label}: ${approvedProjectUrl(link.url)}`).join("\n")}`).join("\n\n") : ""}\n\nSKILLS\n${document.skills.join(' · ')}\n\nEDUCATION\n${document.education.join('\n')}\n\nEmail: ${document.contact.email}\nPortfolio: ${PORTFOLIO_URL}\nLinkedIn: ${document.contact.linkedin}\nGitHub: ${document.contact.github}${email ? `\n\nBest,\n${document.name}` : ""}`;
  return {
    text,
    html: applyResumeDesign(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${e(document.name)} — Résumé</title><style>@media(max-width:520px){.resume-columns{display:flex!important;flex-direction:column-reverse!important}.resume-cell{display:block!important;width:auto!important;padding-left:0!important;padding-right:0!important}.resume-sheet{padding:24px 20px!important}}</style></head><body style="margin:0;background:#edf0f5;font-family:Arial,Helvetica,sans-serif;color:#15243d"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="700" cellspacing="0" cellpadding="0" style="width:100%;max-width:700px;background:#fff"><tr><td class="resume-sheet" style="padding:36px 38px">${email ? "<p style=\"margin:0 0 24px;font-size:13px;line-height:1.6;color:#536075\">Hi, I'm sharing my r\u00e9sum\u00e9 below. I'd be happy to discuss how my experience could support your team.</p>" : ""}<h1 style="margin:0 0 8px;font-size:32px;line-height:1.1;letter-spacing:-1px;color:#15243d">${e(document.name)}</h1><p style="margin:0 0 16px;font-size:14px;color:#47668f">${e(document.headline)}</p><p style="margin:0;padding-bottom:18px;border-bottom:3px solid #789bd1;font-size:11px;color:#536075;line-height:1.8"><span style="display:block;margin-bottom:5px">${e(document.location)}</span>${resumeContactLink(PORTFOLIO_URL, 'portfolio')}<br>${resumeContactLink(document.contact.email, 'email')}<br>${resumeContactLink(document.contact.linkedin, 'linkedin')}<br>${resumeContactLink(document.contact.github, 'github')}</p><h2 style="margin:22px 0 9px;font-size:11px;letter-spacing:2px;color:#47668f">PROFILE</h2><p style="margin:0;font-size:13px;line-height:1.7;color:#334155">${e(document.summary)}</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr class="resume-columns"><td class="resume-cell" width="27%" valign="top" style="padding:25px 22px 0 0"><h2 style="margin:0 0 13px;font-size:11px;letter-spacing:2px;color:#47668f">SKILLS</h2><p style="margin:0;font-size:11px;line-height:1.95;color:#536075">${document.skills.map(skill => `<span style="display:inline-block;margin-bottom:5px">${icon(skill)}${e(skill)}</span><br>`).join('')}</p></td><td class="resume-cell" width="73%" valign="top" style="padding:25px 0 0 22px"><h2 style="margin:0;font-size:11px;letter-spacing:2px;color:#47668f">EXPERIENCE</h2><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${experience}</table></td></tr></table>${previousExperience}${additionalSkills}${projects}<h2 style="margin:24px 0 10px;font-size:11px;letter-spacing:2px;color:#47668f">EDUCATION</h2><p style="margin:0;font-size:12px;line-height:1.6;color:#536075">${document.education.map(e).join('<br>')}</p><p style="margin:24px 0 0;padding-top:14px;border-top:1px solid #dde3ec;font-size:11px;color:#536075">${e(document.name)} · <a href="${PORTFOLIO_URL}" style="color:#47668f">View portfolio and selected work →</a></p></td></tr></table></td></tr></table></body></html>`),
  };
}

function applyResumeDesign(html: string): string {
  return html.replaceAll('#15243d', RESUME_DESIGN.ink).replaceAll('#47668f', RESUME_DESIGN.accent).replaceAll('#536075', RESUME_DESIGN.muted).replaceAll('#789bd1', RESUME_DESIGN.rule);
}
