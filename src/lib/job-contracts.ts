// Shared wire contracts. Storage implementations and credentials stay server-only.
export const ARTIFACT_KINDS = ['job-fit', 'resume', 'cover-letter', 'interview-prep', 'study-plan'] as const;
export type ArtifactKind = typeof ARTIFACT_KINDS[number];
export type GenerationMode = 'initial' | 'revise' | 'start-over';
export const JOB_LIMITS = { description: 15000, descriptionBytes: 60000, objectBytes: 512 * 1024, notesBytes: 64 * 1024, pdfBytes: 10 * 1024 * 1024, changeMessage: 2000, page: 50, requestBytes: 128 * 1024 } as const;
export class JobError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(message: string, status = 400, code = 'invalid_request') { super(message); this.status = status; this.code = code; }
}
export interface ObjectManifest { path: string; hash: string; size: number; mime: string; generation: string }
export interface JobMetadata { company: string | null; title: string | null; location: string | null; requisition: string | null }
export interface Workspace extends JobMetadata { id: string; descriptionId: string; metadataVersion: number; extraction: 'pending' | 'ready' | 'failed'; createdAt: string; updatedAt: string; schemaVersion: 1 }
export interface Description { id: string; hash: string; content: ObjectManifest; createdAt: string }
export type PdfState = { state: 'not-requested' | 'pending' | 'failed'; error?: string; attempt?: string; startedAt?: string } | { state: 'ready'; content: ObjectManifest; sourceHash: string; rendererVersion: string };
export interface ArtifactVersion { id: string; descriptionId: string; createdAt: string; mode: GenerationMode; baseId: string | null; changeMessage: string | null; settings: GenerationSettings; provider: string; model: string; promptVersion: string; evidenceVersion: string; result: ObjectManifest; markdown: ObjectManifest; review: ObjectManifest; pdf: PdfState }
export interface ArtifactPair { state: number; current: ArtifactVersion | null; previous: ArtifactVersion | null }
export interface Notes { state: number; values: Record<string, string>; savedAt: string | null }
export interface GenerationSettings { tone: 'formal' | 'conversational' | 'technical'; weeklyHours: number }
export interface GenerationInput { attemptId: string; mode: GenerationMode; expectedState: number; descriptionId: string; changeMessage?: string; settings: GenerationSettings }
export interface AttemptReceipt { requestHash: string; state: 'running' | 'saved' | 'conflict' | 'failed' | 'interrupted'; workspaceId: string; kind: ArtifactKind; versionId: string; startedAt: string }
export interface SavedVersion { version: ArtifactVersion; result: unknown; markdown: string; review: unknown }
export const emptyPair = (): ArtifactPair => ({ state: 0, current: null, previous: null });
export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new JobError('Expected a JSON object.');
  return value as Record<string, unknown>;
}
export function fields(value: unknown, allowed: readonly string[]): Record<string, unknown> {
  const obj = record(value);
  if (Object.keys(obj).some(key => !allowed.includes(key))) throw new JobError('Unknown request field.');
  return obj;
}
export function validId(value: unknown): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{8,128}$/.test(value)) throw new JobError('Invalid identifier.');
  return value;
}
export function stateToken(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new JobError('Invalid state token.');
  return value;
}
export function artifactKind(value: unknown): ArtifactKind {
  if (!ARTIFACT_KINDS.includes(value as ArtifactKind)) throw new JobError('Unknown artifact kind.');
  return value as ArtifactKind;
}
export function boundedText(value: unknown, chars: number, bytes: number, blank = false): string {
  if (typeof value !== 'string' || (!blank && !value.trim()) || value.length > chars || new TextEncoder().encode(value).length > bytes) throw new JobError('Text is blank or exceeds the supported limit.');
  return value;
}
export function descriptionText(value: unknown): string { return boundedText(value, JOB_LIMITS.description, JOB_LIMITS.descriptionBytes).replace(/\r\n?/g, '\n').trim(); }
export function generationInput(value: unknown): GenerationInput {
  const obj = fields(value, ['attemptId', 'mode', 'expectedState', 'descriptionId', 'changeMessage', 'settings']);
  if (!['initial', 'revise', 'start-over'].includes(String(obj.mode))) throw new JobError('Choose Initial, Revise, or Start over.');
  const mode = obj.mode as GenerationMode;
  const settings = fields(obj.settings ?? {}, ['tone', 'weeklyHours']);
  const tone = settings.tone ?? 'formal'; const weeklyHours = settings.weeklyHours ?? 5;
  if (!['formal', 'conversational', 'technical'].includes(String(tone)) || typeof weeklyHours !== 'number' || !Number.isFinite(weeklyHours) || weeklyHours < 1 || weeklyHours > 40) throw new JobError('Invalid generation settings.');
  if (mode !== 'revise' && obj.changeMessage !== undefined) throw new JobError('A change message is only allowed for Revise.');
  return { attemptId: validId(obj.attemptId), mode, expectedState: stateToken(obj.expectedState), descriptionId: validId(obj.descriptionId), ...(mode === 'revise' ? { changeMessage: boundedText(obj.changeMessage, JOB_LIMITS.changeMessage, JOB_LIMITS.changeMessage * 4).trim() } : {}), settings: { tone: tone as GenerationSettings['tone'], weeklyHours } };
}
export function metadataInput(value: unknown): JobMetadata {
  const obj = fields(value, ['company', 'title', 'location', 'requisition']);
  return Object.fromEntries(['company', 'title', 'location', 'requisition'].map(key => [key, obj[key] === null || obj[key] === undefined ? null : boundedText(obj[key], 240, 960, true).trim() || null])) as unknown as JobMetadata;
}
export function noteValues(value: unknown): Record<string, string> {
  const obj = record(value);
  if (new TextEncoder().encode(JSON.stringify(obj)).length > JOB_LIMITS.notesBytes || Object.keys(obj).length > 100) throw new JobError('Notes exceed 64 KiB or 100 entries.');
  for (const [key, text] of Object.entries(obj)) { validId(key); boundedText(text, JOB_LIMITS.notesBytes, JOB_LIMITS.notesBytes, true); }
  return obj as Record<string, string>;
}
