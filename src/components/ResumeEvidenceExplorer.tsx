import { useMemo, useState } from "react";
import ProjectMetadata from "./ProjectMetadata";
import MetadataTags from './MetadataTags';
import { splitTechnologyMetadata } from '../lib/skill-icons';
import type { SkillEvidence } from "@/lib/resume-evidence";
import ExperienceProjects from './ExperienceProjects';
import { relatedProjects } from '../lib/project-navigation';

interface ArchivedExperience {
  title: string;
  organization: string;
  organizationContext: string | null;
  startDate: string;
  endDate: string | null;
  current: boolean;
  location: string;
  summary: string;
  bullets: string[];
  skills: string[];
}

interface ArchivedProject {
  title: string;
  inceptionDate: string;
  url: string | null;
  description: string | null;
  skills: string[];
}

interface CurrentExperience {
  projectIds?: string[];
  title: string;
  organization: string;
  period: string;
  summary: string;
  bullets: string[];
  tags: string[];
}

interface CurrentProject {
  id: string;
  title: string;
  context: string;
  summary: string;
  evidence: string;
  skills: string[];
  tags: string[];
  url?: string;
  links?: Array<{ label: string; url: string }>;
}

type EvidenceKind = "All" | "Skills" | "Experience" | "Projects";

function includesQuery(values: Array<string | null>, query: string): boolean {
  const haystack = values.filter(Boolean).join(" ").toLowerCase();
  return query.toLowerCase().trim().split(/\s+/).filter(Boolean).every((term) => haystack.includes(term));
}

