import { formatDocumentedYears } from "./evidence-format";
import profile from "../../data/profile.json";
import archive from "../../data/sanity-resume-snapshot.json";

export interface SkillEvidence {
  name: string;
  categories: string[];
  proficiency: number | null;
  versions: string[];
  firstDocumented: string | null;
  documentedRoleYears: number;
  sources: string[];
  sourceUpdatedAt: string | null;
}

export interface ResumeSearchItem {
  id: string;
  kind: "Experience" | "Skill" | "Project" | "Education";
  title: string;
  subtitle: string;
  description: string;
  metadata: string[];
  href: string;
  searchText: string;
}

const PUBLIC_SKILL_ALIASES: Record<string, string[]> = {
  JavaScript: ["Javascript"],
  "Apache Solr": ["SOLR", "Apache Solr"],
  React: ["React.js"],
  Angular: ["Angular.js", "Angular"],
  "Node.js": ["Node.js"],
  Kotlin: ["Kotlin"],
  Java: ["JAVA"],
  "C/C++": ["C/C++"],
  Python: ["Python"],
  PHP: ["PHP"],
  Dart: ["Dart"],
  Flutter: ["Flutter"],
  AWS: ["AWS"],
  GCP: ["Google Cloud Platform(GCP)", "GCP"],
  Firebase: ["Firebase: Firestore, Real-time Database", "Firebase: Hosting, Functions, Authentication, Push Notifications, Analytics"],
  "Firebase Functions": ["Firebase: Hosting, Functions, Authentication, Push Notifications, Analytics"],
  Firestore: ["Firebase: Firestore, Real-time Database"],
  PostgreSQL: ["PostgreSQL"],
  MySQL: ["MySQL"],
  MongoDB: ["MongoDB"],
  DynamoDB: ["DynamoDB"],
  "Sanity.io": ["Sanity.io"],
  Storybook: ["Storybook", "Storybook Component Library"],
  "Material UI": ["Material-ui"],
  "Google Forms Integrations": ["Google Forms"],
  n8n: ["n8n"],
  SQS: ["SQS"],
  "Shopify SDK": ["Shopify API", "Shopify Plugin Development"],
  WordPress: ["Wordpress"],
  "Prompt engineering": ["Prompt Engineering"],
  "LLM evaluation": ["AI Model Testing & Evaluation"],
  TDD: ["TDD", "Test Driven Development"],
  Jest: ["Jest"],
  Docker: ["Docker"],
  "CI/CD": ["Gitlab", "Jenkins"],
  "API integrations": ["Auth0", "Shopify API"],
};

const ABSTRACT_SKILLS_WITHOUT_COMBINED_SCORE = new Set(["CI/CD", "API integrations"]);

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9+#]+/g, " ").trim();
}

function matchesAlias(value: string, aliases: string[]): boolean {
  const normalized = normalize(value);
  return aliases.some((alias) => normalize(alias) === normalized);
}

function mergedRoleMonths(intervals: Array<{ start: string; end: string }>): number {
  const monthNumber = (date: string) => {
    const value = new Date(`${date.slice(0, 10)}T00:00:00Z`);
    return value.getUTCFullYear() * 12 + value.getUTCMonth();
  };
  const sorted = intervals
    .map(({ start, end }) => ({ start: monthNumber(start), end: monthNumber(end) }))
    .sort((a, b) => a.start - b.start);
  const merged: Array<{ start: number; end: number }> = [];
  for (const interval of sorted) {
    const previous = merged.at(-1);
    if (!previous || interval.start > previous.end + 1) {
      merged.push({ ...interval });
    } else {
      previous.end = Math.max(previous.end, interval.end);
    }
  }
  return merged.reduce((total, interval) => total + interval.end - interval.start + 1, 0);
}

const archiveSkillRecords = archive.skillsets.flatMap((skillset) =>
  skillset.skills.map((skill) => ({ ...skill, category: skillset.name })),
);

