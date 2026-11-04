type ExperienceTotals = Readonly<Record<string, { documentedRoleYears: number } | undefined>>;

/** Rank by documented experience, with alphabetical ties and unrecorded totals last. */
export function sortSkillsByExperience(skills: readonly string[], evidence: ExperienceTotals): string[] {
  return [...skills].sort((a, b) =>
    (evidence[b]?.documentedRoleYears ?? 0) - (evidence[a]?.documentedRoleYears ?? 0)
    || a.localeCompare(b, 'en'),
  );
}
