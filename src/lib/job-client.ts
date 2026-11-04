import { isSavedArtifactResult } from './job-result';
import { generationInput, type GenerationInput } from './job-contracts';
import type { ArtifactKind, ArtifactPair, Description, SavedVersion, Workspace } from './job-contracts';
export async function jobRequest<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(`/api/job-workspaces${path}`, { method, headers: body === undefined ? {} : { 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const data = await response.json();
  if (!response.ok) { const message = data.error ?? `Request failed (${response.status}).`; const retry = response.headers.get('retry-after'); throw new Error(response.status === 429 && retry ? `${message} Try again in ${retry} seconds.` : message); }
  return data as T;
}
export interface JobDashboardData { workspace: Workspace; description: Description & { text: string }; artifacts: Record<ArtifactKind, ArtifactPair> }
export const jobLabel = (job: Workspace) => `${job.company ?? 'Unknown company'} / ${job.title ?? 'Unknown role'}`;
export const artifactLabel: Record<ArtifactKind, string> = { 'job-fit': 'Job Fit', resume: 'Tailored résumé', 'cover-letter': 'Cover Letter', 'interview-prep': 'Interview Prep', 'study-plan': 'Study Plan' };
export async function savedPair(id: string, kind: ArtifactKind) {
  const base = `/${id}/artifacts/${kind}`; const pair = await jobRequest<ArtifactPair>(base);
  const [current, previous] = await Promise.all([pair.current ? jobRequest<SavedVersion>(`${base}/versions/${pair.current.id}`) : null, pair.previous ? jobRequest<SavedVersion>(`${base}/versions/${pair.previous.id}`) : null]);
  for (const saved of [current, previous]) if (saved && !isSavedArtifactResult(kind, saved.result, saved.version.settings.weeklyHours)) throw new Error(`The server returned an invalid ${kind === 'job-fit' ? 'job-fit' : kind} result. No saved content was displayed.`);
  return { pair, current, previous };
}

// Only request intent is kept per tab; saved content, notes and email bodies remain server-backed.
export function generationIntent(id: string, kind: ArtifactKind): GenerationInput | null {
  try { const raw = sessionStorage.getItem(`job-attempt:${id}:${kind}`); return raw ? generationInput(JSON.parse(raw)) : null; } catch { return null; }
}
export function rememberGenerationIntent(id: string, kind: ArtifactKind, input: GenerationInput) {
  try { sessionStorage.setItem(`job-attempt:${id}:${kind}`, JSON.stringify(input)); } catch { /* In-memory reconciliation remains available if browser storage is disabled. */ }
}
export function clearGenerationIntent(id: string, kind: ArtifactKind, attemptId?: string) {
  try { if (!attemptId || generationIntent(id, kind)?.attemptId === attemptId) sessionStorage.removeItem(`job-attempt:${id}:${kind}`); } catch { /* Storage may be disabled. */ }
}
