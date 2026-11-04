import type { TailorResult } from './resume-tailor-result';

/** Validate the whitelisted API display contract without importing server evidence or providers. */
export function isTailorResult(value: unknown): value is TailorResult {
  const string = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 1600;
  const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
  const strings = (value: unknown, max: number) => Array.isArray(value) && value.length <= max && value.every(string);
  if (!record(value) || !record(value.document) || !strings(value.evidenceUsed, 250) || !strings(value.factsToVerify, 10)) return false;
  const d = value.document;
  return string(d.name) && string(d.headline) && string(d.location) && string(d.summary) && record(d.contact)
    && [d.contact.email, d.contact.linkedin, d.contact.github].every(string) && strings(d.education, 30) && strings(d.skills, 40)
    && Array.isArray(d.experience) && d.experience.length > 0 && d.experience.length <= 16
    && d.experience.every(role => record(role) && [role.title, role.organization, role.period, role.summary].every(string) && strings(role.bullets, 8))
    && Array.isArray(d.projects) && d.projects.length <= 13 && d.projects.every(project => record(project)
      && [project.title, project.context, project.description].every(string) && Array.isArray(project.links)
      && project.links.length <= 20 && project.links.every(link => record(link) && string(link.label) && string(link.url)));
}
