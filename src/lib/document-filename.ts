import type { JobMetadata } from './job-contracts.ts';

/** User-facing names contain descriptive labels, never workspace/version identifiers. */
export function documentFilename(candidate: string, job: Pick<JobMetadata, 'title' | 'company'> | null, kind: string, extension: 'pdf' | 'md' | 'html', savedAt: string | Date = new Date()): string {
  const slug = (value: string, limit: number) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, limit).replace(/-+$/g, '');
  const date = new Date(savedAt);
  const year = Number.isFinite(date.getTime()) ? date.getUTCFullYear() : new Date().getUTCFullYear();
  return [slug(candidate, 60), slug(job?.title ?? '', 60), slug(job?.company ?? '', 45), slug(kind, 20), String(year)].filter(Boolean).join('-') + '.' + extension;
}
