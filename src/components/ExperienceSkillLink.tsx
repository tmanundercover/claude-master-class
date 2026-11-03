import type { MouseEvent } from "react";
import SkillChip from "./SkillChip";
import { sitePath } from "@/lib/site-path";
import { skillTargetId } from "@/lib/skill-target";
import { scrollToSkill } from "@/lib/scroll-to-skill";

export default function ExperienceSkillLink({ skill }: { skill: string }) {
  const id = skillTargetId(skill);

  function navigate(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    // Interview-page links use normal navigation to reach the public portfolio first.
    if (!document.getElementById(id)) return;
    event.preventDefault();
    if (window.location.hash !== `#${id}`) window.history.pushState(null, "", `#${id}`);
    void scrollToSkill(id);
  }

  return <a className="experience-skill-link" href={sitePath(`/#${id}`)} onClick={navigate} aria-label={`${skill} in the skills section`}>
    <SkillChip skill={skill} variant="tile" />
  </a>;
}
