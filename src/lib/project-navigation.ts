export interface RelatedProject { id: string; title: string }

export function projectTargetId(id: string): string { return `project-${id}`; }

export function relatedProjects(ids: readonly string[] | undefined, projects: readonly RelatedProject[]): RelatedProject[] {
  return (ids ?? []).flatMap(id => {
    const project = projects.find(project => project.id === id);
    return project ? [project] : [];
  });
}

let latestRequest = 0;
let arrivalTimer: ReturnType<typeof setTimeout>;
let clearTimer: ReturnType<typeof setTimeout>;
let highlighted: HTMLElement | null = null;

export async function scrollToProject(id: string): Promise<void> {
  const request = ++latestRequest;
  clearTimeout(arrivalTimer);
  clearTimeout(clearTimer);
  highlighted?.classList.remove('project-arrival');
  highlighted = null;
  const target = document.getElementById(id);
  if (!target) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  try {
    const { scroller } = await import('react-scroll');
    if (request !== latestRequest || !target.isConnected) return;
    target.focus({ preventScroll: true });
    scroller.scrollTo(id, { smooth: reducedMotion ? false : 'easeInOutCubic', duration: 500, offset: -32 });
  } catch {
    if (request !== latestRequest || !target.isConnected) return;
    target.focus({ preventScroll: true });
    target.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' });
  }
  arrivalTimer = setTimeout(() => {
    if (request !== latestRequest || !target.isConnected) return;
    target.focus({ preventScroll: true });
    target.classList.add('project-arrival');
    highlighted = target;
    clearTimer = setTimeout(() => {
      target.classList.remove('project-arrival');
      if (highlighted === target) highlighted = null;
    }, 2200);
  }, reducedMotion ? 0 : 500);
}
