import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import ExperienceCard from "@/components/ExperienceCard";
import { relatedProjects, type RelatedProject } from '../lib/project-navigation';

interface ExperienceRole {
  title: string;
  organization: string;
  period: string;
  summary: string;
  bullets: string[];
  skills: string[];
  tags: string[];
  employmentType: string;
  projectIds?: string[];
}

export default function PreviousExperience({ roles, projects }: { roles: ExperienceRole[]; projects: RelatedProject[] }) {
  const [expanded, setExpanded] = useState(false);
  const reduceMotion = useReducedMotion();

  if (roles.length === 0) return null;

  return (
    <div id="previous-experience" className="previous-experience">
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id="previous-experience-list"
            className="previous-experience-list"
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.3, ease: "easeOut" }}
          >
            {roles.map((role) => (
              <ExperienceCard
                className="panel experience homepage-experience"
                key={`${role.title}-${role.organization}-${role.period}`}
                ariaLabel={`${role.title} at ${role.organization} (${role.period}) experience details`}
                bullets={role.bullets}
                skills={role.skills}
                tags={role.tags}
                period={role.period}
                employmentType={role.employmentType}
                projects={relatedProjects(role.projectIds, projects)}
              >
                <div><h3>{role.title}</h3><p className="accent">{role.organization}</p><p>{role.summary}</p></div>
              </ExperienceCard>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        className="previous-experience-toggle secondary"
        type="button"
        aria-expanded={expanded}
        aria-controls="previous-experience-list"
        onClick={() => setExpanded((current) => !current)}
      >
        <span>{expanded ? "Hide Previous Experience" : "Previous Experience"}</span>
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
      </button>
    </div>
  );
}
