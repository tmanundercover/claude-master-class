import { currentSessionPrincipal, type SessionPrincipal } from '../../lib/auth.ts';
import { boundedBody, composition, identifier } from '../mail/validation.ts';
import { mailbox } from '../mail/index.ts';
import { applicationLink, snapshotFiles, applicationPreview, applicationReturn, prepareApplication } from '../jobs/application.ts';
import profile from '../../../data/profile.json' with { type: 'json' };
import { MAIL_LIMITS } from '../../lib/mail-types.ts';
import { isSameOrigin } from '../../lib/origin.ts';
import { modelFailureResponse } from '../../lib/model-response.ts';
import { JobError, JOB_LIMITS, ARTIFACT_KINDS, validId, artifactKind, fields, stateToken, descriptionText, generationInput, metadataInput, noteValues, type ArtifactKind } from '../../lib/job-contracts.ts';
import { tools, validateToolInput, type ToolId } from '../../lib/tools.ts';
import { hash, configuredStores } from '../jobs/storage.ts';
import { JobRepository } from '../jobs/repository.ts';
import { extractMetadata, generateArtifact } from '../jobs/generation.ts';
import { generatePdf } from '../jobs/pdf.ts';
import { randomUUID } from 'node:crypto';
import { documentFilename } from '../../lib/document-filename.ts';
export function privateResponse(response: Response): Response {
  response.headers.set('Cache-Control', 'private, no-store'); response.headers.set('Vary', 'Cookie'); response.headers.set('X-Content-Type-Options', 'nosniff'); return response;
}
export async function jobRepository(request: Request) {
  let principal: SessionPrincipal | null;
  try { principal = await currentSessionPrincipal(request); } catch { throw new JobError('Authentication is unavailable.', 503); }
  if (!principal) throw new JobError('Sign in before opening saved jobs.', 401);
  if (principal.role !== 'terrell') throw new JobError('Saved jobs are available only to the owner.', 403);
  if (!['GET', 'HEAD'].includes(request.method) && !isSameOrigin(request)) throw new JobError('Cross-origin requests are not allowed.', 403);
  const stores = await configuredStores(); return new JobRepository(principal, stores.db, stores.objects);
}
export function jobFailure(error: unknown) {
  if (error instanceof JobError) return privateResponse(Response.json({ error: error.message, code: error.code }, { status: error.status }));
  return privateResponse(modelFailureResponse(error) ?? Response.json({ error: 'The saved workspace operation failed. Reload to reconcile before retrying.' }, { status: 503 }));
}
async function body(request: Request, limit = JOB_LIMITS.requestBytes) {
  if (!/^application\/json(?:;|$)/i.test(request.headers.get('content-type') ?? '')) throw new JobError('Send application/json.', 415);
  let text: string;
  try { text = await boundedBody(request, limit); } catch { throw new JobError('Request exceeds its encoded-size limit.', 413); }
  try { return JSON.parse(text) as unknown; } catch { throw new JobError('Request body is not valid JSON.'); }
}
function method(request: Request, expected: string) { if (request.method !== expected) throw new JobError('Method not allowed.', 405); }
export async function jobWorkspaceRoute(request: Request): Promise<Response> {
  try {
    const repo = await jobRepository(request); const url = new URL(request.url); const parts = url.pathname.replace(/\/+$/, '').split('/').slice(3);
    const json = (value: unknown, status = 200) => privateResponse(Response.json(value, { status }));
    if (!parts.length) {
      if (request.method === 'GET') return json(await repo.list(url.searchParams.has('limit') ? Number(url.searchParams.get('limit')) : 20, url.searchParams.get('after') ?? undefined));
      method(request, 'POST'); const input = fields(await body(request), ['jobDescription', 'attemptId']);
      const saved = await repo.create(descriptionText(input.jobDescription), validId(input.attemptId));
      if (saved.created) await extractMetadata(repo, saved.workspace.id);
      return json({ workspace: await repo.workspace(saved.workspace.id), created: saved.created }, saved.created ? 201 : 200);
    }
    if (parts[0] === 'application-returns' && parts.length === 2) { method(request, 'GET'); return json(await applicationReturn(repo, validId(parts[1]))); }
    if (parts[0] === 'application-drafts' && parts.length === 2) { method(request, 'GET'); const link = await applicationLink(repo, identifier(parts[1])); return json({ link, ...(link ? { attachments: await snapshotFiles(repo, link) } : {}) }); }
    const id = validId(parts[0]); await repo.workspace(id);
    if (parts.length === 1) {
      if (request.method === 'GET') { await repo.cleanup(id); return json({ workspace: await repo.workspace(id), description: await repo.description(id), artifacts: Object.fromEntries(await Promise.all(ARTIFACT_KINDS.map(async kind => [kind, await repo.pair(id, kind)]))) }); }
      method(request, 'PATCH'); const input = fields(await body(request, 8192), ['expectedState', 'metadata']);
      return json(await repo.updateMetadata(id, stateToken(input.expectedState), metadataInput(input.metadata)));
    }
    if (parts[1] === 'application-draft' && parts.length === 2) {
      if (request.method === 'GET') return json(await applicationPreview(repo, id, profile));
      method(request, 'POST');
      const input = fields(await body(request, MAIL_LIMITS.request), ['attemptId', 'draftId', 'content', 'action', 'standardResume', 'omitResume', 'omitCoverLetter']);
      if (!['apply', 'refresh', 'handoff'].includes(String(input.action))) throw new JobError('Choose Apply, Refresh documents, or Create tailored résumé.');
      for (const key of ['standardResume', 'omitResume', 'omitCoverLetter']) if (input[key] !== undefined && typeof input[key] !== 'boolean') throw new JobError('Document choices must be booleans.');
      return json(await prepareApplication(repo, id, { attemptId: validId(input.attemptId), draftId: identifier(input.draftId), content: composition(input.content), action: input.action as 'apply' | 'refresh' | 'handoff', standardResume: input.standardResume === true, omitResume: input.omitResume === true, omitCoverLetter: input.omitCoverLetter === true }, mailbox(), profile));
    }
    if (parts[1] === 'descriptions') {
      if (parts.length === 3) { method(request, 'GET'); return json(await repo.description(id, validId(parts[2]))); }
      if (parts.length !== 2) throw new JobError('Route not found.', 404);
      method(request, 'POST'); const input = fields(await body(request), ['expectedDescriptionId', 'jobDescription']);
      const workspace = await repo.updateDescription(id, validId(input.expectedDescriptionId), descriptionText(input.jobDescription));
      await extractMetadata(repo, id); return json({ workspace: await repo.workspace(workspace.id), description: await repo.description(id) });
    }
    if (parts[1] === 'notes' && parts.length === 2) {
      if (request.method === 'GET') return json(await repo.notes(id));
      method(request, 'PUT'); const input = fields(await body(request, JOB_LIMITS.notesBytes + 4096), ['expectedState', 'values']);
      return json(await repo.saveNotes(id, stateToken(input.expectedState), noteValues(input.values)));
    }
    if (parts[1] !== 'artifacts') throw new JobError('Route not found.', 404);
    const kind = artifactKind(parts[2]);
    if (parts.length === 3) { method(request, 'GET'); return json(await repo.pair(id, kind)); }
    if (parts.length === 4 && parts[3] === 'generate') { method(request, 'POST'); return json(await generateArtifact(repo, id, kind, generationInput(await body(request, 16384)))); }
    if (parts.length === 4 && parts[3] === 'undo') { method(request, 'POST'); const input = fields(await body(request, 2048), ['expectedState']); return json(await repo.undo(id, kind, stateToken(input.expectedState))); }
    if (parts[3] === 'versions' && parts.length >= 6) {
      const versionId = validId(parts[4]);
      if (parts[5] === 'pdf' && parts.length === 6) { method(request, 'POST'); fields(await body(request, 2048), []); return json(await generatePdf(repo, id, kind, versionId)); }
      if (parts[5] === 'files' && parts.length === 7) {
        method(request, 'GET'); const version = await repo.retained(id, kind, versionId); const format = parts[6];
        if (format !== 'pdf' && format !== 'markdown') throw new JobError('Unknown document format.');
        if (format === 'pdf' && (version.pdf.state !== 'ready' || version.pdf.sourceHash !== version.result.hash)) throw new JobError('The matching PDF is not ready. Retry PDF generation.', 409, 'pdf_unavailable');
        const manifest = format === 'pdf' && version.pdf.state === 'ready' ? version.pdf.content : version.markdown;
        const bytes = await repo.objects.read(manifest, format === 'pdf' ? JOB_LIMITS.pdfBytes : JOB_LIMITS.objectBytes);
        const filename = documentFilename(profile.name, await repo.workspace(id), kind, format === 'pdf' ? 'pdf' : 'md', version.createdAt);
        return privateResponse(new Response(Buffer.from(bytes), { headers: { 'Content-Type': format === 'pdf' ? 'application/pdf' : 'text/markdown; charset=utf-8', 'Content-Length': String(bytes.length), 'Content-Disposition': `attachment; filename="${filename}"` } }));
      }
    }
    if (parts.length === 5 && parts[3] === 'versions') { method(request, 'GET'); const saved = await repo.readVersion(id, kind, validId(parts[4])); return json({ ...saved, result: { ...(saved.result as object), ...(saved.review as object) } }); }
    throw new JobError('Route not found.', 404);
  } catch (error) { return jobFailure(error); }
}
export function kindForTool(id: ToolId, mode: string): ArtifactKind { return id === 'fit-analyzer' ? 'job-fit' : id === 'resume-tailor' ? 'resume' : id === 'cover-letter' ? 'cover-letter' : mode === 'study' ? 'study-plan' : 'interview-prep'; }
export async function legacyGeneration(request: Request, id: ToolId): Promise<Response> {
  try {
    const repo = await jobRepository(request); const raw = fields(await body(request), ['jobDescription', 'tone', 'mode', 'weeklyHours']); const input = validateToolInput(raw);
    if (!input.ok) throw new JobError(input.error);
    const attemptId = request.headers.get('X-Generation-Attempt') ?? randomUUID(); validId(attemptId);
    const { workspace, created } = await repo.create(input.value.jobDescription, attemptId);
    const kind = kindForTool(id, input.value.mode); const pair = await repo.pair(workspace.id, kind);
    const identity = hash(JSON.stringify({ tool: id, input: input.value }));
    const planned = await repo.db.transaction(async tx => {
      const path = `${repo.root}/legacyAttempts/${attemptId}`;
      const prior = await tx.get<{ input: unknown; hash: string }>(path);
      if (prior) { if (prior.hash !== identity) throw new JobError('Attempt ID was already used with different tool input.', 409); return generationInput(prior.input); }
      const value = generationInput({ attemptId, mode: pair.current ? 'start-over' : 'initial', expectedState: pair.state, descriptionId: workspace.descriptionId, settings: { tone: input.value.tone, weeklyHours: input.value.weeklyHours } });
      tx.set(path, { input: value, hash: identity }); return value;
    });
    const [generated] = await Promise.allSettled([
      generateArtifact(repo, workspace.id, kind, planned),
      created ? extractMetadata(repo, workspace.id) : Promise.resolve(),
    ]);
    if (generated.status === 'rejected') throw generated.reason;
    const saved = generated.value;
    return privateResponse(Response.json(saved.result, { headers: { 'X-Workspace-Id': workspace.id, 'X-Artifact-Version': saved.version.id } }));
  } catch (error) { return jobFailure(error); }
}
// Keep the list anchored to registered tools; every successful legacy route persists.
export const savedToolIds = tools.map(tool => tool.id);
