export function formatDocumentedYears(years: number): string | null {
  if (years <= 0) return null;
  if (years < 1) return "<1 yr in dated roles";
  const label = Number.isInteger(years) ? String(years) : years.toFixed(1);
  return `${label} yrs in dated roles`;
}

