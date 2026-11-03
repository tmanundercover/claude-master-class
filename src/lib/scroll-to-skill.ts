let latestRequest = 0;

export async function scrollToSkill(id: string): Promise<void> {
  const request = ++latestRequest;
  const target = document.getElementById(id);
  if (!target) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  try {
    // Load the browser-only scroll engine when needed, keeping it out of Functions rendering.
    const { scroller } = await import("react-scroll");
    if (request !== latestRequest || !target.isConnected) return;
    target.focus({ preventScroll: true });
    scroller.scrollTo(id, { smooth: reducedMotion ? false : "easeInOutCubic", duration: 500, offset: -24 });
  } catch {
    if (request !== latestRequest || !target.isConnected) return;
    target.focus({ preventScroll: true });
    target.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth", block: "start" });
  }
}
