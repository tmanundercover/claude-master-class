import { OWNER_EMAIL, hasDraftContent, type Mailbox, type Thread, type Message, type Draft, type Label, type Agent, type MailContact, type Composition, type ContactInput, type ContactSubmission, type Search, type Page } from '../../lib/mail-types.ts';
import { Attempts } from './attempts.ts';
import { MailError } from './validation.ts';
import { isContactNotification, receivedContactCopy } from './contact-delivery.ts';
const epoch = '2026-11-03T12:00:00.000Z';
const clone = <T>(value: T): T => structuredClone(value);
export class FixtureMailbox implements Mailbox {
  readonly mode = 'fixture' as const;
  private serial = 0;
  private attempts = new Attempts();
  private records = new Map<string, { thread: Thread; messages: Message[] }>();
  private savedDrafts = new Map<string, Draft>();
  private savedLabels = new Map<string, Label>();
  private savedContacts = new Map<string, MailContact>();
  private preferences = { name: 'Owner inbox', fromName: 'Terrell Singleton', agent: { object: 'inbox_agent', instructions: '', tone: null, actions: [] } as Agent };
  private files = new Map<string, Uint8Array>();
  private fileTypes = new Map<string, string>();
  private contactFrom: string;
  constructor(contactFrom = 'website@thehandsomestnerd.com') {
    this.contactFrom = contactFrom;
    this.receive('A local conversation', 'visitor@example.test', 'A fixture message for local acceptance only.');
    const record = this.records.get('thread-1')!;
    record.messages[0].html = '<p>Local HTML message</p><script>parent.__mailAttack = true</script><img src="https://tracker.invalid/pixel"><a href="javascript:alert(1)">unsafe link</a><form action="/api/contact"><input name="attack"></form>';
    record.messages[0].attachments = [{ id: 'attachment-1', filename: 'local-note.txt', size: 22 }];
    record.thread.has_attachment = true;
    this.fileTypes.set('attachment-1', 'text/plain');
    this.files.set('attachment-1', new TextEncoder().encode('Local attachment only.'));
    for (let i = 0; i < 24; i++) this.receive(`Local correspondence ${i + 1}`, `person${i}@example.test`, `Local message ${i + 1}`);
  }
  private id(prefix: string) { return `${prefix}-${++this.serial}`; }
  private get(id: string) { const r = this.records.get(id); if (!r) throw new MailError('Conversation not found.', 404); return r; }
  private page<T extends { id: string }>(items: T[], after?: string): Page<T> {
    const start = after ? items.findIndex(i => i.id === after) + 1 : 0;
    if (after && !start) throw new MailError('Unknown cursor.');
    return clone({ data: items.slice(start, start + 20), has_more: start + 20 < items.length });
  }
  receive(subject: string, from: string, text: string, threadId?: string) {
    const record = threadId ? this.get(threadId) : undefined;
    const id = record?.thread.id ?? this.id('thread');
    const message: Message = { id: this.id('email'), direction: 'inbound', from, to: [OWNER_EMAIL], cc: [], bcc: [], reply_to: [from], subject, message_id: null, html: null, text, attachments: [], read: false, received_at: epoch };
    if (record) { record.messages.push(message); record.thread.email_count++; record.thread.read = false; record.thread.folder = 'inbox'; }
    else this.records.set(id, { thread: { id, subject, from, to: [OWNER_EMAIL], cc: [], bcc: [], labels: [], email_count: 1, has_attachment: false, has_draft: false, read: false, received_at: epoch, folder: 'inbox' }, messages: [message] });
    return { id: message.id };
  }
  async summary() { const all = [...this.records.values()].map(r => r.thread); return { email_address: OWNER_EMAIL, unread: all.filter(t => !t.read && t.folder === 'inbox').length, drafts: [...this.savedDrafts.values()].filter(d => !d.email_id).length, last_received: all.length ? epoch : null, recent: clone(all.slice(-5).reverse()), mode: this.mode }; }
  async threads(s: Search) {
    const rows = [...this.records.values()].filter(({ thread: t, messages }) => (!s.folder || t.folder === s.folder) && (s.read === undefined || t.read === s.read) && (!s.label || t.labels.some(l => l.id === s.label)) && (s.hasAttachment === undefined || t.has_attachment === s.hasAttachment) && (!s.from || messages.some(m => m.from.includes(s.from!))) && (!s.to || messages.some(m => m.to.includes(s.to!))) && (!s.startDate || t.received_at >= s.startDate) && (!s.endDate || t.received_at.slice(0, 10) <= s.endDate) && (!s.query || messages.some(m => `${m.subject} ${m.text}`.toLowerCase().includes(s.query!.toLowerCase())))).map(r => r.thread).reverse();
    return this.page(rows, s.after);
  }
  async thread(id: string) { const t = this.get(id).thread; return clone({ ...t, object: 'inbox_thread' as const }); }
  async messages(id: string, after?: string) { return this.page(this.get(id).messages, after); }
  async message(threadId: string, emailId: string) { const m = this.get(threadId).messages.find(m => m.id === emailId); if (!m) throw new MailError('Message not found in this conversation.', 404); return clone(m); }
  async updateThread(id: string, value: Parameters<Mailbox['updateThread']>[1]) { Object.assign(this.get(id).thread, value); return this.thread(id); }
  async threadLabels(id: string, labels: string[]) { this.get(id).thread.labels = labels.map(id => { const l = this.savedLabels.get(id); if (!l) throw new MailError('Label not found.', 404); return l; }); return {}; }
  async drafts(after?: string) { return this.page([...this.savedDrafts.values()].filter(d => !d.email_id).map(d => ({ ...d, snippet: d.text?.slice(0, 100) ?? null })), after); }
  async draft(id: string) { const d = this.savedDrafts.get(id); if (!d) throw new MailError('Draft not found.', 404); return clone(d); }
  async saveDraft(id: string | null, value: Composition, attempt: string) {
    if (!id && !hasDraftContent(value)) throw new MailError('Add a recipient, subject, message, or attachment before saving a draft.');
    const execute = async () => {
      const previous = id ? await this.draft(id) : null;
      if (previous?.email_id) throw new MailError('This draft was already sent.', 409);
      let replyToEmailId = value.replyToEmailId;
      if (value.threadId && replyToEmailId) {
        const selected = await this.message(value.threadId, replyToEmailId);
        if (selected.direction === 'outbound' && isContactNotification(selected, this.contactFrom)) {
          const received = receivedContactCopy(selected, this.get(value.threadId).messages, this.contactFrom);
          if (!received) throw new MailError('The contact notification is still awaiting its received copy.', 409, 'contact_pending');
          replyToEmailId = received.id;
        }
      }
      const draftId = id ?? this.id('draft');
      const attachments = value.attachments?.map(a => { const fileId = this.id('attachment'); this.files.set(fileId, Buffer.from(a.content, 'base64')); this.fileTypes.set(fileId, a.contentType); return { id: fileId, filename: a.filename, content_type: a.contentType, size: Buffer.from(a.content, 'base64').length }; }) ?? previous?.attachments ?? [];
      this.savedDrafts.set(draftId, { object: 'inbox_draft', id: draftId, type: value.threadId ? 'reply' : 'standalone', to: value.to, cc: value.cc, bcc: value.bcc, subject: value.subject, html: value.html, text: value.text, thread_id: value.threadId ?? null, reply_to_email_id: replyToEmailId ?? null, email_id: null, created_at: previous?.created_at ?? epoch, updated_at: epoch, attachments });
      return { id: draftId };
    };
    return this.attempts.run(`draft-${attempt}`, { id, value }, execute);
  }
  async discardDraft(id: string) { await this.draft(id); this.savedDrafts.delete(id); return {}; }
  private async outgoing(threadId: string | undefined, value: Composition, to: string[]) {
    if (!to.length || !(value.text || value.html)) throw new MailError('Add recipients and message content.');
    const id = threadId ?? this.id('thread');
    const message: Message = { id: this.id('email'), direction: 'outbound', from: OWNER_EMAIL, to, cc: value.cc, bcc: value.bcc, reply_to: [OWNER_EMAIL], subject: value.subject, message_id: null, html: value.html, text: value.text, attachments: (value.attachments ?? []).map(a => { const fileId = this.id('attachment'); this.files.set(fileId, Buffer.from(a.content, 'base64')); this.fileTypes.set(fileId, a.contentType); return { id: fileId, filename: a.filename, size: Buffer.from(a.content, 'base64').length }; }), read: true, received_at: epoch };
    const existing = threadId ? this.get(threadId) : undefined;
    if (existing) { existing.messages.push(message); existing.thread.email_count++; }
    else this.records.set(id, { thread: { id, subject: value.subject, from: OWNER_EMAIL, to, cc: value.cc, bcc: value.bcc, labels: [], email_count: 1, has_attachment: !!message.attachments.length, has_draft: false, read: true, received_at: epoch, folder: 'sent' }, messages: [message] });
    return { id: message.id };
  }
  async sendDraft(id: string, attempt: string) {
    return this.attempts.run(`send-${attempt}`, { id }, async () => {
      const d = await this.draft(id);
      if (d.email_id) return { id: d.email_id };
      const result = await this.outgoing(d.thread_id ?? undefined, { to: d.to ?? [], cc: d.cc, bcc: d.bcc, subject: d.subject ?? '', text: d.text ?? '', html: d.html ?? '', attachments: d.attachments.map(a => ({ filename: a.filename, contentType: a.content_type, content: Buffer.from(this.files.get(a.id)!).toString('base64') })) }, d.to ?? []);
      this.savedDrafts.get(id)!.email_id = result.id; return result;
    });
  }
  async respond(threadId: string, emailId: string, action: 'reply' | 'reply-all' | 'forward', value: Composition, attempt: string) {
    return this.attempts.run(`respond-${attempt}`, { threadId, emailId, action, value }, async () => {
      const selected = await this.message(threadId, emailId);
      const original = action !== 'forward' && selected.direction === 'outbound' && isContactNotification(selected, this.contactFrom)
        ? receivedContactCopy(selected, this.get(threadId).messages, this.contactFrom) : selected;
      if (!original) throw new MailError('The contact notification is still awaiting its received copy.', 409, 'contact_pending');
      const targets = original.direction === 'outbound' ? original.to : original.reply_to.length ? original.reply_to : [original.from];
      const to = action === 'forward' ? value.to : [...new Set([...targets, ...(action === 'reply-all' ? original.to.concat(original.cc) : [])])].filter(a => a !== OWNER_EMAIL);
      const outgoing = action === 'forward' ? { ...value, attachments: [...original.attachments.map(a => ({ filename: a.filename ?? 'attachment.txt', contentType: this.fileTypes.get(a.id) ?? 'application/octet-stream', content: Buffer.from(this.files.get(a.id)!).toString('base64') })), ...(value.attachments ?? [])] } : value;
      return this.outgoing(action === 'forward' ? undefined : threadId, outgoing, to);
    });
  }
  async labels() { return clone({ data: [...this.savedLabels.values()], has_more: false }); }
  async saveLabel(id: string | null, value: { name: string; color: string }) { if (id && !this.savedLabels.has(id)) throw new MailError('Label not found.', 404); const key = id ?? this.id('label'); this.savedLabels.set(key, { id: key, ...value, created_at: epoch }); for (const r of this.records.values()) r.thread.labels = r.thread.labels.map(l => l.id === key ? this.savedLabels.get(key)! : l); return { id: key }; }
  async deleteLabel(id: string) { this.savedLabels.delete(id); for (const r of this.records.values()) r.thread.labels = r.thread.labels.filter(l => l.id !== id); return {}; }
  async contacts(after?: string) { return this.page([...this.savedContacts.values()], after); }
  async saveContact(id: string | null, value: ContactInput) { const existing = id ? this.savedContacts.get(id) : null; if (id && !existing) throw new MailError('Contact not found.', 404); const key = id ?? this.id('contact'); this.savedContacts.set(key, { id: key, email: value.email, first_name: value.firstName, last_name: value.lastName, created_at: epoch, unsubscribed: existing?.unsubscribed ?? true }); return { id: key }; }
  async deleteContact(id: string) { this.savedContacts.delete(id); return {}; }
  async settings() { return clone(this.preferences); }
  async saveSettings(value: typeof this.preferences) { this.preferences = clone(value); return {}; }
  async contact(value: ContactSubmission) {
    return this.attempts.run(`contact-${value.attempt}`, value, async () => {
      const threadId = this.id('thread');
      const sent: Message = { id: this.id('email'), direction: 'outbound', from: this.contactFrom, to: [OWNER_EMAIL], cc: [], bcc: [], reply_to: [value.email], subject: `Website message from ${value.name}`, message_id: `<contact-${value.attempt}@thehandsomestnerd.com>`, html: null, text: `${value.name}\n${value.email}\n\n${value.message}`, attachments: [], read: true, received_at: epoch };
      const received: Message = { ...clone(sent), id: this.id('email'), direction: 'inbound', read: false };
      this.records.set(threadId, { thread: { id: threadId, subject: sent.subject, from: this.contactFrom, to: [OWNER_EMAIL], cc: [], bcc: [], labels: [], email_count: 2, has_attachment: false, has_draft: false, read: false, received_at: epoch, folder: 'inbox' }, messages: [sent, received] });
      return { id: sent.id };
    });
  }
  async attachment(threadId: string, emailId: string, attachmentId: string) { const message = await this.message(threadId, emailId); const a = message.attachments.find(a => a.id === attachmentId); if (!a || !this.files.has(attachmentId)) throw new MailError('Attachment not found.', 404); return { filename: a.filename ?? 'attachment', bytes: this.files.get(attachmentId)! }; }
}
