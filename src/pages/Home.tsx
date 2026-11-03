import { faLinkedinIn } from "@fortawesome/free-brands-svg-icons";
import { useEffect } from "react";
import AppLink from "@/components/AppLink";
import { siGithub } from "simple-icons";
import ContactForm from "@/components/ContactForm";
import ExperienceCard from "@/components/ExperienceCard";
import PreviousExperience from "@/components/PreviousExperience";
import ResumeSearchFab from "@/components/ResumeSearchFab";
import SkillChip from "@/components/SkillChip";
import ProjectMetadata from "@/components/ProjectMetadata";
import { sitePath } from "@/lib/site-path";
import type { HomeData, PublicProfile } from "@/app-types";
import { formatDocumentedYears } from "@/lib/evidence-format";
import { skillTargetId } from "@/lib/skill-target";
import { scrollToSkill } from "@/lib/scroll-to-skill";

const skillGroupBlueprints = [
  {
    title: "Interfaces & product",
    description: "Web and mobile experiences built for real workflows.",
    skills: ["JavaScript", "TypeScript", "React", "Angular", "Dart", "Flutter", "Vite", "Storybook", "Material UI"],
  },
  {
    title: "Services & systems",
    description: "APIs, distributed services, and mature codebases.",
    skills: ["Node.js", "Kotlin", "Java", "C/C++", "Python", "PHP", "API design", "Distributed systems", "API integrations", "Resend API", "Auth0", "Firebase Authentication", "Custom authentication", "Multi-tenant architecture"],
  },
  {
    title: "Cloud platforms",
    description: "Compute, functions, queues, and managed application platforms.",
    skills: ["AWS", "GCP", "AWS Lambda", "Firebase", "Firebase Hosting", "SQS", "Firebase Functions"],
  },
  {
    title: "Databases",
    description: "Relational, document, and managed data stores.",
    skills: ["RDS", "Firestore", "DynamoDB", "MongoDB", "PostgreSQL", "MySQL"],
  },
  {
    title: "AI execution",
    description: "Model evaluation, agent operations, and AI-assisted engineering.",
    skills: ["OpenAI Codex", "Google Gemini", "Prompt engineering", "LLM evaluation", "Agent runtimes"],
  },
  {
    title: "Testing & quality",
    description: "Repeatable checks that make product behavior trustworthy.",
    skills: ["TDD", "Jest", "Automated testing"],
  },
  {
    title: "Delivery & operations",
    description: "Observable, contract-driven systems built to ship and recover safely.",
    skills: ["OpenSpec", "Runtime observability", "Docker", "CI/CD"],
  },
  {
    title: "CMS & commerce",
    description: "Content systems, storefronts, and their supporting creative tooling.",
    skills: ["Sanity.io", "Custom CMS architecture", "Shopify", "Shopify SDK", "WordPress", "Wix", "GIMP"],
  },
  {
    title: "Automations",
    description: "Connected workflows that reduce repetitive business operations.",
    skills: ["Google Forms Integrations", "Google Sheets integrations", "Wix Automations", "n8n", "Zapier", "DocuSign"],
  },
] as const;

const [linkedInWidth, linkedInHeight, , , linkedInPathData] = faLinkedinIn.icon;
const linkedInPath = Array.isArray(linkedInPathData) ? linkedInPathData.join(" ") : linkedInPathData;

function ContactIcon({ kind }: { kind: "email" | "linkedin" | "github" }) {
  if (kind === "email") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
        <path d="m4 6 8 7 8-7" />
      </svg>
    );
  }

  if (kind === "linkedin") {
    return (
      <svg className="contact-brand-icon" viewBox={`0 0 ${linkedInWidth} ${linkedInHeight}`} aria-hidden="true" focusable="false">
        <path d={linkedInPath} />
      </svg>
    );
  }

  return (
    <svg className="contact-brand-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={siGithub.path} />
    </svg>
  );
}

