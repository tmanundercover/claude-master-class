// Server-only projection of approved profile facts. Internal project notes are excluded.
import { resumeTailorEvidence, type CandidateProfile } from './resume-tailor-evidence.ts';
import type { FitReference } from './fit-types.ts';

export function fitEvidence(profile: CandidateProfile) {
  const catalog = resumeTailorEvidence(profile);
  const sources: FitReference[] = catalog.sources.filter(source => !source.id.endsWith('-evidence')).map(({ id, label, text }) => ({ id, label, text }));
  sources.push({ id: 'profile-location', label: 'Profile location', text: profile.location });
  sources.push({ id: 'profile-summary', label: 'Profile summary and preferences', text: profile.pitch });
  profile.education.forEach((text, index) => sources.push({ id: `education-${index + 1}`, label: 'Education', text }));
  for (const [level, skills] of Object.entries(profile.skills)) if (level !== 'strong') {
    skills.forEach((text, index) => sources.push({ id: `${level}-skill-${index + 1}`, label: `${level} skill`, text }));
  }
  for (const [kind, records] of [['role', catalog.experience], ['project', catalog.projects]] as const) {
    for (const item of records) {
      const label = kind === 'role' ? catalog.sources.find(source => source.parent === item.id)!.label : (item as typeof catalog.projects[number]).title;
      for (const field of ['skills', 'tags'] as const) if (item[field].length) sources.push({ id: `${item.id}-${field}`, label: `${label} · ${field}`, text: item[field].join(', ') });
    }
  }
  return { experience: catalog.experience, projects: catalog.projects, sources };
}
