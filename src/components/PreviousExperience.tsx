import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import ExpandableExperience from "@/components/ExpandableExperience";

interface ExperienceRole {
  title: string;
  organization: string;
  period: string;
  summary: string;
  bullets: string[];
  skills: string[];
}

export default function PreviousExperience({ roles }: { roles: ExperienceRole[] }) {
  const [expanded, setExpanded] = useState(false);
  const reduceMotion = useReducedMotion();

  if (roles.length === 0) return null;

  return (
    <div className="previous-experience">
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
              <ExpandableExperience
                className="panel experience homepage-experience"
                key={`${role.title}-${role.organization}`}
                ariaLabel={`${role.title} at ${role.organization} experience details`}
                bullets={role.bullets}
                skills={role.skills}
              >
                <p className="muted">{role.period}</p>
                <div><h3>{role.title}</h3><p className="accent">{role.organization}</p><p>{role.summary}</p></div>
              </ExpandableExperience>
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
