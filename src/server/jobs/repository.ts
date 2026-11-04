import { randomUUID } from 'node:crypto';
import type { SessionPrincipal } from '../../lib/auth.ts';
import { JOB_LIMITS, JobError, validId, descriptionText, metadataInput, noteValues, emptyPair, type Workspace, type Description, type JobMetadata, type ArtifactKind, type ArtifactPair, type ArtifactVersion, type GenerationInput, type AttemptReceipt, type Notes, type ObjectManifest } from '../../lib/job-contracts.ts';
import { hash, type MetadataStore, type ObjectStore, type Transaction } from './storage.ts';
const now = () => new Date().toISOString();
const conflict = () => new JobError('This workspace changed. Reload before trying again.', 409, 'stale_state');
export class JobRepository {
  readonly root: string;
  readonly db: MetadataStore;
  readonly objects: ObjectStore;
  constructor(principal: SessionPrincipal, db: MetadataStore, objects: ObjectStore) {
    if (principal.role !== 'terrell' || !/^[A-Za-z0-9_-]{1,128}$/.test(principal.uid)) throw new JobError('Owner access is required.', 403);
    this.root = `careerOwners/${principal.uid}`; this.db = db; this.objects = objects;
  }
  path(id: string) { return `${this.root}/workspaces/${validId(id)}`; }
  artifactPath(id: string, kind: ArtifactKind) { return `${this.path(id)}/artifacts/${kind}`; }
  async workspace(id: string, tx?: Transaction): Promise<Workspace> {
    const value = await (tx ?? this.db).get<Workspace>(this.path(id));
    if (!value) throw new JobError('Workspace not found.', 404, 'not_found'); return value;
  }
  async list(limit = 20, after?: string) { if (!Number.isInteger(limit) || limit < 1 || limit > JOB_LIMITS.page) throw new JobError('Page size must be 1–50.'); if (after) validId(after); const items = await this.db.list<Workspace>(`${this.root}/workspaces`, limit + 1, after); return { items: items.slice(0, limit), next: items.length > limit ? items[limit - 1].id : null }; }
  async writeObject(workspaceId: string, suffix: string, text: string | Uint8Array, mime: string, limit = JOB_LIMITS.objectBytes): Promise<ObjectManifest> {
    const bytes = typeof text === 'string' ? Buffer.from(text) : text;
    if (bytes.length > limit) throw new JobError('Saved content exceeds its encoded-size limit.', 413);
    return this.objects.put(`career/${this.root.split('/')[1]}/${validId(workspaceId)}/${suffix}`, bytes, mime);
  }
  async text(manifest: ObjectManifest) { return Buffer.from(await this.objects.read(manifest, JOB_LIMITS.objectBytes)).toString('utf8'); }
  async create(text: string, attemptId: string) {
    const normalized = descriptionText(text); validId(attemptId); const contentHash = hash(normalized);
    const attemptPath = `${this.root}/creationAttempts/${attemptId}`; const index = `${this.root}/descriptionIndex/${contentHash}`;
    const attempt = await this.db.get<{ hash: string; id: string }>(attemptPath);
    if (attempt) { if (attempt.hash !== contentHash) throw conflict(); return { workspace: await this.workspace(attempt.id), created: false }; }
    const id = randomUUID(); const descriptionId = randomUUID(); const createdAt = now();
    const content = await this.writeObject(id, `descriptions/${descriptionId}.txt`, normalized, 'text/plain');
    try {
      return await this.db.transaction(async tx => {
        const priorAttempt = await tx.get<{ hash: string; id: string }>(attemptPath);
        const match = await tx.get<{ id: string }>(index);
        const prior = priorAttempt ?? (match ? { hash: contentHash, id: match.id } : null);
        if (prior) {
          if (prior.hash !== contentHash) throw conflict();
          const workspace = await this.workspace(prior.id, tx);
          tx.set(attemptPath, { hash: contentHash, id: workspace.id });
          return { workspace, created: false };
        }
        const workspace: Workspace = { id, descriptionId, company: null, title: null, location: null, requisition: null, metadataVersion: 0, extraction: 'pending', createdAt, updatedAt: createdAt, schemaVersion: 1 };
        tx.set(this.path(id), workspace);
        tx.set(`${this.path(id)}/descriptions/${descriptionId}`, { id: descriptionId, hash: contentHash, content, createdAt } satisfies Description);
        tx.set(index, { id }); tx.set(attemptPath, { hash: contentHash, id });
        return { workspace, created: true };
      });
    } finally {
      // An object staged for a duplicate/failed creation has no committed manifest.
      const saved = await this.db.get<Description>(`${this.path(id)}/descriptions/${descriptionId}`);
      if (!saved) await this.objects.delete(content);
    }
  }
  async description(id: string, descriptionId?: string) {
    const workspace = await this.workspace(id);
    const description = await this.db.get<Description>(`${this.path(id)}/descriptions/${validId(descriptionId ?? workspace.descriptionId)}`);
    if (!description) throw new JobError('Description not found.', 404);
    return { ...description, text: await this.text(description.content) };
  }
  async updateMetadata(id: string, expected: number, metadata: JobMetadata, extraction?: Workspace['extraction']) {
    const values = metadataInput(metadata);
    return this.db.transaction(async tx => {
      const workspace = await this.workspace(id, tx);
      if (workspace.metadataVersion !== expected) throw conflict();
      const next = { ...workspace, ...values, metadataVersion: expected + 1, extraction: extraction ?? 'ready', updatedAt: now() };
      tx.set(this.path(id), next); return next;
    });
  }
  async updateDescription(id: string, expected: string, text: string) {
    const normalized = descriptionText(text); const descriptionId = randomUUID(); const contentHash = hash(normalized);
    await this.workspace(id);
    const content = await this.writeObject(id, `descriptions/${descriptionId}.txt`, normalized, 'text/plain');
    try {
      return await this.db.transaction(async tx => {
        const workspace = await this.workspace(id, tx); const index = `${this.root}/descriptionIndex/${contentHash}`;
        const match = await tx.get<{ id: string }>(index);
        if (workspace.descriptionId !== expected) throw conflict();
        if (match && match.id !== id) throw new JobError('That description belongs to another saved job. Reopen its workspace.', 409);
        const next = { ...workspace, descriptionId, metadataVersion: workspace.metadataVersion + 1, extraction: 'pending' as const, updatedAt: now() };
        tx.set(`${this.path(id)}/descriptions/${descriptionId}`, { id: descriptionId, hash: contentHash, content, createdAt: now() } satisfies Description);
        tx.set(this.path(id), next); tx.set(index, { id }); return next;
      });
    } finally { if (!await this.db.get(`${this.path(id)}/descriptions/${descriptionId}`)) await this.objects.delete(content); }
  }
  async pair(id: string, kind: ArtifactKind, tx?: Transaction): Promise<ArtifactPair> { await this.workspace(id, tx); return await (tx ?? this.db).get<ArtifactPair>(this.artifactPath(id, kind)) ?? emptyPair(); }
  async retained(id: string, kind: ArtifactKind, versionId: string) {
    validId(versionId); const pair = await this.pair(id, kind); const version = [pair.current, pair.previous].find(v => v?.id === versionId);
    if (!version) throw new JobError('This version is no longer retained.', 410, 'no_longer_retained'); return version;
  }
  async readVersion(id: string, kind: ArtifactKind, versionId: string) {
    const version = await this.retained(id, kind, versionId);
    const [result, markdown, review] = await Promise.all([this.text(version.result), this.text(version.markdown), this.text(version.review)]);
    return { version, result: JSON.parse(result) as unknown, markdown, review: JSON.parse(review) as unknown };
  }
  attemptPath(attemptId: string) { return `${this.root}/attempts/${validId(attemptId)}`; }
  async claim(id: string, kind: ArtifactKind, input: GenerationInput) {
    const requestHash = hash(JSON.stringify({ id, kind, input }));
    return this.db.transaction(async tx => {
      const pair = await this.pair(id, kind, tx); const workspace = await this.workspace(id, tx);
      const path = this.attemptPath(input.attemptId); const attempt = await tx.get<AttemptReceipt>(path);
      if (attempt) {
        if (attempt.requestHash !== requestHash) throw new JobError('Attempt ID was already used for another request.', 409);
        if (attempt.state === 'saved') {
          const version = [pair.current, pair.previous].find(v => v?.id === attempt.versionId);
          if (!version) throw new JobError('The completed attempt is no longer retained.', 410, 'no_longer_retained');
          return { receipt: attempt, version, replay: true };
        }
        if (attempt.state === 'running' && Date.now() - Date.parse(attempt.startedAt) < 180000) throw new JobError('Generation is still running. Retry this attempt to reconcile.', 409, 'in_progress');
        if (attempt.state === 'running') { tx.set(path, { ...attempt, state: 'interrupted' }); return { receipt: { ...attempt, state: 'interrupted' as const }, version: null, replay: true }; }
        throw new JobError(`This attempt is ${attempt.state}. Start an explicit new attempt.`, 409, attempt.state);
      }
      if (pair.state !== input.expectedState || workspace.descriptionId !== input.descriptionId || (input.mode === 'initial' ? Boolean(pair.current) : !pair.current)) throw conflict();
      const receipt: AttemptReceipt = { requestHash, workspaceId: id, kind, state: 'running', versionId: randomUUID(), startedAt: now() };
      tx.set(path, receipt); return { receipt, version: null, replay: false };
    });
  }
  async fail(attemptId: string, state: 'failed' | 'conflict') { await this.db.transaction(async tx => { const path = this.attemptPath(attemptId); const receipt = await tx.get<AttemptReceipt>(path); if (receipt?.state === 'running') tx.set(path, { ...receipt, state }); }); }
  async commit(id: string, kind: ArtifactKind, input: GenerationInput, version: ArtifactVersion) {
    // Verify every staged immutable object before publishing pointers.
    await Promise.all([version.result, version.markdown, version.review].map(object => this.objects.read(object, JOB_LIMITS.objectBytes)));
    return this.db.transaction(async tx => {
      const pair = await this.pair(id, kind, tx); const workspace = await this.workspace(id, tx);
      const attempt = await tx.get<AttemptReceipt>(this.attemptPath(input.attemptId));
      if (attempt?.state === 'saved' && attempt.versionId === version.id) return pair;
      if (!attempt || attempt.state !== 'running' || attempt.versionId !== version.id || attempt.workspaceId !== id || attempt.kind !== kind || attempt.requestHash !== hash(JSON.stringify({ id, kind, input }))) throw conflict();
      if (pair.state !== input.expectedState || workspace.descriptionId !== input.descriptionId) throw conflict();
      const next: ArtifactPair = { state: pair.state + 1, current: version, previous: pair.current };
      tx.set(this.artifactPath(id, kind), next); tx.set(this.attemptPath(input.attemptId), { ...attempt, state: 'saved' });
      if (pair.previous) tx.set(`${this.path(id)}/cleanup/${pair.previous.id}`, { id: pair.previous.id, kind, objects: this.versionObjects(pair.previous) });
      return next;
    });
  }
  async undo(id: string, kind: ArtifactKind, expected: number) {
    return this.db.transaction(async tx => { const pair = await this.pair(id, kind, tx); if (pair.state !== expected || !pair.previous) throw conflict(); const next = { state: pair.state + 1, current: pair.previous, previous: pair.current }; tx.set(this.artifactPath(id, kind), next); return next; });
  }
  versionObjects(version: ArtifactVersion): ObjectManifest[] { return [version.result, version.markdown, version.review, ...(version.pdf.state === 'ready' ? [version.pdf.content] : [])]; }
  async discardObjects(id: string, kind: ArtifactKind, objects: ObjectManifest[]) {
    if (!objects.length) return;
    const cleanupId = randomUUID();
    await this.db.transaction(async tx => { tx.set(`${this.path(id)}/cleanup/${cleanupId}`, { id: cleanupId, kind, objects }); });
    await this.cleanup(id);
  }
  async cleanup(id: string) {
    await this.workspace(id);
    const items = await this.db.list<{ id: string; kind: ArtifactKind; objects: ObjectManifest[] }>(`${this.path(id)}/cleanup`, 10);
    for (const item of items) {
      const pair = await this.pair(id, item.kind);
      const retained = new Set([pair.current, pair.previous].flatMap(version => version ? this.versionObjects(version).map(object => object.path) : []));
      if (item.objects.some(object => retained.has(object.path))) continue;
      try {
        await Promise.all(item.objects.map(object => this.objects.delete(object)));
        await this.db.transaction(async tx => { tx.delete(`${this.path(id)}/cleanup/${item.id}`); });
      } catch { /* Retry the durable cleanup receipt on a later owner request. */ }
    }
  }
  async notes(id: string): Promise<Notes> { await this.workspace(id); return await this.db.get<Notes>(`${this.path(id)}/notes/interview`) ?? { state: 0, values: {}, savedAt: null }; }
  async saveNotes(id: string, expected: number, values: Record<string, string>) {
    noteValues(values); return this.db.transaction(async tx => { await this.workspace(id, tx); const path = `${this.path(id)}/notes/interview`; const prior = await tx.get<Notes>(path); if ((prior?.state ?? 0) !== expected) throw conflict(); const next = { state: expected + 1, values, savedAt: now() }; tx.set(path, next); return next; });
  }
}