function formatDate(date: string | null, current = false): string {
  if (current) return "Present";
  if (!date) return "Undated";
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

export default function ResumeEvidenceExplorer({ skills, experiences, projects, currentExperiences, currentProjects }: {
  skills: SkillEvidence[];
  experiences: ArchivedExperience[];
  projects: ArchivedProject[];
  currentExperiences: CurrentExperience[];
  currentProjects: CurrentProject[];
}) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<EvidenceKind>("All");

  const filteredSkills = useMemo(() => skills.filter((skill) => includesQuery([
    skill.name, ...skill.categories, ...skill.sources, ...skill.versions,
  ], query)), [query, skills]);
  const filteredExperiences = useMemo(() => experiences.filter((experience) => includesQuery([
    experience.title, experience.organization, experience.organizationContext, experience.location,
    experience.summary, ...experience.bullets, ...experience.skills,
  ], query)), [experiences, query]);
  const filteredProjects = useMemo(() => projects.filter((project) => includesQuery([
    project.title, project.description, project.inceptionDate, ...project.skills,
  ], query)), [projects, query]);
  const filteredCurrentExperiences = useMemo(() => currentExperiences.filter((experience) => includesQuery([
    experience.title, experience.organization, experience.period, experience.summary, ...experience.bullets, ...experience.tags,
  ], query)), [currentExperiences, query]);
  const filteredCurrentProjects = useMemo(() => currentProjects.filter((project) => includesQuery([
    project.title, project.context, project.summary, project.evidence, ...project.skills, ...project.tags,
    ...(project.links?.flatMap((link) => [link.label, link.url]) ?? []),
  ], query)), [currentProjects, query]);
  const resultCount = (kind === "All" || kind === "Skills" ? filteredSkills.length : 0)
    + (kind === "All" || kind === "Experience" ? filteredExperiences.length + filteredCurrentExperiences.length : 0)
    + (kind === "All" || kind === "Projects" ? filteredProjects.length + filteredCurrentProjects.length : 0);

  return (
    <>
      <div className="evidence-controls">
        <label>
          Search all résumé evidence
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="React, 2018, fintech, Spring…" />
        </label>
        <label>
          Evidence type
          <select value={kind} onChange={(event) => setKind(event.target.value as EvidenceKind)}>
            <option>All</option><option>Skills</option><option>Experience</option><option>Projects</option>
          </select>
        </label>
      </div>
      <p className="results-heading"><span><strong>{resultCount}</strong> matching records</span></p>

      {(kind === "All" || kind === "Experience") && filteredCurrentExperiences.length > 0 && (
        <section className="evidence-section">
          <div className="evidence-section-heading"><p className="eyebrow">Current résumé</p><h2>Consolidated experience</h2></div>
          <div className="evidence-list">
            {filteredCurrentExperiences.map((experience, index) => (
              <article className="panel evidence-record" key={`current-${experience.organization}-${experience.period}-${index}`}>
                <div className="evidence-record-heading">
                  <div><h3>{experience.title}</h3><p className="accent">{experience.organization}</p></div>
                  <div><p className="muted">{experience.period}</p><MetadataTags tags={experience.tags} /></div>
                </div>
                <p>{experience.summary}</p>
                <ul>{experience.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
                <ExperienceProjects projects={relatedProjects(experience.projectIds, currentProjects)} />
              </article>
            ))}
          </div>
        </section>
      )}

      {(kind === "All" || kind === "Skills") && filteredSkills.length > 0 && (
        <section className="evidence-section">
          <div className="evidence-section-heading"><p className="eyebrow">Skills</p><h2>Technology depth</h2></div>
          <div className="evidence-skill-grid">
            {filteredSkills.map((skill) => (
              <article className="evidence-skill" key={skill.name}>
                <div className="evidence-skill-heading">
                  <h3>{skill.name}</h3>
                  {skill.proficiency !== null && <strong>{Math.round(skill.proficiency * 100)}%</strong>}
                </div>
                {skill.proficiency !== null && <div className="proficiency-track" aria-label={`${Math.round(skill.proficiency * 100)} percent archived self-rating`}><span style={{ width: `${skill.proficiency * 100}%` }} /></div>}
                <p className="muted">{[
                  skill.firstDocumented ? `Documented since ${skill.firstDocumented.slice(0, 4)}` : null,
                  skill.documentedRoleYears > 0 ? `${skill.documentedRoleYears} years in dated roles` : null,
                ].filter(Boolean).join(" · ") || "Archived skill record"}</p>
                {skill.categories.length > 0 && <p><strong>Category:</strong> {skill.categories.join(", ")}</p>}
                {skill.versions.length > 0 && <p><strong>Versions recorded:</strong> {skill.versions.join(", ")}</p>}
                {skill.sources.length > 0 && <details><summary>Evidence sources ({skill.sources.length})</summary><ul>{skill.sources.map((source) => <li key={source}>{source}</li>)}</ul></details>}
                {skill.proficiency !== null && <small>Historical self-rating from the archived résumé—not a certification or current standardized score.</small>}
              </article>
            ))}
          </div>
        </section>
      )}

      {(kind === "All" || kind === "Experience") && filteredExperiences.length > 0 && (
        <section className="evidence-section">
          <div className="evidence-section-heading"><p className="eyebrow">Experience</p><h2>Dated role record</h2></div>
          <div className="evidence-list">
            {filteredExperiences.map((experience, index) => (
              <article className="panel evidence-record" key={`${experience.organization}-${experience.startDate}-${index}`}>
                <div className="evidence-record-heading">
                  <div><h3>{experience.title}</h3><p className="accent">{experience.organization}{experience.organizationContext ? ` · ${experience.organizationContext}` : ""}</p></div>
                  <div><p className="muted">{formatDate(experience.startDate)} – {formatDate(experience.endDate, experience.current)}{experience.location ? ` · ${experience.location}` : ""}</p><MetadataTags tags={splitTechnologyMetadata(experience.skills).tags} /></div>
                </div>
                <p>{experience.summary}</p>
                <ul>{experience.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
                <ProjectMetadata skills={splitTechnologyMetadata(experience.skills).skills} tags={[]} />
              </article>
            ))}
          </div>
        </section>
      )}

      {(kind === "All" || kind === "Projects") && filteredProjects.length > 0 && (
        <section className="evidence-section">
          <div className="evidence-section-heading"><p className="eyebrow">Projects</p><h2>Historical portfolio evidence</h2></div>
          <div className="grid">
            {filteredProjects.map((project) => (
              <article className="panel evidence-record" key={`${project.title}-${project.inceptionDate}`}>
                <p className="muted">Started {formatDate(project.inceptionDate)}</p>
                <MetadataTags tags={splitTechnologyMetadata(project.skills).tags} />
                <h3>{project.title}</h3>
                <p>{project.description ?? "Historical portfolio project preserved from the archived site."}</p>
                <ProjectMetadata skills={splitTechnologyMetadata(project.skills).skills} tags={[]} />
                {project.url && <p><a href={project.url} target="_blank" rel="noreferrer">Open archived project destination ↗</a></p>}
              </article>
            ))}
          </div>
        </section>
      )}

      {(kind === "All" || kind === "Projects") && filteredCurrentProjects.length > 0 && (
        <section className="evidence-section">
          <div className="evidence-section-heading"><p className="eyebrow">Current résumé</p><h2>Consolidated project evidence</h2></div>
          <div className="grid">
            {filteredCurrentProjects.map((project) => (
              <article className="panel evidence-record" key={`current-project-${project.title}`}>
                <p className="muted">{project.context}</p>
                <h3>{project.title}</h3>
                <p>{project.summary}</p>
                <p><strong>Evidence:</strong> {project.evidence}</p>
                <ProjectMetadata skills={project.skills} tags={project.tags} />
                {project.url && <p><a href={project.url} target="_blank" rel="noreferrer">Visit project ↗</a></p>}
                {project.links && (
                  <div className="actions project-links">
                    {project.links.map((link) => <a href={link.url} key={link.url} target="_blank" rel="noreferrer">{link.label} ↗</a>)}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {resultCount === 0 && <div className="panel empty-state"><h2>No matching evidence</h2><p className="muted">Try a broader technology, employer, year, or project term.</p></div>}
    </>
  );
}
