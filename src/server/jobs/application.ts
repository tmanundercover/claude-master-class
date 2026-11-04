import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { JobRepository } from './repository.ts';
import { hash } from './storage.ts';
import { JOB_LIMITS, JobError, validId, type ObjectManifest, type ArtifactKind, type JobMetadata } from '../../lib/job-contracts.ts';
import { applicationMailTemplate } from '../../lib/application-template.ts';
import { composition, identifier, attemptId } from '../mail/validation.ts';
import type { Mailbox, Composition, AttachmentInput, Draft } from '../../lib/mail-types.ts';
import { documentFilename } from '../../lib/document-filename.ts';
export interface ApplicationSnapshot { filename: string; contentType: string; hash: string; size: number; object: ObjectManifest; managed: boolean; kind?: ArtifactKind | 'standard'; versionId?: string; nativeId?: string }
export interface ApplicationLink { workspaceId: string; draftId: string; returnRef: string; snapshots: ApplicationSnapshot[]; updatedAt: string }
interface Preparation { requestHash: string; state: 'preparing' | 'ready' | 'uncertain'; draftId: string; workspaceId: string; snapshots: ApplicationSnapshot[]; content: ObjectManifest; returnRef: string; beforeHash: string; templateApplied: boolean }
const linkPath = (repo: JobRepository, draftId: string) => `${repo.root}/applicationDrafts/${identifier(draftId)}`;
export async function applicationLink(repo: JobRepository, draftId: string) { return repo.db.get<ApplicationLink>(linkPath(repo, draftId)); }
export async function applicationReturn(repo: JobRepository, reference: string) { const record = await repo.db.get<{ draftId: string; workspaceId: string }>(`${repo.root}/applicationReturns/${validId(reference)}`); if (!record) throw new JobError('Application return reference not found.', 404); await repo.workspace(record.workspaceId); return record; }
export async function standardResumeBytes() { const bytes = await readFile(join(process.cwd(), 'dist/standard-resume.pdf')); if (!bytes.subarray(0, 5).equals(Buffer.from('%PDF-')) || bytes.length > JOB_LIMITS.pdfBytes) throw new JobError('The packaged standard résumé is unavailable.', 503); return bytes; }
export async function applicationPreview(repo: JobRepository, id: string, candidate: { name: string }) {
  const workspace = await repo.workspace(id); const resume = (await repo.pair(id, 'resume')).current; const cover = (await repo.pair(id, 'cover-letter')).current;
  return { workspace, resume: resume ? { versionId: resume.id, pdf: resume.pdf.state } : null, coverLetter: cover ? { versionId: cover.id, pdf: cover.pdf.state } : null, template: applicationMailTemplate(candidate, workspace, { resume: resume?.pdf.state === 'ready' ? 'tailored' : null, coverLetter: cover?.pdf.state === 'ready' }) };
}
function draftContent(draft: Draft): Composition { return { to: draft.to ?? [], cc: draft.cc, bcc: draft.bcc, subject: draft.subject ?? '', text: draft.text ?? '', html: draft.html ?? '', ...(draft.thread_id ? { threadId: draft.thread_id, replyToEmailId: draft.reply_to_email_id! } : {}) }; }
function matchesDraft(draft: Draft, content: Composition, snapshots: ApplicationSnapshot[]) { return JSON.stringify(draftContent(draft)) === JSON.stringify({ ...content, attachments: undefined }) && draft.attachments.length === snapshots.length && snapshots.every((file, index) => draft.attachments[index].filename === file.filename && draft.attachments[index].size === file.size && draft.attachments[index].content_type === file.contentType); }
export async function snapshotFiles(repo: JobRepository, link: ApplicationLink): Promise<AttachmentInput[]> { return Promise.all(link.snapshots.map(async file => ({ filename: file.filename, contentType: file.contentType, content: Buffer.from(await repo.objects.read(file.object, JOB_LIMITS.pdfBytes)).toString('base64') }))); }
export async function prepareApplication(repo: JobRepository, id: string, value: { attemptId: string; draftId: string; content: Composition; action: 'apply' | 'refresh' | 'handoff'; standardResume: boolean; omitResume: boolean; omitCoverLetter: boolean }, mail: Mailbox, candidate: { name: string }, standard = standardResumeBytes) {
  const workspace = await repo.workspace(id); const attempt = attemptId(value.attemptId); const draftId = identifier(value.draftId); const inputContent = composition(value.content);
  const requestHash = hash(JSON.stringify({ id, ...value, content: inputContent })); const prepPath = `${repo.root}/applicationPreparations/${attempt}`;
  let preparation = await repo.db.get<Preparation>(prepPath);
  const original = await mail.draft(draftId); if (original.email_id) throw new JobError('This draft has already been sent.', 409);
  const prior = await applicationLink(repo, draftId);
  if (prior && prior.workspaceId !== id && value.action !== 'apply') throw new JobError('Draft belongs to another job. Explicitly apply its template before refreshing.', 409);
  if (preparation && preparation.requestHash !== requestHash) throw new JobError('Preparation attempt belongs to different content.', 409);
  if (preparation?.state === 'ready') { const link = await applicationLink(repo, draftId); if (!link) throw new JobError('Draft linkage needs reconciliation.', 503); return { link, draft: original, content: { ...draftContent(original), attachments: await snapshotFiles(repo, link) } }; }
  if (!preparation) {
    const snapshots: ApplicationSnapshot[] = [];
    // Keep manual files. Provider copies survive workspace cleanup; independent private snapshots allow refresh after reload.
    let manual: AttachmentInput[];
    if (inputContent.attachments !== undefined) {
      manual = inputContent.attachments.filter(file => value.action === 'handoff' || !prior?.snapshots.some(old => old.managed && old.filename === file.filename && old.hash === hash(Buffer.from(file.content, 'base64'))));
    } else if (original.attachments.length) {
      if (!prior || original.attachments.some(file => !prior.snapshots.some(old => old.nativeId === file.id && old.filename === file.filename && old.size === file.size))) throw new JobError('Existing attachment bytes are unavailable for safe refresh. Keep this draft and reattach those files before applying the job template.', 409, 'attachment_recovery_needed');
      const files = await snapshotFiles(repo, prior); manual = files.filter((_, index) => value.action === 'handoff' || !prior.snapshots[index].managed);
    } else manual = [];
    const documentFiles: { file: AttachmentInput; kind: ArtifactKind | 'standard'; versionId?: string }[] = [];
    let resumeType: 'standard' | 'tailored' | null = null; let coverAttached = false;
    const selected: { kind: ArtifactKind; id: string; hash: string }[] = [];
    if (value.action !== 'handoff') {
      const resume = (await repo.pair(id, 'resume')).current; const cover = (await repo.pair(id, 'cover-letter')).current;
      if (!resume && !value.standardResume && !value.omitResume) throw new JobError('No tailored résumé exists. Choose Use standard résumé or Create tailored résumé.', 409, 'resume_choice_needed');
      if (value.standardResume) { const bytes = await standard(); documentFiles.push({ kind: 'standard', file: { filename: documentFilename(candidate.name, workspace, 'resume', 'pdf'), contentType: 'application/pdf', content: bytes.toString('base64') } }); resumeType = 'standard'; }
      else if (resume && !value.omitResume) { await addDocument('resume', resume.id); resumeType = 'tailored'; }
      if (cover && !value.omitCoverLetter) { await addDocument('cover-letter', cover.id); coverAttached = true; }
    }
    async function addDocument(kind: ArtifactKind, versionId: string) {
      const version = await repo.retained(id, kind, versionId);
      if (version.pdf.state !== 'ready' || version.pdf.sourceHash !== version.result.hash) throw new JobError(`${kind === 'resume' ? 'Résumé' : 'Cover letter'} PDF is ${version.pdf.state}. Retry PDF generation or explicitly proceed without it.`, 409, 'pdf_unavailable');
      const bytes = await repo.objects.read(version.pdf.content, JOB_LIMITS.pdfBytes);
      selected.push({ kind, id: versionId, hash: version.result.hash });
      documentFiles.push({ kind, versionId, file: { filename: documentFilename(candidate.name, workspace, kind, 'pdf', version.createdAt), contentType: 'application/pdf', content: Buffer.from(bytes).toString('base64') } });
    }
    const currentWorkspace = await repo.workspace(id);
    const template = applicationMailTemplate(candidate, currentWorkspace as JobMetadata, { resume: resumeType, coverLetter: coverAttached });
    const body = { ...inputContent, ...(value.action === 'apply' || (value.action === 'handoff' && !inputContent.subject && !inputContent.text && !inputContent.html) ? { subject: template.subject, text: template.text, html: template.html } : {}), attachments: [...manual, ...documentFiles.map(doc => doc.file)] };
    composition(body); // Validate combined count/decoded bytes before any native mutation.
    const token = randomUUID();
    for (const [index, file] of body.attachments.entries()) {
      const bytes = Buffer.from(file.content, 'base64'); const document = documentFiles.find(doc => doc.file === file) ?? (value.action === 'handoff' ? prior?.snapshots.find(old => old.managed && old.filename === file.filename && old.hash === hash(bytes)) : undefined);
      const object = await repo.writeObject(id, `mail-snapshots/${token}/${index}`, bytes, file.contentType, JOB_LIMITS.pdfBytes);
      snapshots.push({ filename: file.filename, contentType: file.contentType, hash: hash(bytes), size: bytes.length, object, managed: !!document, ...(document ? { kind: document.kind, ...(document.versionId ? { versionId: document.versionId } : {}) } : {}) });
    }
    const textContent = { ...body, attachments: undefined };
    const content = await repo.writeObject(id, `mail-snapshots/${token}/composition.json`, JSON.stringify(textContent), 'application/json');
    preparation = { requestHash, state: 'preparing', workspaceId: id, draftId, snapshots, content, returnRef: prior?.returnRef ?? randomUUID(), beforeHash: hash(JSON.stringify(original)), templateApplied: value.action === 'apply' };
    const intended = preparation;
    preparation = await repo.db.transaction(async tx => {
      const existing = await tx.get<Preparation>(prepPath);
      for (const source of selected) { const pair = await repo.pair(id, source.kind, tx); if (![pair.current, pair.previous].some(version => version?.id === source.id && version.result.hash === source.hash)) throw new JobError('A source document retired during preparation. Nothing was substituted.', 409, 'stale_source'); }
      if (existing && existing.requestHash !== requestHash) throw new JobError('Conflicting preparation attempt.', 409);
      if (!existing) tx.set(prepPath, intended); return existing ?? intended;
    });
  }
  const content = JSON.parse(await repo.text(preparation.content)) as Composition;
  const attachments = await snapshotFiles(repo, { snapshots: preparation.snapshots } as ApplicationLink);
  let current = await mail.draft(draftId);
  if (!matchesDraft(current, content, preparation.snapshots)) {
    if (hash(JSON.stringify(current)) !== preparation.beforeHash) throw new JobError('The native draft changed during preparation. Reload before preparing a new attempt.', 409, 'draft_changed');
    try { await mail.saveDraft(draftId, { ...content, attachments }, attempt); current = await mail.draft(draftId); }
    catch { await repo.db.transaction(async tx => { tx.set(prepPath, { ...preparation, state: 'uncertain' }); }); throw new JobError('Draft preparation is uncertain. Retry this same preparation to reconcile; your composition is retained.', 503, 'preparation_uncertain'); }
  }
  if (!matchesDraft(current, content, preparation.snapshots)) throw new JobError('Native draft verification failed. Reload to reconcile.', 503, 'preparation_uncertain');
  const link: ApplicationLink = { workspaceId: id, draftId, returnRef: preparation.returnRef, snapshots: preparation.snapshots.map((file, index) => ({ ...file, nativeId: current.attachments[index].id })), updatedAt: new Date().toISOString() };
  await repo.db.transaction(async tx => { tx.set(linkPath(repo, draftId), link); tx.set(`${repo.root}/applicationReturns/${link.returnRef}`, { draftId, workspaceId: id }); tx.set(prepPath, { ...preparation, snapshots: link.snapshots, state: 'ready' }); });
  return { link, draft: current, content: { ...content, attachments } };
}

/** Preserve native draft attachment recovery bytes independently of artifact retention. */
export async function captureApplicationFiles(repo: JobRepository, draft: Draft, content: Composition) {
  const previous = await applicationLink(repo, draft.id); if (!previous || content.attachments === undefined) return;
  const snapshots: ApplicationSnapshot[] = [];
  for (const [index, file] of content.attachments.entries()) {
    const bytes = Buffer.from(file.content, 'base64'); const old = previous.snapshots.find(old => old.filename === file.filename && old.hash === hash(bytes));
    const object = old?.object ?? await repo.writeObject(previous.workspaceId, `mail-snapshots/${randomUUID()}/${index}`, bytes, file.contentType, JOB_LIMITS.pdfBytes);
    snapshots.push({ filename: file.filename, contentType: file.contentType, hash: hash(bytes), size: bytes.length, object, managed: old?.managed ?? false, nativeId: draft.attachments[index].id, ...(old?.kind ? { kind: old.kind } : {}), ...(old?.versionId ? { versionId: old.versionId } : {}) });
  }
  await repo.db.transaction(async tx => { tx.set(linkPath(repo, draft.id), { ...previous, snapshots, updatedAt: new Date().toISOString() }); });
}