function evidenceFor(name: string, aliases: string[], referenceDate: Date): SkillEvidence {
  const matchingRecords = archiveSkillRecords.filter((skill) =>
    matchesAlias(skill.name, aliases) || matchesAlias(skill.title, aliases),
  );
  const dateToday = referenceDate.toISOString().slice(0, 10);
  const matchingExperiences = archive.experiences.filter((experience) =>
    experience.skills.some((skill) => matchesAlias(skill, aliases)),
  );
  const matchingProjects = archive.projects.filter((project) =>
    project.skills.some((skill) => matchesAlias(skill, aliases)),
  );
  const dates = [
    ...matchingExperiences.map((experience) => experience.startDate),
    ...matchingProjects.map((project) => project.inceptionDate),
  ].filter(Boolean).sort();
  const roleMonths = mergedRoleMonths(matchingExperiences.map((experience) => ({
    start: experience.startDate,
    end: experience.current ? dateToday : experience.endDate ?? experience.startDate,
  })));
  const scores = matchingRecords
    .map((skill) => skill.proficiency)
    .filter((score): score is number => typeof score === "number");

  return {
    name,
    categories: [...new Set(matchingRecords.map((skill) => skill.category))],
    proficiency: ABSTRACT_SKILLS_WITHOUT_COMBINED_SCORE.has(name) || scores.length === 0 ? null : Math.max(...scores),
    versions: [...new Set(matchingRecords.flatMap((skill) => skill.versions))],
    firstDocumented: dates[0] ?? null,
    documentedRoleYears: Math.round((roleMonths / 12) * 10) / 10,
    sources: [
      ...matchingExperiences.map((experience) => `${experience.title} at ${experience.organization}`),
      ...matchingProjects.map((project) => project.title),
    ].filter((source, index, all) => all.indexOf(source) === index),
    sourceUpdatedAt: matchingRecords.map((skill) => skill.updatedAt).sort().at(-1) ?? null,
  };
}

export function getPublicSkillEvidence(name: string, referenceDate = new Date()): SkillEvidence {
  return evidenceFor(name, PUBLIC_SKILL_ALIASES[name] ?? [name], referenceDate);
}

