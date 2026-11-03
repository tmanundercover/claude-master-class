import type { ReactNode } from "react";
import SkillIcon from "./SkillIcon";

export default function SkillChip({ skill, variant = "chip", children, id, tabIndex }: { skill: string; variant?: "chip" | "tile" | "pill"; children?: ReactNode; id?: string; tabIndex?: number }) {
  return (
    <span className={`skill-chip${variant !== "chip" ? ` skill-chip--${variant}` : ""}`} id={id} tabIndex={tabIndex}>
      <SkillIcon skill={skill} />
      <span className="skill-chip-copy">
        <span className="skill-chip-name">{skill}</span>
        {children}
      </span>
    </span>
  );
}
