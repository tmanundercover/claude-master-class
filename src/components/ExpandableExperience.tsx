import { useId, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import SkillChip from "./SkillChip";

export default function ExpandableExperience({
  ariaLabel,
  bullets,
  children,
  className,
  skills = [],
}: {
  ariaLabel: string;
  bullets: string[];
  children: ReactNode;
  className: string;
  skills?: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  const bulletsId = useId();
  const reduceMotion = useReducedMotion();

  return (
    <article
      className={`${className} interactive-experience`}
      aria-label={ariaLabel}
    >
      {children}
      {skills.length > 0 && (
        <div className="experience-skills" role="group" aria-label="Skills used in this position">
          {skills.map((skill) => <SkillChip skill={skill} compact key={skill} />)}
        </div>
      )}
      <button
        className="experience-toggle secondary"
        type="button"
        aria-expanded={expanded}
        aria-controls={bulletsId}
        aria-label={`${expanded ? "Show less" : "More"}: ${ariaLabel}`}
        onClick={() => setExpanded((current) => !current)}
      >
        {expanded ? "Show less" : "More"}
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.ul
            id={bulletsId}
            className="experience-bullets"
            initial={reduceMotion ? false : { height: 0, opacity: 0, y: -8 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0, y: -8 }}
            transition={{ duration: reduceMotion ? 0 : 0.24, ease: "easeOut" }}
          >
            {bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
          </motion.ul>
        )}
      </AnimatePresence>
    </article>
  );
}
