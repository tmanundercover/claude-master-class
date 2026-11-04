import type { InboxDraft, InboxDraftListItem, InboxMessage, InboxThread, InboxThreadSummary, InboxLabel, InboxAgentSettings, MoveThreadFolder, Contact } from 'resend';
export const OWNER_EMAIL = 'terrell.singleton@thehandsomestnerd.com';
export const MAIL_LIMITS = { attachments: 10 * 1024 * 1024, content: 512 * 1024, files: 10, recipients: 50, request: 15 * 1024 * 1024 };
export const FILE_TYPES = ['application/pdf', 'text/plain', 'text/csv', 'image/png', 'image/jpeg', 'image/gif', 'application/zip'];
export type Page<T> = { data: T[]; has_more: boolean };
export type Thread = InboxThread;
export type Message = InboxMessage;
export type Draft = InboxDraft;
export type Label = InboxLabel;
export type Agent = InboxAgentSettings;
export type MailContact = Contact;
export type Summary = { email_address: string; unread: number; drafts: number; last_received: string | null; recent: Thread[]; mode: 'fixture' | 'live' };
export type Search = { folder?: Thread['folder']; query?: string; from?: string; to?: string; startDate?: string; endDate?: string; hasAttachment?: boolean; read?: boolean; label?: string; after?: string };
export type AttachmentInput = { filename: string; contentType: string; content: string };
export type Composition = { to: string[]; cc: string[]; bcc: string[]; subject: string; text: string; html: string; attachments?: AttachmentInput[]; threadId?: string; replyToEmailId?: string };
export function hasDraftContent(value: Composition): boolean {
  return !!(value.to.length || value.cc.length || value.bcc.length || value.subject || value.text || value.html || value.attachments?.length);
}
export type ContactInput = { email: string; firstName: string; lastName: string };
export type ContactSubmission = { name: string; email: string; message: string; attempt: string; website: string };
export interface Mailbox {
  mode: 'fixture' | 'live';
  summary(): Promise<Summary>;
  threads(search: Search): Promise<Page<Thread>>;
  thread(id: string): Promise<InboxThreadSummary>;
  messages(id: string, after?: string): Promise<Page<Message>>;
  message(threadId: string, emailId: string): Promise<Message>;
  updateThread(id: string, value: { read?: boolean; folder?: MoveThreadFolder }): Promise<unknown>;
  threadLabels(id: string, labels: string[]): Promise<unknown>;
  drafts(after?: string): Promise<Page<InboxDraftListItem>>;
  draft(id: string): Promise<Draft>;
  saveDraft(id: string | null, value: Composition, attempt: string): Promise<{ id: string }>;
  discardDraft(id: string): Promise<unknown>;
  sendDraft(id: string, attempt: string): Promise<{ id: string }>;
  respond(threadId: string, emailId: string, action: 'reply' | 'reply-all' | 'forward', value: Composition, attempt: string): Promise<{ id: string }>;
  labels(): Promise<Page<Label>>;
  saveLabel(id: string | null, value: { name: string; color: string }): Promise<unknown>;
  deleteLabel(id: string): Promise<unknown>;
  contacts(after?: string): Promise<Page<Contact>>;
  saveContact(id: string | null, value: ContactInput): Promise<unknown>;
  deleteContact(id: string): Promise<unknown>;
  settings(): Promise<{ name: string; fromName: string; agent: Agent }>;
  saveSettings(value: { name: string; fromName: string; agent: Agent }): Promise<unknown>;
  contact(value: ContactSubmission): Promise<{ id: string }>;
  attachment(threadId: string, emailId: string, attachmentId: string): Promise<{ filename: string; bytes: Uint8Array }>;
}
