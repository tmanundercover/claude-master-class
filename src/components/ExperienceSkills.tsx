import { useEffect, useRef, useState, type CSSProperties } from "react";
import ExperienceSkillLink from "./ExperienceSkillLink";

export default function ExperienceSkills({ skills }: { skills: string[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(Math.ceil(skills.length / 2));
  const [overflows, setOverflows] = useState(false);
  const [moreToRight, setMoreToRight] = useState(false);

  useEffect(() => {
    const scroller = scrollRef.current;
    const tile = scroller?.querySelector<HTMLElement>(".skill-chip--tile");
    if (!scroller || !tile) return;

    function measure() {
      const gap = parseFloat(getComputedStyle(scroller!).columnGap) || 0;
      const tileWidth = tile!.getBoundingClientRect().width;
      const capacity = Math.max(1, Math.floor((scroller!.clientWidth + gap) / (tileWidth + gap)));
      setColumns(Math.max(Math.ceil(skills.length / 2), Math.min(skills.length, capacity)));
    }

    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    observer.observe(tile);
    return () => observer.disconnect();
  }, [skills.length]);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    function updateScrollCue() {
      setOverflows(scroller!.scrollWidth > scroller!.clientWidth + 1);
      setMoreToRight(scroller!.scrollLeft + scroller!.clientWidth < scroller!.scrollWidth - 1);
    }
    const observer = new ResizeObserver(updateScrollCue);
    observer.observe(scroller);
    scroller.addEventListener("scroll", updateScrollCue, { passive: true });
    return () => {
      observer.disconnect();
      scroller.removeEventListener("scroll", updateScrollCue);
    };
  }, [columns]);

  return <div className="experience-skills">
    {/* Keyboard focus lets visitors scroll overflowing tiles with the arrow keys. */}
    {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
    <div className="experience-skills-scroll" ref={scrollRef} role="region" aria-label="Skills used in this position" tabIndex={overflows ? 0 : undefined} style={{ "--skill-columns": columns } as CSSProperties}>
      {skills.map((skill) => <ExperienceSkillLink skill={skill} key={skill} />)}
    </div>
    {moreToRight && <span className="experience-skills-fade" aria-hidden="true" />}
  </div>;
}
