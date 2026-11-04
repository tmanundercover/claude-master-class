import { ModelOutputValidationError } from './output-validation.ts';
import type { TailorEvidence, CandidateProfile } from './resume-tailor-evidence.ts';
import type { ResumeDocument } from './resume-document.ts';

export type ReferencedProse = { text: string; references: string[] };
export type TailorModelResult = {
  headline: ReferencedProse; summary: ReferencedProse; skills: string[];
  experience: { id: string; summary: ReferencedProse; bullets: ReferencedProse[] }[];
  projects: { id: string; description: ReferencedProse }[];
  factsToVerify: string[];
};
export type TailorResult = { document: ResumeDocument; evidenceUsed: string[]; factsToVerify: string[] };

const string = (maxLength: number) => ({ type: 'string', minLength: 1, maxLength });
const array = (items: unknown, minItems: number, maxItems: number) => ({ type: 'array', items, minItems, maxItems });
const object = (properties: Record<string, unknown>) => ({ type: 'object', additionalProperties: false, required: Object.keys(properties), properties });
const prose = (max: number) => object({ text: string(max), references: array(string(80), 1, 12) });
export const TAILOR_RESULT_SCHEMA = object({
  headline: prose(180), summary: prose(1600), skills: array(string(80), 1, 40),
  experience: array(object({ id: string(80), summary: prose(1200), bullets: array(prose(900), 0, 8) }), 1, 16),
  projects: array(object({ id: string(80), description: prose(1400) }), 0, 13),
  factsToVerify: array(string(500), 0, 10),
});
function fail(detail: string): never { throw new ModelOutputValidationError('résumé tailor', detail); }
function record(value: unknown, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) fail('unexpected object fields');
  return value as Record<string, unknown>;
}
function text(value: unknown, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) fail('empty or oversized text');
  return value.trim();
}
function list(value: unknown, min: number, max: number): unknown[] {
  if (!Array.isArray(value) || value.length < min || value.length > max) fail('invalid array bounds');
  return value;
}
function unique<T>(values: T[]): T[] { if (new Set(values).size !== values.length) fail('duplicate selection or reference'); return values; }

export function parseTailorModelResult(value: unknown, evidence: TailorEvidence): TailorModelResult {
  if (JSON.stringify(value)?.length > 100_000) fail('output exceeds 100,000 characters');
  const root = record(value, ['headline', 'summary', 'skills', 'experience', 'projects', 'factsToVerify']);
  const sources = new Map(evidence.sources.map(source => [source.id, source]));
  function readProse(value: unknown, max: number, parent?: string): ReferencedProse {
    const item = record(value, ['text', 'references']);
    const references = unique(list(item.references, 1, 12).map(ref => text(ref, 80)));
    for (const ref of references) {
      const source = sources.get(ref);
      if (!source || (parent && source.parent !== parent)) fail('unknown or cross-parent reference');
    }
    return { text: text(item.text, max), references };
  }
  const skills = unique(list(root.skills, 1, 40).map(id => text(id, 80)));
  if (skills.some(id => !evidence.skills.some(skill => skill.id === id))) fail('unknown skill');
  const experience = list(root.experience, 1, 16).map(value => {
    const item = record(value, ['id', 'summary', 'bullets']);
    const id = text(item.id, 80);
    if (!evidence.experience.some(role => role.id === id)) fail('unknown role');
    return { id, summary: readProse(item.summary, 1200, id), bullets: list(item.bullets, 0, 8).map(bullet => readProse(bullet, 900, id)) };
  });
  const projects = list(root.projects, 0, 13).map(value => {
    const item = record(value, ['id', 'description']);
    const id = text(item.id, 80);
    if (!evidence.projects.some(project => project.id === id)) fail('unknown project');
    return { id, description: readProse(item.description, 1400, id) };
  });
  unique(experience.map(role => role.id)); unique(projects.map(project => project.id));
  return { headline: readProse(root.headline, 180), summary: readProse(root.summary, 1600), skills, experience, projects,
    factsToVerify: unique(list(root.factsToVerify, 0, 10).map(note => text(note, 500))) };
}

/** Only the normalized result reaches the client. No source text catalog or profile spreads. */
export function assembleTailorResult(result: TailorModelResult, profile: CandidateProfile, evidence: TailorEvidence): TailorResult {
  const refs = [result.headline, result.summary, ...result.experience.flatMap(role => [role.summary, ...role.bullets]), ...result.projects.map(project => project.description)].flatMap(item => item.references);
  return {
    document: {
      name: profile.name, location: profile.location, contact: { email: profile.contact.email, linkedin: profile.contact.linkedin, github: profile.contact.github },
      education: [...profile.education], headline: result.headline.text, summary: result.summary.text,
      skills: result.skills.map(id => evidence.skills.find(skill => skill.id === id)!.text),
      previousExperienceAvailableUponRequest: result.experience.length < profile.experience.length,
      additionalSkills: evidence.skills.filter(skill => !result.skills.includes(skill.id)).map(skill => skill.text),
      experience: result.experience.map(role => {
        const source = profile.experience[evidence.experience.findIndex(item => item.id === role.id)];
        return { title: source.title, organization: source.organization, period: source.period, summary: role.summary.text, bullets: role.bullets.map(bullet => bullet.text) };
      }),
      projects: result.projects.map(project => {
        const source = profile.projects[evidence.projects.findIndex(item => item.id === project.id)];
        return { title: source.title, context: source.context, description: project.description.text,
          links: [...(source.url ? [{ label: 'View project', url: source.url }] : []), ...(source.links ?? [])].map(link => ({ label: link.label, url: link.url })) };
      }),
    },
    evidenceUsed: [...new Set(refs.map(ref => evidence.sources.find(source => source.id === ref)!.label))],
    factsToVerify: result.factsToVerify,
  };
}
