import type { FitCategory, FitCategoryBreakdown, FitRequirement } from './fit-types.ts';

export const FIT_CATEGORIES: readonly { category: FitCategory; label: string; weight: number }[] = [
  { category: 'required_technical', label: 'Required technical qualifications', weight: 70 },
  { category: 'responsibilities_seniority', label: 'Relevant responsibilities and seniority', weight: 20 },
  { category: 'preferred', label: 'Preferred qualifications', weight: 10 },
];
export const EVIDENCE_CREDIT = { supported: 1, partially_supported: 0.5, unsupported_evidence: 0 } as const;
const round = (value: number, places = 2) => Number(value.toFixed(places));

/** The model supplies classifications; only this function supplies numerical scores. */
export function scoreFitRequirements(requirements: readonly Pick<FitRequirement, 'category' | 'status'>[]): { score: number | null; breakdown: FitCategoryBreakdown[] } {
  const activeWeight = FIT_CATEGORIES.reduce((sum, group) => sum + (requirements.some(item => item.category === group.category) ? group.weight : 0), 0);
  let weightedCredit = 0;
  const breakdown = FIT_CATEGORIES.map(group => {
    const items = requirements.filter(item => item.category === group.category);
    const earned = items.reduce((sum, item) => sum + EVIDENCE_CREDIT[item.status], 0);
    const ratio = items.length ? earned / items.length : 0;
    weightedCredit += ratio * group.weight;
    return {
      ...group,
      effectiveWeight: items.length && activeWeight ? round(group.weight / activeWeight * 100) : 0,
      total: items.length,
      supported: items.filter(item => item.status === 'supported').length,
      partial: items.filter(item => item.status === 'partially_supported').length,
      unsupported: items.filter(item => item.status === 'unsupported_evidence').length,
      earned,
      score: items.length ? round(ratio * 100) : null,
      contribution: activeWeight ? round(ratio * group.weight / activeWeight * 100) : 0,
    };
  });
  return { score: activeWeight ? Math.round(weightedCredit / activeWeight * 100) : null, breakdown };
}
