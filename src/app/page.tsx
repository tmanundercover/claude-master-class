import { existsSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";
import Link from "next/link";
import ExpandableExperience from "@/components/ExpandableExperience";
import profile from "../../data/profile.json";

const hasProfilePhoto = existsSync(join(process.cwd(), "public", "profile-photo.jpg"));

const skillGroupBlueprints = [
  {
    title: "Interfaces & product",
    description: "Web and mobile experiences built for real workflows.",
    skills: ["JavaScript", "TypeScript", "React", "Angular", "Dart", "Flutter"],
  },
  {
    title: "Services & systems",
    description: "APIs, distributed services, and mature codebases.",
    skills: ["Node.js", "Kotlin", "Java", "C/C++", "Python", "PHP", "API integrations"],
  },
  {
    title: "Cloud & data",
    description: "Deployment, persistence, and managed platforms.",
    skills: ["AWS", "GCP", "Firebase", "PostgreSQL", "MySQL", "MongoDB", "DynamoDB", "Sanity.io"],
  },
  {
    title: "AI & delivery",
    description: "Evaluation, automation, testing, and release confidence.",
    skills: ["Prompt engineering", "LLM evaluation", "TDD", "Jest", "Docker", "CI/CD"],
  },
] as const;

const listedSkills = new Set(Object.values(profile.skills).flat());
const groupedSkills = new Set<string>(skillGroupBlueprints.flatMap((group) => group.skills));
const skillGroups = skillGroupBlueprints
  .map((group) => ({ ...group, skills: group.skills.filter((skill) => listedSkills.has(skill)) }))
  .filter((group) => group.skills.length > 0);
const additionalSkills = [...listedSkills].filter((skill) => !groupedSkills.has(skill));

export default function Home() {
  return (
    <main id="main">
      <section className="hero section">
        <div>
          <p className="eyebrow">Portfolio{profile.location ? ` / ${profile.location}` : ""}</p>
          <h1>{profile.headline}</h1>
          <p className="intro">{profile.pitch}</p>
          <div className="actions">
            <a className="button" href="#projects">Explore my work</a>
            <a className="button secondary" href={`mailto:${profile.contact.email}`}>Get in touch</a>
          </div>
        </div>
        <div className="identity-card">
          {hasProfilePhoto ? (
            <Image
              className="avatar avatar-photo"
              src="/profile-photo.jpg"
              width={100}
              height={100}
              alt=""
              aria-hidden="true"
            />
          ) : (
            <span className="avatar" aria-hidden="true">{profile.initials}</span>
          )}
          <h2>{profile.name}</h2>
          <p>Fullstack engineering. AI systems. Product delivery.</p>
          <span className="badge">Engineering since 2004</span>
        </div>
      </section>

      <section className="section" id="experience">
        <p className="eyebrow">01 / Experience</p>
        <h2>What I have contributed</h2>
        {profile.experience.map((role) => (
          <ExpandableExperience
            className="panel experience homepage-experience"
            key={`${role.title}-${role.organization}`}
            ariaLabel={`${role.title} at ${role.organization} experience details`}
            bullets={role.bullets}
          >
            <p className="muted">{role.period}</p>
            <div><h3>{role.title}</h3><p className="accent">{role.organization}</p><p>{role.summary}</p></div>
          </ExpandableExperience>
        ))}
      </section>

      <section className="section" id="skills">
        <p className="eyebrow">02 / Skills</p>
        <div className="skills-heading">
          <h2>A stack shaped by shipping.</h2>
          <p>Tools I&apos;ve used across product interfaces, services, cloud infrastructure, data, and applied AI work.</p>
        </div>
        <div className="capability-map">
          {[...skillGroups, ...(additionalSkills.length > 0 ? [{ title: "Additional focus", description: "More tools represented in the verified profile.", skills: additionalSkills }] : [])].map((group, index) => (
            <article className="capability-row" key={group.title}>
              <div className="capability-label">
                <span className="capability-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{group.title}</h3>
                  <p>{group.description}</p>
                </div>
              </div>
              <div className="skill-cloud" aria-label={`${group.title} skills`}>
                {group.skills.map((skill) => <span className="skill-chip" key={skill}>{skill}</span>)}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="projects">
        <p className="eyebrow">03 / Projects</p>
        <h2>Evidence you can discuss</h2>
        <div className="grid">
          {profile.projects.map((project) => (
            <article className="panel project-card" key={project.title}>
              <p className="muted">{project.context}</p>
              <h3>{project.title}</h3>
              <p>{project.summary}</p>
              <p><strong>Evidence:</strong> {project.evidence}</p>
              <div className="tags">{project.tools.map((tool) => <span className="badge" key={tool}>{tool}</span>)}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="education">
        <p className="eyebrow">04 / Learning</p>
        <h2>Education and development</h2>
        <ul>{profile.education.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="section contact panel" id="contact">
        <p className="eyebrow">05 / Contact</p>
        <h2>Let&apos;s start a conversation.</h2>
        <div className="actions">
          <a className="button" href={`mailto:${profile.contact.email}`}>Email me</a>
          <a className="button secondary" href={profile.contact.linkedin} rel="noreferrer" target="_blank">LinkedIn</a>
        </div>
        <p className="muted">Working on your applications? <Link href="/dashboard">Open the private workspace.</Link></p>
      </section>
    </main>
  );
}
