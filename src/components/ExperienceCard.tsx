import type { ReactNode } from "react";
import ExperienceSkills from "./ExperienceSkills";
import MetadataTags from './MetadataTags';
import { splitTechnologyMetadata } from '../lib/skill-icons';
import ExperienceProjects from './ExperienceProjects';
import type { RelatedProject } from '../lib/project-navigation';

export default function ExperienceCard({
  ariaLabel,
  bullets,
  children,
  className,
  skills = [],
  tags = [],
  period,
  heading,
  employmentType,
  projects = [],
}: {
  ariaLabel: string;
  bullets: string[];
  children: ReactNode;
  className: string;
  skills?: string[];
  tags?: string[];
  period?: string;
  heading?: ReactNode;
  employmentType?: string;
  projects?: RelatedProject[];
}) {
  const metadata = splitTechnologyMetadata(skills, tags);
  return (
    <article
      className={`${className} experience-record`}
      aria-label={ariaLabel}
    >
      {heading && <div className="experience-heading">{heading}</div>}
      {period && (
        <div className="experience-timeline">
          <p className="muted experience-period">{period}</p>
          <MetadataTags tags={metadata.tags} />
        </div>
      )}
      <div className="experience-content">
        {children}
        {employmentType && (
          <div className="experience-engagement">
            <span className="badge">{employmentType === "consulting" ? "Consulting" : "Full-time"}</span>
          </div>
        )}
        <ul className="experience-bullets">
          {bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
        </ul>
        <ExperienceProjects projects={projects} />
      </div>
      {metadata.skills.length > 0 && <ExperienceSkills skills={metadata.skills} />}
    </article>
  );
}
