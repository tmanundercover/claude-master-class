import { motion, useReducedMotion } from "motion/react";

const introduction = "Get to know how I work through my answers to common interview questions. Explore my experience, watch recorded responses as they become available, and ask any follow-up questions you have.";

export default function RoleIntroduction({ hasVideo }: { hasVideo: boolean }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="role-introduction">
      {hasVideo ? (
        <video className="welcome-video-player" src="/interview/welcome.mp4" controls playsInline preload="metadata" aria-label="Welcome from Terrell Singleton" />
      ) : (
        <div className="welcome-video" aria-label="Welcome video coming soon">
          <div className="welcome-video-mark" aria-hidden="true">JTS</div>
          <div>
            <strong>A welcome from Terrell</strong>
            <span>Welcome video coming soon.</span>
          </div>
        </div>
      )}
      <motion.p
        className="typed-script"
        aria-label={introduction}
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.016 } } }}
      >
        {introduction.split("").map((character, index) => (
          <motion.span
            aria-hidden="true"
            key={`${character}-${index}`}
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
          >
            {character}
          </motion.span>
        ))}
        <span className="type-cursor" aria-hidden="true" />
      </motion.p>
    </div>
  );
}
