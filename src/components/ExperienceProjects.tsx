import type { MouseEvent } from 'react';
import { sitePath } from '../lib/site-path';
import { projectTargetId, scrollToProject, type RelatedProject } from '../lib/project-navigation';

export default function ExperienceProjects({ projects }: { projects: RelatedProject[] }) {
  if (!projects.length) return null;
  function navigate(event: MouseEvent<HTMLAnchorElement>, id: string) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !document.getElementById(id)) return;
    event.preventDefault();
    if (window.location.hash !== `#${id}`) window.history.pushState(null, '', `#${id}`);
    void scrollToProject(id);
  }
  return <div className="experience-projects" aria-label="Related projects">
    <span className="muted">Related projects</span>
    {projects.map(project => {
      const id = projectTargetId(project.id);
      return <a key={id} href={sitePath(`/#${id}`)} onClick={event => navigate(event, id)}>{project.title} <span aria-hidden="true">↓</span></a>;
    })}
  </div>;
}