export default function Home({ hasProfilePhoto, yearsInSoftware, skillEvidence, searchItems, profile }: HomeData & { profile: PublicProfile }) {
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id.startsWith("skill-")) return;
    function followSkillFragment() {
      if (window.location.hash === `#${id}`) void scrollToSkill(id);
    }
    // Wait for the responsive experience rows to settle before following a deep link.
    let layoutFrame = 0;
    const frame = requestAnimationFrame(() => { layoutFrame = requestAnimationFrame(followSkillFragment); });
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(layoutFrame);
    };
  }, []);
  const listedSkills = new Set(Object.values(profile.skills).flat());
  const groupedSkills = new Set<string>(skillGroupBlueprints.flatMap((group) => group.skills));
  const skillGroups = skillGroupBlueprints
    .map((group) => ({ ...group, skills: group.skills.filter((skill) => listedSkills.has(skill)) }))
    .filter((group) => group.skills.length > 0);
  const additionalSkills = [...listedSkills].filter((skill) => !groupedSkills.has(skill));
  const experienceStartYear = (period: string) => Number(period.match(/\b\d{4}\b/)?.[0] ?? Number.POSITIVE_INFINITY);
  const recentExperience = profile.experience.filter((role) => experienceStartYear(role.period) > 2017);
  const previousExperience = profile.experience.filter((role) => experienceStartYear(role.period) <= 2017);
  return (
    <main id="main">
      <section className="hero section">
        <div>
          <p className="eyebrow">Portfolio{profile.location ? ` / ${profile.location}` : ""}</p>
          <h1>{profile.headline}</h1>
          <p className="intro">{profile.pitch}</p>
          <div className="actions">
            <a className="button" href="#projects">Explore my work</a>
            <a className="button secondary" href="#contact">Get in touch</a>
          </div>
        </div>
        <div className="identity-card">
          {hasProfilePhoto ? (
            <img
              className="avatar avatar-photo"
              src={sitePath("/profile-photo.jpg")}
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
          <span className="badge">{yearsInSoftware}+ years in software · Since 2004</span>
        </div>
      </section>

      <section className="section" id="experience">
        <p className="eyebrow">01 / Experience</p>
        <h2>What I have contributed</h2>
        {recentExperience.map((role) => (
          <ExperienceCard
            className="panel experience homepage-experience"
            key={`${role.title}-${role.organization}`}
            ariaLabel={`${role.title} at ${role.organization} experience details`}
            bullets={role.bullets}
            skills={role.skills}
            period={role.period}
            employmentType={role.employmentType}
          >
            <div><h3>{role.title}</h3><p className="accent">{role.organization}</p><p>{role.summary}</p></div>
          </ExperienceCard>
        ))}
        <PreviousExperience roles={previousExperience} />
      </section>

      <section className="section" id="skills">
        <p className="eyebrow">02 / Skills</p>
        <div className="skills-heading">
          <h2>A stack shaped by shipping.</h2>
          <p>Tools I&apos;ve used across product interfaces, services, cloud infrastructure, data, and applied AI work. Historical projects and dated roles show how far back that work goes.</p>
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
                {group.skills.map((skill) => {
                  const evidence = skillEvidence[skill];
                  const documentedYears = formatDocumentedYears(evidence.documentedRoleYears);
                  return (
                    <SkillChip skill={skill} key={skill} id={skillTargetId(skill)} tabIndex={-1}>
                      {(evidence.firstDocumented || documentedYears || evidence.proficiency !== null) && (
                        <span className="skill-chip-evidence">
                          {[
                            evidence.firstDocumented ? `Since ${evidence.firstDocumented.slice(0, 4)}` : null,
                            documentedYears,
                            evidence.proficiency !== null ? `${Math.round(evidence.proficiency * 100)}% archived self-rating` : null,
                          ].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </SkillChip>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
        <p className="skill-evidence-note">“Since” is the earliest dated role or project in the archived résumé. Role totals add dated employment periods and do not imply continuous daily use. Percentages are preserved historical self-ratings, not certifications.</p>
      </section>

      <section className="section" id="projects">
        <p className="eyebrow">03 / Projects</p>
        <h2>Selected projects</h2>
        <div className="grid">
          {profile.projects.map((project) => {
            const links = [
              ...("url" in project && project.url ? [{ label: "Visit project", url: project.url }] : []),
              ...("links" in project && project.links ? project.links : []),
            ];
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- The native project links provide keyboard access; the card delegates pointer clicks without covering hoverable tags.
            return <article className={`panel project-card${links.length > 0 ? " project-card--linked" : ""}`} key={project.title} onClick={links.length > 0 ? (event) => {
              if ((event.target as Element).closest("a, button") || window.getSelection()?.isCollapsed === false) return;
              event.currentTarget.querySelector<HTMLAnchorElement>(".project-primary-link")?.click();
            } : undefined}>
              <p className="muted">{project.context}</p>
              <h3>{project.title}</h3>
              <p>{project.summary}</p>
              <ProjectMetadata skills={project.skills} tags={project.tags} />
              {links.length > 0 && (
                <div className="actions project-links" aria-label="Project links">
                  {links.map((link, index) => <a className={index === 0 ? "project-primary-link" : "project-secondary-link"} href={link.url} key={link.url} target="_blank" rel="noreferrer" aria-label={`${link.label}: ${project.title} (opens in a new tab)`}>{link.label} ↗</a>)}
                </div>
              )}
            </article>;
          })}
        </div>
      </section>

      <section className="section" id="education">
        <p className="eyebrow">04 / Learning</p>
        <h2>Education and development</h2>
        <ul>{profile.education.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="section contact panel" id="contact">
        <div className="contact-grid">
          <div className="contact-introduction">
            <p className="eyebrow">05 / Contact</p>
            <h2>Let&apos;s start a conversation.</h2>
            <p className="muted">Reach out directly or leave the details here while message delivery is being connected.</p>
            <div className="contact-links" aria-label="Contact links">
              <a className="contact-icon-link" href={`mailto:${profile.contact.email}`} aria-label="Email Terrell" title="Email">
                <ContactIcon kind="email" />
              </a>
              <a className="contact-icon-link" href={profile.contact.linkedin} rel="noreferrer" target="_blank" aria-label="Terrell on LinkedIn" title="LinkedIn">
                <ContactIcon kind="linkedin" />
              </a>
              <a className="contact-icon-link" href={profile.contact.github} rel="noreferrer" target="_blank" aria-label="Terrell on GitHub" title="GitHub">
                <ContactIcon kind="github" />
              </a>
            </div>
            <p className="muted contact-workspace-link"><AppLink href="/login">Log in to watch my answers to common interview questions.</AppLink></p>
          </div>
          <ContactForm candidateName={profile.name} />
        </div>
      </section>
      <ResumeSearchFab items={searchItems} />
    </main>
  );
}
