import SkillChip from "./SkillChip";

export default function ProjectMetadata({ skills, tags }: { skills: string[]; tags: string[] }) {
  return <>
    <div className="tags project-skills" role="group" aria-label="Project skills">
      {skills.map((skill) => <SkillChip skill={skill} variant="pill" key={skill} />)}
    </div>
    {tags.length > 0 && <p className="project-tags">
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h7l11 11-7 7L3 10Z" /><circle cx="7.5" cy="7.5" r="1" />
      </svg>
      <span className="sr-only">Tags: </span><span>{tags.map((tag, index) => <span key={tag}>
        {index > 0 && ", "}<span className="project-tag">{tag}</span>
      </span>)}</span>
    </p>}
  </>;
}
