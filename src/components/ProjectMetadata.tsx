import SkillChip from "./SkillChip";
import MetadataTags from './MetadataTags';
import { splitTechnologyMetadata } from '../lib/skill-icons';

export default function ProjectMetadata({ skills, tags }: { skills: string[]; tags: string[] }) {
  const metadata = splitTechnologyMetadata(skills, tags);
  return <>
    <div className="tags project-skills" role="group" aria-label="Project skills">
      {metadata.skills.map((skill) => <SkillChip skill={skill} variant="pill" key={skill} />)}
    </div>
    <MetadataTags tags={metadata.tags} />
  </>;
}
