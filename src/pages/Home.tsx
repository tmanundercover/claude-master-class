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
import { technologyGroups } from "@/lib/technology-groups";
import { sortSkillsByExperience } from '@/lib/skill-ranking';
import { sitePath } from "@/lib/site-path";
import type { HomeData, PublicProfile } from "@/app-types";
import { formatDocumentedYears } from "@/lib/evidence-format";
import { skillTargetId } from "@/lib/skill-target";
import { scrollToSkill } from "@/lib/scroll-to-skill";
import { documentFilename } from '@/lib/document-filename';
import ProfileCard from '../components/ProfileCard';
import { projectTargetId, relatedProjects, scrollToProject } from '../lib/project-navigation';

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

export default function Home({ yearsInSoftware, skillEvidence, searchItems, profile }: HomeData & { profile: PublicProfile }) {
  useEffect(() => {
    function followFragment() {
      const id = window.location.hash.slice(1);
      if (id.startsWith('project-')) void scrollToProject(id);
      else if (id.startsWith('skill-')) void scrollToSkill(id);
    }
    // Wait for the responsive experience rows to settle before following a deep link.
    let layoutFrame = 0;
    const frame = requestAnimationFrame(() => { layoutFrame = requestAnimationFrame(followFragment); });
    window.addEventListener('hashchange', followFragment);
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(layoutFrame);
      window.removeEventListener('hashchange', followFragment);
    };
  }, []);
  const listedSkills = new Set(Object.values(profile.skills).flat());
  const skillGroups = technologyGroups
    .map((group) => ({ ...group, skills: sortSkillsByExperience(group.skills.filter((skill) => listedSkills.has(skill)), skillEvidence) }))
    .filter((group) => group.skills.length > 0);
  const experienceStartYear = (period: string) => Number(period.match(/\b\d{4}\b/)?.[0] ?? Number.POSITIVE_INFINITY);
  const recentExperience = profile.experience.filter((role) => experienceStartYear(role.period) > 2017);
  const previousExperience = profile.experience.filter((role) => experienceStartYear(role.period) <= 2017);
  return (
    <main id="main">
      <section className="hero section">
        <div>
          <p className="eyebrow">Portfolio{profile.location ? ` / ${profile.location}` : ""}</p>
          <h1>{profile.headline}</h1>
          <p className="intro">{profile.pitch} Explore <a href="#previous-experience">Previous Experience</a> below my most recent roles for earlier projects and contributions.</p>
          <div className="actions">
            <a className="button" href="#projects">Explore my work</a>
            <a className="button secondary" href="#contact">Get in touch</a>
          </div>
        </div>
        <div className="identity-column"><ProfileCard name={profile.name} initials={profile.initials} yearsInSoftware={yearsInSoftware} /><a className="resume-download" href={sitePath('/resume.pdf')} download={documentFilename(profile.name, null, 'resume', 'pdf')}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" /></svg> Download résumé (PDF)</a></div>
      </section>

      <section className="section" id="experience">
        <p className="eyebrow">01 / Experience</p>
        <h2>What I have contributed</h2>
        {recentExperience.map((role) => (
          <ExperienceCard
            className="panel experience homepage-experience"
            key={`${role.title}-${role.organization}-${role.period}`}
            ariaLabel={`${role.title} at ${role.organization} (${role.period}) experience details`}
            bullets={role.bullets}
            skills={role.skills}
            tags={role.tags}
            period={role.period}
            employmentType={role.employmentType}
            projects={relatedProjects(role.projectIds, profile.projects)}
          >
            <div><h3>{role.title}</h3><p className="accent">{role.organization}</p><p>{role.summary}</p></div>
          </ExperienceCard>
        ))}
        <PreviousExperience roles={previousExperience} projects={profile.projects} />
      </section>

      <section className="section" id="skills">
        <p className="eyebrow">02 / Skills</p>
        <div className="skills-heading">
          <h2>A stack shaped by shipping.</h2>
          <p>Tools I&apos;ve used across product interfaces, services, cloud infrastructure, data, and applied AI work. Historical projects and dated roles show how far back that work goes.</p>
        </div>
        <div className="capability-map">
          {skillGroups.map((group, index) => (
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
        <p className="skill-evidence-note">Skills are ordered by years in dated roles, highest first, with alphabetical ties and skills without a recorded total last. “Since” is the earliest dated role or project in the archived résumé. Role totals add dated employment periods and do not imply continuous daily use. Percentages are preserved historical self-ratings, not certifications.</p>
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
            return <article id={projectTargetId(project.id)} tabIndex={-1} aria-label={`${project.title} project`} className={`panel project-card${links.length > 0 ? " project-card--linked" : ""}`} key={project.id} onClick={links.length > 0 ? (event) => {
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
