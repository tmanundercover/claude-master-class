import { Resend, type Response as ProviderResponse, type UpdateInboxThreadOptions, type ReplyInboxThreadEmailOptions, type ForwardInboxThreadEmailOptions } from 'resend';
import { MAIL_LIMITS, OWNER_EMAIL, type Mailbox, type Composition, type ContactSubmission, type ContactInput, type Search, type Message } from '../../lib/mail-types.ts';
import { MailError } from './validation.ts';
import { Attempts, digest } from './attempts.ts';
import { isContactNotification, receivedContactCopy } from './contact-delivery.ts';
export type MailConfig = { mode: 'fixture' | 'live'; inboxId: string; email: string; fromName: string; contactFrom: string; apiKey: string; webhookSecret: string };
export function mailConfiguration(env: NodeJS.ProcessEnv = process.env): MailConfig {
  const mode = env.RESEND_MODE;
  if (mode !== 'fixture' && mode !== 'live') throw new MailError('Set RESEND_MODE explicitly in the Functions backend.', 503, 'configuration');
  if (mode === 'fixture' && (env.FUNCTIONS_EMULATOR !== 'true' || !(env.GCLOUD_PROJECT ?? '').startsWith('demo-'))) throw new MailError('Mail fixtures require Functions emulation in a demo project.', 503, 'configuration');
  if (mode === 'live' && (!env.RESEND_API_KEY || !env.RESEND_INBOX_ID || env.RESEND_INBOX_EMAIL !== OWNER_EMAIL || !env.CONTACT_FROM_EMAIL || !env.RESEND_FROM_NAME)) throw new MailError('Configure the Resend owner inbox, verified contact sender, and display name in Functions.', 503, 'configuration');
  const contactFrom = env.CONTACT_FROM_EMAIL ?? 'website@thehandsomestnerd.com';
  if (!/^[A-Za-z0-9._+-]+@thehandsomestnerd\.com$/.test(contactFrom) || /[\r\n<>]/.test(env.RESEND_FROM_NAME ?? '')) throw new MailError('Invalid backend sending identity.', 503, 'configuration');
  return { mode, inboxId: env.RESEND_INBOX_ID ?? 'fixture-owner', email: OWNER_EMAIL, fromName: env.RESEND_FROM_NAME ?? 'Terrell Singleton', contactFrom, apiKey: env.RESEND_API_KEY ?? 'fixture-unused', webhookSecret: env.RESEND_WEBHOOK_SECRET ?? '' };
}
export class LiveMailbox implements Mailbox {
  readonly mode = 'live' as const;
  private sdk: Resend;
  private config: MailConfig;
  private attempts = new Attempts();
  constructor(config: MailConfig, sdk = new Resend(config.apiKey)) { this.config = config; this.sdk = sdk; }
  private get selector() { return { inboxId: this.config.inboxId }; }
  private async call<T>(read: boolean, operation: (options: { signal: AbortSignal; idempotencyKey?: string }) => Promise<ProviderResponse<T>>, key?: string, signal?: AbortSignal): Promise<T> {
    for (let i = 0; ; i++) {
      if (signal?.aborted) throw new MailError('Mail operation timed out.', 503, 'unavailable');
      let result: ProviderResponse<T>;
      try { result = await operation({ signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000), ...(key ? { idempotencyKey: key } : {}) }); }
      catch { if (read && i < 2 && !signal?.aborted) { await new Promise(resolve => setTimeout(resolve, 150 * 2 ** i)); continue; } throw new MailError(read ? 'Mail provider is unavailable.' : 'The write result is uncertain. Retry unchanged with the same attempt.', 503, read ? 'unavailable' : 'uncertain'); }
      if (!result.error && result.data) return result.data;
      const status = result.error?.statusCode;
      const retryAfter = Math.min(120, Math.max(1, Number(result.headers?.['retry-after']) || 1));
      if (read && i < 2 && !signal?.aborted && (!status || status === 429 || status >= 500) && retryAfter <= 2) { await new Promise(resolve => setTimeout(resolve, retryAfter * 1000)); continue; }
      if (status === 429) throw new MailError('Mail provider rate limit. Retry after the indicated delay.', 429, 'rate_limit', retryAfter);
      if (status === 404) throw new MailError('Mail resource not found in the configured inbox.', 404, 'not_found');
      if (status === 409) throw new MailError('Attempt conflict. Keep the original payload and reconcile before a new send.', 409, 'conflict');
      if (status === 401 || status === 403) throw new MailError('The backend Resend key lacks permission for this operation.', 503, 'configuration');
      if (status && status >= 400 && status < 500) throw new MailError('Resend rejected this operation. Check recipients, content, attachment types, and supported settings.', 422, 'provider_validation');
      throw new MailError(read ? 'Mail provider is unavailable.' : 'The write result is uncertain. Retry unchanged with the same attempt.', 503, read ? 'unavailable' : 'uncertain');
    }
  }
  async summary() {
    const inbox = await this.call(true, o => this.sdk.inboxes.get(this.config.inboxId, o));
    if (inbox.email_address.toLowerCase() !== OWNER_EMAIL) throw new MailError('Configured inbox does not match the owner address.', 503, 'configuration');
    const recent = await this.call(true, o => this.sdk.inboxes.threads.list({ ...this.selector, limit: 5 }, o));
    return { email_address: inbox.email_address, unread: inbox.unread, drafts: inbox.drafts, last_received: inbox.last_received, recent: recent.data, mode: this.mode };
  }
  async threads(s: Search) { return this.call(true, o => this.sdk.inboxes.threads.search({ ...this.selector, limit: 20, after: s.after, folders: s.folder ? [s.folder] : undefined, labels: s.label ? [s.label] : undefined, query: s.query, from: s.from ? [s.from] : undefined, to: s.to ? [s.to] : undefined, read: s.read, hasAttachment: s.hasAttachment, startDate: s.startDate, endDate: s.endDate }, o)); }
  async thread(id: string) { return this.call(true, o => this.sdk.inboxes.threads.get({ ...this.selector, threadId: id }, o)); }
  async messages(id: string, after?: string) { return this.call(true, o => this.sdk.inboxes.threads.emails.list({ ...this.selector, threadId: id, after, limit: 20 }, o)); }
  async message(threadId: string, emailId: string) { return this.call(true, o => this.sdk.inboxes.threads.emails.get({ ...this.selector, threadId, emailId }, o)); }
  async updateThread(id: string, value: Parameters<Mailbox['updateThread']>[1]) { return this.call(false, o => this.sdk.inboxes.threads.update({ ...this.selector, threadId: id, ...value } as UpdateInboxThreadOptions, o)); }
  async threadLabels(id: string, labels: string[]) { return this.call(false, o => this.sdk.inboxes.threads.labels.set({ ...this.selector, threadId: id, labels }, o)); }
  async drafts(after?: string) { return this.call(true, o => this.sdk.inboxes.drafts.list({ ...this.selector, after, limit: 20 }, o)); }
  async draft(id: string) { return this.call(true, o => this.sdk.inboxes.drafts.get({ ...this.selector, draftId: id }, o)); }
  async saveDraft(id: string | null, value: Composition, attempt: string) {
    if (id) {
      const existing = await this.draft(id);
      if (existing.email_id) throw new MailError('This draft has already been sent.', 409);
      return this.call(false, o => this.sdk.inboxes.drafts.update({ ...this.selector, draftId: id, to: value.to, cc: value.cc, bcc: value.bcc, subject: value.subject, text: value.text, html: value.html, ...(value.attachments === undefined ? {} : { attachments: value.attachments }) }, o));
    }
    return this.attempts.run(`draft-${attempt}`, value, async () => {
      const replySource = value.threadId && value.replyToEmailId
        ? await this.replySource(value.threadId, value.replyToEmailId) : undefined;
      return this.call(false, o => this.sdk.inboxes.drafts.create({ ...this.selector, ...value, ...(replySource ? { replyToEmailId: replySource.id } : {}) } as Parameters<Resend['inboxes']['drafts']['create']>[0], o), `draft-${attempt}`);
    });
  }
  async discardDraft(id: string) { return this.call(false, o => this.sdk.inboxes.drafts.remove({ ...this.selector, draftId: id }, o)); }
  async sendDraft(id: string, attempt: string) {
    return this.attempts.run(`send-${attempt}`, { id }, async () => {
      const draft = await this.draft(id);
      if (draft.email_id) return { id: draft.email_id };
      if (!draft.to?.length || !(draft.text || draft.html) || (!draft.thread_id && !draft.subject)) throw new MailError('Add a recipient, subject, and message before sending.');
      // Digest is part of the provider-idempotent request: a changed snapshot conflicts even across instances.
      return this.call(false, o => this.sdk.inboxes.drafts.send({ ...this.selector, draftId: id, headers: { 'X-Owner-Draft-Content': digest(draft) } }, o), `send-${attempt}`);
    });
  }
  async respond(threadId: string, emailId: string, action: 'reply' | 'reply-all' | 'forward', value: Composition, attempt: string) {
    const original = action === 'forward' ? await this.message(threadId, emailId) : await this.replySource(threadId, emailId);
    if (action === 'forward') {
      const selectedBytes = (value.attachments ?? []).reduce((n, a) => n + Buffer.from(a.content, 'base64').length, 0);
      if (original.attachments.some(a => a.size === null)) throw new MailError('Original attachment sizes are unavailable; forwarding them is unsupported until verified.', 422, 'unsupported');
      if (original.attachments.length + (value.attachments?.length ?? 0) > MAIL_LIMITS.files || original.attachments.reduce((n, a) => n + (a.size ?? 0), 0) + selectedBytes > MAIL_LIMITS.attachments) throw new MailError('Forwarded originals plus selected files exceed the 10-file / 10 MiB application limit.', 413);
    }
    return this.attempts.run(`respond-${attempt}`, { threadId, emailId, action, value }, () => {
      const { to, ...content } = { to: value.to, cc: value.cc, bcc: value.bcc, subject: value.subject, text: value.text, html: value.html, attachments: value.attachments };
      if (action === 'forward') return this.call(false, o => this.sdk.inboxes.threads.emails.forward({ ...this.selector, threadId, emailId, to, ...content } as ForwardInboxThreadEmailOptions, o), `respond-${attempt}`);
      return this.call(false, o => this.sdk.inboxes.threads.emails.reply({ ...this.selector, threadId, emailId: original.id, ...content, replyAll: action === 'reply-all' } as ReplyInboxThreadEmailOptions, o), `respond-${attempt}`);
    });
  }
  async labels() { const result = await this.call(true, o => this.sdk.inboxes.labels.list(this.selector, o)); return { ...result, has_more: false }; }
  async saveLabel(id: string | null, value: { name: string; color: string }) { return id ? this.call(false, o => this.sdk.inboxes.labels.update({ ...this.selector, labelId: id, ...value }, o)) : this.call(false, o => this.sdk.inboxes.labels.create({ ...this.selector, ...value }, o)); }
  async deleteLabel(id: string) { return this.call(false, o => this.sdk.inboxes.labels.remove({ ...this.selector, labelId: id }, o)); }
  async contacts(after?: string) { return this.call(true, o => this.sdk.contacts.list({ after, limit: 20 }, o)); }
  async saveContact(id: string | null, value: ContactInput) {
    if (id) {
      const previous = await this.call(true, o => this.sdk.contacts.get({ id }, o));
      if (previous.email.toLowerCase() !== value.email.toLowerCase()) throw new MailError('Resend does not support changing an existing contact email. Add a separate contact explicitly.', 422, 'unsupported');
      return this.call(false, o => this.sdk.contacts.update({ id, firstName: value.firstName, lastName: value.lastName }, o));
    }
    return this.call(false, o => this.sdk.contacts.create({ ...value, unsubscribed: true }, o));
  }
  async deleteContact(id: string) { return this.call(false, o => this.sdk.contacts.remove({ id }, o)); }
  async settings() { const inbox = await this.call(true, o => this.sdk.inboxes.get(this.config.inboxId, o)); const agent = await this.call(true, o => this.sdk.inboxes.agent.get(this.selector, o)); return { name: inbox.name, fromName: inbox.from_name ?? '', agent }; }
  async saveSettings(value: Awaited<ReturnType<Mailbox['settings']>>) {
    await this.call(false, o => this.sdk.inboxes.update(this.config.inboxId, { name: value.name, fromName: value.fromName }, o));
    return this.call(false, o => this.sdk.inboxes.agent.update({ ...this.selector, instructions: value.agent.instructions, tone: value.agent.tone, actions: value.agent.actions }, o));
  }
  async contact(value: ContactSubmission) {
    return this.attempts.run(`contact-${value.attempt}`, value, async () => {
      const subject = `Website message from ${value.name}`;
      // Keep the provider payload/key unchanged so retries reconcile already accepted sends.
      const accepted = await this.call(false, o => this.sdk.emails.send({ from: `${this.config.fromName} Website <${this.config.contactFrom}>`, to: [OWNER_EMAIL], replyTo: value.email, subject, text: `${value.name}\n${value.email}\n\n${value.message}` }, o), `contact-${value.attempt}`);
      await this.placeContactDelivery(accepted.id, subject, value.email);
      return accepted;
    });
  }

  private async conversationMessages(threadId: string, signal: AbortSignal): Promise<Message[]> {
    const messages: Message[] = [];
    let after: string | undefined;
    for (let page = 0; page < 3; page++) {
      const result = await this.call(true, o => this.sdk.inboxes.threads.emails.list({ ...this.selector, threadId, limit: 50, after }, o), undefined, signal);
      messages.push(...result.data);
      if (!result.has_more) break;
      after = result.data.at(-1)?.id;
      if (!after) break;
    }
    return messages;
  }

  private async replySource(threadId: string, emailId: string): Promise<Message> {
    const selected = await this.message(threadId, emailId);
    if (selected.direction !== 'outbound' || !isContactNotification(selected, this.config.contactFrom)) return selected;
    const received = receivedContactCopy(selected, await this.conversationMessages(threadId, AbortSignal.timeout(7000)), this.config.contactFrom);
    if (!received) throw new MailError('The contact notification is still awaiting its received copy. Refresh the conversation before replying.', 409, 'contact_pending');
    return received;
  }

  /** Server maintenance entry point; never exposed as a public resource or arbitrary URL proxy. */
  async placeContactDelivery(emailId: string, subject: string, visitorEmail: string): Promise<void> {
    const signal = AbortSignal.timeout(7000);
    try {
      for (let poll = 0; poll < 5; poll++) {
        let after: string | undefined;
        for (let page = 0; page < 3; page++) {
          // Avoid full-text indexing delays: inspect bounded native recent pages, then bind by exact send ID.
          const result = await this.call(true, o => this.sdk.inboxes.threads.list({ ...this.selector, folders: ['inbox','sent','spam','archive','trash'], limit: 50, after }, o), undefined, signal);
          for (const thread of result.data.filter(thread => thread.subject === subject)) {
            const messages = await this.conversationMessages(thread.id, signal);
            const sent = messages.find(message => message.id === emailId && isContactNotification(message, this.config.contactFrom) && message.reply_to[0].toLowerCase() === visitorEmail.toLowerCase());
            const received = sent && receivedContactCopy(sent, messages, this.config.contactFrom);
            if (!received) continue;
            // Preserve owner read state and deliberate archive/trash choices on later retries.
            if (thread.folder === 'sent' || thread.folder === 'spam') await this.call(false, o => this.sdk.inboxes.threads.update({ ...this.selector, threadId: thread.id, folder: 'inbox', read: false }, o), undefined, signal);
            return;
          }
          if (!result.has_more || !result.data.length) break;
          after = result.data.at(-1)!.id;
        }
        if (poll < 4) await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch { /* Provider acceptance already happened; preserve the attempt identity for reconciliation. */ }
    throw new MailError('Resend accepted your message, but its received copy is still being filed in the inbox. Retry this unchanged submission to finish; it will not send another email.', 503, 'uncertain');
  }

  async attachment(threadId: string, emailId: string, attachmentId: string) {
    const message = await this.message(threadId, emailId);
    const attachment = message.attachments.find(a => a.id === attachmentId);
    if (!attachment) throw new MailError('Attachment does not belong to this message.', 404);
    const api = message.direction === 'inbound' ? this.sdk.emails.receiving.attachments : this.sdk.emails.attachments;
    const meta = await this.call(true, o => api.get({ emailId, id: attachmentId }, o));
    if (meta.size > MAIL_LIMITS.attachments) throw new MailError('Attachment exceeds the 10 MiB download limit.', 413);
    const url = new URL(meta.download_url);
    if (!trustedAttachmentURL(url)) throw new MailError('Provider attachment storage is unsupported. No download was attempted.', 503, 'unsupported');
    let response: globalThis.Response;
    try { response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(10000) }); } catch { throw new MailError('Attachment download failed.', 503, 'unavailable'); }
    if (!response.ok) throw new MailError('Attachment download failed.', 503, 'unavailable');
    const reader = response.body!.getReader(); let size = 0; const chunks: Uint8Array[] = [];
    try { while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > MAIL_LIMITS.attachments) { await reader.cancel(); throw new MailError('Attachment exceeds the download limit.', 413); } chunks.push(value); } } finally { reader.releaseLock(); }
    return { filename: attachment.filename ?? 'attachment', bytes: Buffer.concat(chunks) };
  }
}
export function trustedAttachmentURL(url: URL) { return url.protocol === 'https:' && !url.username && !url.password && !url.port && ['inbound-cdn.resend.com', 'outbound-cdn.resend.com'].includes(url.hostname); }
