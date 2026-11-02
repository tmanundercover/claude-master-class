import type { ReactNode } from "react";
import SkillIcon from "./SkillIcon";

export default function SkillChip({ skill, compact = false, children }: { skill: string; compact?: boolean; children?: ReactNode }) {
  return (
    <span className={`skill-chip${compact ? " skill-chip--compact" : ""}`}>
      <SkillIcon skill={skill} />
      <span className="skill-chip-copy">
        <span className="skill-chip-name">{skill}</span>
        {children}
      </span>
    </span>
  );
}
