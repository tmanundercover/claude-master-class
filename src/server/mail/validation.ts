import { MAIL_LIMITS, FILE_TYPES, type Composition, type ContactInput, type ContactSubmission, type Search, type Agent } from '../../lib/mail-types.ts';
export class MailError extends Error {
  status: number;
  code: string;
  retryAfter: number;
  constructor(message: string, status = 400, code = 'validation', retryAfter = 0) { super(message); this.status = status; this.code = code; this.retryAfter = retryAfter; }
}
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new MailError('Send a JSON object.');
  return value as Record<string, unknown>;
}
export function keys(value: Record<string, unknown>, allowed: string[]) {
  if (Object.keys(value).some(key => !allowed.includes(key))) throw new MailError('Unsupported field. Inbox, sender, headers, and remote URLs cannot be selected.');
}
export function string(value: unknown, max: number, label: string, required = false): string {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim()) || value.includes('\0')) throw new MailError(`Check ${label} (maximum ${max} characters).`);
  return value;
}
export function address(value: unknown): string {
  const email = string(value, 254, 'email address', true).trim();
  if (!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}$/.test(email)) throw new MailError('Enter a valid email address without a display name or headers.');
  return email;
}
export function identifier(value: unknown): string {
  const id = string(value, 160, 'resource identifier', true);
  if (!/^[A-Za-z0-9_-]+$/.test(id)) throw new MailError('Invalid resource identifier.');
  return id;
}
export function attemptId(value: unknown): string {
  const id = identifier(value);
  if (id.length < 16) throw new MailError('Use a stable attempt identifier of at least 16 characters.');
  return id;
}
export async function boundedBody(request: Request, max: number): Promise<string> {
  const length = request.headers.get('content-length');
  if (length && (!/^\d+$/.test(length) || Number(length) > max)) throw new MailError('Request is too large.', 413);
  const reader = request.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) { await reader.cancel(); throw new MailError('Request is too large.', 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks).toString('utf8');
}
export async function mailJson(request: Request, max = MAIL_LIMITS.request): Promise<Record<string, unknown>> {
  if (!/^application\/json(?:;|$)/i.test(request.headers.get('content-type') ?? '')) throw new MailError('Send application/json.', 415);
  const text = await boundedBody(request, max);
  try { return object(JSON.parse(text)); } catch (error) { if (error instanceof MailError) throw error; throw new MailError('Request body is not valid JSON.'); }
}
export function composition(value: unknown): Composition {
  const v = object(value); keys(v, ['to', 'cc', 'bcc', 'subject', 'text', 'html', 'attachments', 'threadId', 'replyToEmailId']);
  const recipients = (field: string) => {
    if (!Array.isArray(v[field]) || v[field].length > MAIL_LIMITS.recipients) throw new MailError('Use recipient arrays with at most 50 addresses.');
    return v[field].map(address);
  };
  const result: Composition = { to: recipients('to'), cc: recipients('cc'), bcc: recipients('bcc'), subject: string(v.subject, 998, 'subject'), text: string(v.text, MAIL_LIMITS.content, 'message'), html: string(v.html, MAIL_LIMITS.content, 'rich message') };
  if (/[\r\n]/.test(result.subject) || result.to.length + result.cc.length + result.bcc.length > MAIL_LIMITS.recipients || Buffer.byteLength(result.text + result.html) > MAIL_LIMITS.content) throw new MailError('Message content or recipients exceed the published limit.');
  if (v.threadId !== undefined || v.replyToEmailId !== undefined) { result.threadId = identifier(v.threadId); result.replyToEmailId = identifier(v.replyToEmailId); }
  if (v.attachments !== undefined) {
    if (!Array.isArray(v.attachments) || v.attachments.length > MAIL_LIMITS.files) throw new MailError('Attach at most 10 files.');
    let total = 0;
    result.attachments = v.attachments.map(item => {
      const a = object(item); keys(a, ['filename', 'contentType', 'content']);
      const filename = string(a.filename, 200, 'filename', true), contentType = string(a.contentType, 100, 'file type', true);
      if (!FILE_TYPES.includes(contentType) || /[\r\n/\\]/.test(filename) || !/\.(pdf|txt|csv|png|jpe?g|gif|zip)$/i.test(filename)) throw new MailError('Unsupported attachment type or filename.');
      const content = string(a.content, Math.ceil(MAIL_LIMITS.attachments / 3) * 4, 'base64 file content', true);
      if (content.length % 4 !== 0 || /[^A-Za-z0-9+/=]/.test(content)) throw new MailError('Invalid base64 file content.');
      const bytes = Buffer.from(content, 'base64');
      if (bytes.toString('base64') !== content) throw new MailError('Invalid base64 file content.');
      total += bytes.length;
      if (!bytes.length || total > MAIL_LIMITS.attachments) throw new MailError('Attachments must be nonempty and total at most 10 MiB.', 413);
      return { filename, contentType, content };
    });
  }
  return result;
}
export function contactInput(value: unknown): ContactInput {
  const v = object(value); keys(v, ['email', 'firstName', 'lastName']);
  return { email: address(v.email), firstName: string(v.firstName, 100, 'first name'), lastName: string(v.lastName, 100, 'last name') };
}
export function submission(value: unknown): ContactSubmission {
  const v = object(value); keys(v, ['name', 'email', 'message', 'attempt', 'website']);
  const name = string(v.name, 100, 'name', true);
  if (/[\r\n]/.test(name)) throw new MailError('Name cannot contain line breaks.');
  if (v.website !== '') throw new MailError('Submission rejected.');
  return { name, email: address(v.email), message: string(v.message, 8000, 'message', true), attempt: attemptId(v.attempt), website: '' };
}
export function search(params: URLSearchParams): Search {
  keys(Object.fromEntries(params), ['folder','query','from','to','startDate','endDate','hasAttachment','read','label','after']);
  const result: Search = {};
  if (params.has('folder')) { const folder = params.get('folder')!; if (!['inbox','sent','archive','spam','trash'].includes(folder)) throw new MailError('Unknown folder.'); result.folder = folder as Search['folder']; }
  for (const key of ['query','startDate','endDate'] as const) if (params.get(key)) result[key] = string(params.get(key), 500, key);
  for (const key of ['startDate','endDate'] as const) if (result[key] && !/^\d{4}-\d{2}-\d{2}$/.test(result[key]!)) throw new MailError('Use YYYY-MM-DD dates.');
  for (const key of ['from','to'] as const) if (params.get(key)) result[key] = address(params.get(key));
  for (const key of ['hasAttachment','read'] as const) if (params.has(key)) { if (!['true','false'].includes(params.get(key)!)) throw new MailError('Use boolean filters.'); result[key] = params.get(key) === 'true'; }
  for (const key of ['label','after'] as const) if (params.get(key)) result[key] = identifier(params.get(key));
  return result;
}
export function agentInput(value: unknown): Agent {
  const v = object(value); keys(v, ['object','instructions','tone','actions']);
  const tones = ['concise_professional','concise_casual','expanded_professional','expanded_casual'];
  const actions = ['draft_reply','forward_thread','add_labels','assign_thread','mark_as_spam','archive','move_to_trash'];
  if (v.tone !== null && !tones.includes(String(v.tone))) throw new MailError('Unsupported agent tone.');
  if (!Array.isArray(v.actions) || v.actions.some(a => !actions.includes(a))) throw new MailError('Unsupported agent action.');
  return { object: 'inbox_agent', instructions: v.instructions === null ? null : string(v.instructions, 8000, 'agent instructions'), tone: v.tone as Agent['tone'], actions: v.actions as Agent['actions'] };
}
