// Server-only projection: internal project evidence never enters public page data.
import profile from "../../data/profile.json";
import type { PublicProfile } from "../app-types";
import { getPublicSkillEvidence } from './resume-evidence';
import { sortSkillsByExperience } from './skill-ranking';

export function rankPublicSkills(skills: readonly string[], referenceDate = new Date()): string[] {
  const evidence = Object.fromEntries(skills.map(skill => [skill, getPublicSkillEvidence(skill, referenceDate)]));
  return sortSkillsByExperience(skills, evidence);
}

export function publicProfile(): PublicProfile {
  return {
    ...profile,
    experience: profile.experience.map(role => ({ ...role, skills: rankPublicSkills(role.skills) })),
    projects: profile.projects.map(({ id, title, context, summary, skills, tags, ...project }) => ({
      id, title, context, summary, skills: rankPublicSkills(skills), tags,
      ...(project.url ? { url: project.url } : {}),
      ...(project.links ? { links: project.links } : {}),
    })),
  };
}
