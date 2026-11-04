// Server-only. The route supplies the approved consolidated profile, never uploads or the archive.
import type { PublicProfile } from '../app-types';

export type CandidateProfile = Omit<PublicProfile, 'projects'> & { projects: (PublicProfile['projects'][number] & { evidence?: string })[] };
export type EvidenceSource = { id: string; parent: string; kind: 'summary' | 'bullet' | 'project' | 'skill'; label: string; text: string };
export function resumeTailorEvidence(profile: CandidateProfile) {
  const sources: EvidenceSource[] = [];
  const experience = profile.experience.map((role, index) => {
    const id = `role-${index + 1}`;
    const label = `${role.title} · ${role.organization} (${role.period})`;
    sources.push({ id: `${id}-summary`, parent: id, kind: 'summary', label, text: role.summary });
    role.bullets.forEach((text, bullet) => sources.push({ id: `${id}-bullet-${bullet + 1}`, parent: id, kind: 'bullet', label, text }));
    return { id, title: role.title, organization: role.organization, period: role.period, skills: role.skills, tags: role.tags };
  });
  const projects = profile.projects.map((project, index) => {
    const id = `project-${index + 1}`;
    sources.push({ id: `${id}-summary`, parent: id, kind: 'project', label: project.title, text: project.summary });
    if (project.evidence) sources.push({ id: `${id}-evidence`, parent: id, kind: 'project', label: project.title, text: project.evidence });
    return { id, title: project.title, context: project.context, skills: project.skills, tags: project.tags };
  });
  const skills = profile.skills.strong.map((text, index) => {
    const id = `skill-${index + 1}`;
    sources.push({ id, parent: id, kind: 'skill', label: text, text });
    return { id, text };
  });
  return { experience, projects, skills, sources };
}
export type TailorEvidence = ReturnType<typeof resumeTailorEvidence>;