export function getArchivedSkillEvidence(referenceDate = new Date()): SkillEvidence[] {
  const names = [...new Set(archiveSkillRecords.map((skill) => skill.title || skill.name))];
  return names
    .map((name) => evidenceFor(name, [name], referenceDate))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function careerYears(referenceDate = new Date()): number {
  const firstRole = archive.experiences.map((experience) => experience.startDate).sort()[0];
  const start = new Date(`${firstRole}T00:00:00Z`);
  let years = referenceDate.getUTCFullYear() - start.getUTCFullYear();
  const anniversaryHasPassed = referenceDate.getUTCMonth() > start.getUTCMonth()
    || (referenceDate.getUTCMonth() === start.getUTCMonth() && referenceDate.getUTCDate() >= start.getUTCDate());
  if (!anniversaryHasPassed) years -= 1;
  return Math.max(0, years);
}

export { formatDocumentedYears } from "./evidence-format";
export function getResumeEvidenceSummary(referenceDate = new Date()) {
  return {
    careerYears: careerYears(referenceDate),
    archivedSkillCount: getArchivedSkillEvidence(referenceDate).length,
    proficiencyCount: getArchivedSkillEvidence(referenceDate).filter((skill) => skill.proficiency !== null).length,
    experienceCount: archive.experiences.length,
    projectCount: archive.projects.length,
    currentExperienceCount: profile.experience.length,
    currentProjectCount: profile.projects.length,
  };
}

export function getResumeSearchItems(referenceDate = new Date()): ResumeSearchItem[] {
  const currentExperience = profile.experience.map((experience, index): ResumeSearchItem => ({
    id: `current-experience-${index}`,
    kind: "Experience",
    title: experience.title,
    subtitle: `${experience.organization} · ${experience.period}`,
    description: experience.summary,
    metadata: [...experience.bullets, ...experience.tags],
    href: "/#experience",
    searchText: [experience.title, experience.organization, experience.period, experience.summary, ...experience.bullets, ...experience.tags].join(" "),
  }));
  const publicSkills = Object.values(profile.skills).flat().map((name): ResumeSearchItem => {
    const evidence = getPublicSkillEvidence(name, referenceDate);
    const year = evidence.firstDocumented?.slice(0, 4);
    return {
      id: `current-skill-${normalize(name)}`,
      kind: "Skill",
      title: name,
      subtitle: [year ? `Documented since ${year}` : null, formatDocumentedYears(evidence.documentedRoleYears)].filter(Boolean).join(" · ") || "Current profile skill",
      description: evidence.sources.length > 0 ? `Evidence across ${evidence.sources.slice(0, 3).join(", ")}.` : "Included in the current verified profile.",
      metadata: [evidence.proficiency !== null ? `${Math.round(evidence.proficiency * 100)}% archived self-rating` : "", ...evidence.versions.map((version) => `Version ${version}`)].filter(Boolean),
      href: "/#skills",
      searchText: [name, ...evidence.categories, ...evidence.sources, ...evidence.versions].join(" "),
    };
  });
  const currentProjects = profile.projects.map((project, index): ResumeSearchItem => {
    const directUrl = "url" in project && project.url ? project.url : null;
    const links = "links" in project && project.links ? project.links : [];
    return {
      id: `current-project-${index}`,
      kind: "Project",
      title: project.title,
      subtitle: project.context,
      description: project.summary,
      metadata: [...project.skills, ...project.tags],
      href: directUrl ?? links[0]?.url ?? "/#projects",
      searchText: [project.title, project.context, project.summary, ...project.skills, ...project.tags, ...links.flatMap((link) => [link.label, link.url])].join(" "),
    };
  });
  const currentEducation = profile.education.map((education, index): ResumeSearchItem => ({
    id: `education-${index}`,
    kind: "Education",
    title: education,
    subtitle: "Education",
    description: "Verified education from the current profile.",
    metadata: [],
    href: "/#education",
    searchText: education,
  }));
  const archivedSkills = getArchivedSkillEvidence(referenceDate)
    .filter((skill) => !publicSkills.some((item) => normalize(item.title) === normalize(skill.name)))
    .map((skill): ResumeSearchItem => ({
      id: `archive-skill-${normalize(skill.name)}`,
      kind: "Skill",
      title: skill.name,
      subtitle: skill.firstDocumented ? `Historical evidence since ${skill.firstDocumented.slice(0, 4)}` : "Historical skill record",
      description: skill.sources.length > 0 ? `Linked to ${skill.sources.slice(0, 3).join(", ")}.` : "Preserved from the dated Sanity résumé.",
      metadata: [skill.proficiency !== null ? `${Math.round(skill.proficiency * 100)}% archived self-rating` : "", ...skill.categories].filter(Boolean),
      href: "/#skills",
      searchText: [skill.name, ...skill.categories, ...skill.sources, ...skill.versions].join(" "),
    }));
  const archivedProjects = archive.projects.map((project, index): ResumeSearchItem => ({
    id: `archive-project-${index}`,
    kind: "Project",
    title: project.title,
    subtitle: `Portfolio archive · ${project.inceptionDate.slice(0, 4)}`,
    description: project.description ?? "Historical portfolio project.",
    metadata: project.skills,
    href: project.url ?? "/#projects",
    searchText: [project.title, project.description ?? "", ...project.skills].join(" "),
  }));

  return [...currentExperience, ...publicSkills, ...currentProjects, ...currentEducation, ...archivedSkills, ...archivedProjects]
    .map((item) => ({ ...item, searchText: `${item.title} ${item.subtitle} ${item.description} ${item.metadata.join(" ")} ${item.searchText}`.toLowerCase() }));
}

export { archive as sanityResumeArchive };
