import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

export default function ExpandableExperience({
  ariaLabel,
  bullets,
  children,
  className,
}: {
  ariaLabel: string;
  bullets: string[];
  children: ReactNode;
  className: string;
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const reduceMotion = useReducedMotion();
  const expanded = hovered || focused;

  return (
    <article
      className={`${className} interactive-experience`}
      tabIndex={0}
      aria-label={ariaLabel}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {children}
      <span className="experience-hint">More...</span>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.ul
            className="experience-bullets"
            initial={reduceMotion ? false : { height: 0, opacity: 0, y: -8 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0, y: -8 }}
            transition={{ duration: reduceMotion ? 0 : 0.24, ease: "easeOut" }}
          >
            {bullets.map((bullet, index) => (
              <motion.li
                key={bullet}
                initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.18, delay: reduceMotion ? 0 : index * 0.045 }}
              >
                {bullet}
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </article>
  );
}
