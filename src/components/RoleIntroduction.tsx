"use client";

import { motion, useReducedMotion } from "motion/react";

const introduction = "Recruiters get a fast, evidence-led view of my experience. Interviewers can explore the same stories in depth and bring follow-up questions. I use the Terrell Singleton role to manage my private career workspace. Choose the view that matches your conversation, then come inside.";

export default function RoleIntroduction({ hasVideo }: { hasVideo: boolean }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="role-introduction">
      {hasVideo ? (
        <video className="welcome-video-player" src="/interview/welcome.mp4" controls playsInline preload="metadata" aria-label="Welcome from Terrell Singleton" />
      ) : (
        <div className="welcome-video" aria-label="Welcome video placeholder">
          <div className="welcome-video-mark" aria-hidden="true">JTS</div>
          <div>
            <strong>Welcome address</strong>
            <span>Add /public/interview/welcome.mp4 to play your recorded introduction here.</span>
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
