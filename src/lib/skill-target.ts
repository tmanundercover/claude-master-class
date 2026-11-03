/** Stable fragment identifiers shared by experience links and section 02. */
export function skillTargetId(skill: string): string {
  return `skill-${skill.trim().toLowerCase().replace(/\+/g, "plus").replace(/#/g, "sharp").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}
