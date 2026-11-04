import { useEffect, useRef, useState, type FormEvent } from 'react';
import { FILE_TYPES, MAIL_LIMITS, hasDraftContent, type Composition, type Draft, type MailContact } from '../lib/mail-types';
import type { PublicProfile } from '../app-types';
import MailHtmlEditor from './MailHtmlEditor';
import { MailIcon, MailIconButton } from './MailUI';
import { mailApi, jsonWrite, MailClientError } from '../lib/mail-client';
export type ComposerTarget = { draft?: Draft; threadId?: string; emailId?: string; action?: 'reply' | 'reply-all' | 'forward'; initial?: Partial<Composition> };
const blank: Composition = { to: [], cc: [], bcc: [], subject: '', text: '', html: '' };
export default function MailComposer({ target, contacts, profile, onClose, onSent }: { profile: PublicProfile; target: ComposerTarget; contacts: MailContact[]; onClose: () => void; onSent: () => void }) {
  const original = target.draft;
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState<Composition>(() => ({ ...blank, ...target.initial, ...(original ? { to: original.to ?? [], cc: original.cc, bcc: original.bcc, subject: original.subject ?? '', text: original.text ?? '', html: original.html ?? '', ...(original.thread_id ? { threadId: original.thread_id, replyToEmailId: original.reply_to_email_id! } : {}) } : {}), ...(target.threadId && target.action !== 'forward' ? { threadId: target.threadId, replyToEmailId: target.emailId } : {}) }));
  const [recipients, setRecipients] = useState(() => ({ to: content.to.join(', '), cc: content.cc.join(', '), bcc: content.bcc.join(', ') }));
  const [status, setStatus] = useState(original ? 'Saved' : 'Ready to write');
  const [error, setError] = useState('');
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [copyNotice, setCopyNotice] = useState('');
  const [sending, setSending] = useState(false);
  const [frozen, setFrozen] = useState(false);
  const [sent, setSent] = useState(false);
  const draftId = useRef<string | null>(original?.id ?? null);
  const latest = useRef(content);
  const saved = useRef(JSON.stringify(content));
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const initialCreate = useRef<{ attempt: string; content: Composition } | null>(null);
  const sendAttempt = useRef<string | null>(null);
  const paused = useRef(false);
  function edit(value: Composition) { latest.current = value; setContent(value); setStatus(!draftId.current && !hasDraftContent(value) ? 'Ready to write' : 'Unsaved'); setError(''); }
  const saveRef = useRef<(value: Composition) => Promise<string>>(null);
  // The writer queue serializes creates and updates; the initial create retains an immutable retry payload.
  useEffect(() => {
    saveRef.current = (value: Composition) => {
      const operation = queue.current.catch(() => {}).then(async () => {
        setStatus('Saving…');
        if (!draftId.current) {
          initialCreate.current ??= { attempt: crypto.randomUUID(), content: structuredClone(value) };
          const created = await mailApi<{ id: string }>('drafts', jsonWrite('POST', initialCreate.current));
          draftId.current = created.id;
          if (JSON.stringify(initialCreate.current.content) === JSON.stringify(value)) { saved.current = JSON.stringify(value); setStatus(JSON.stringify(latest.current) === saved.current ? 'Saved' : 'Unsaved'); return created.id; }
        }
        await mailApi(`drafts/${draftId.current}`, jsonWrite('PATCH', { content: value, attempt: crypto.randomUUID() }));
        saved.current = JSON.stringify(value);
        setStatus(JSON.stringify(latest.current) === saved.current ? 'Saved' : 'Unsaved');
        return draftId.current!;
      }).catch(error => {
        if (!draftId.current && error instanceof MailClientError && error.status >= 400 && error.status < 500 && error.status !== 409 && error.status !== 429) initialCreate.current = null;
        setStatus('Save failed — edits retained'); setNeedsSignIn(error instanceof MailClientError && error.status === 401); setError(error.message); throw error;
      });
      queue.current = operation;
      return operation;
    };
  }, []);
  useEffect(() => {
    if (frozen || sending || sent || (!draftId.current && !hasDraftContent(content)) || JSON.stringify(content) === saved.current) return;
    const timer = window.setTimeout(() => { if (!paused.current) void saveRef.current?.(content).catch(() => {}); }, 900);
    return () => clearTimeout(timer);
  }, [content, frozen, sending, sent]);
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => { if (JSON.stringify(latest.current) !== saved.current || paused.current) event.preventDefault(); };
    window.addEventListener('beforeunload', guard); return () => window.removeEventListener('beforeunload', guard);
  }, []);
  async function send(event: FormEvent) {
    event.preventDefault(); if (sending || sent) return;
    if (!latest.current.to.length || !(latest.current.text || latest.current.html) || (!latest.current.threadId && !latest.current.subject)) {
      setError('Add a recipient, subject, and message before sending.'); return;
    }
    paused.current = true; setSending(true); setFrozen(true); setError('');
    sendAttempt.current ??= crypto.randomUUID();
    try {
      await queue.current.catch(() => {});
      const id = JSON.stringify(latest.current) === saved.current && draftId.current ? draftId.current : await saveRef.current!(latest.current);
      if (target.action && target.threadId && target.emailId) {
        await mailApi(`threads/${target.threadId}/messages/${target.emailId}/${target.action}`, jsonWrite('POST', { content: latest.current, attempt: sendAttempt.current }));
        // Mail has already been accepted; a cleanup error must never invite a second send.
        await mailApi(`drafts/${id}`, jsonWrite('DELETE')).catch(() => setError('Mail accepted; remove the leftover draft from Drafts.'));
      } else await mailApi(`drafts/${id}/send`, jsonWrite('POST', { attempt: sendAttempt.current }));
      paused.current = false; setSent(true); setStatus('Accepted for sending'); onSent();
    } catch (error) {
      const e = error as MailClientError;
      setNeedsSignIn(e.status === 401);
      setError(`${e.message} ${e.status === 401 ? 'Open login in another tab; keep this composer open and copy your work before signing in.' : ''}`);
      setStatus(e.code === 'uncertain' || !e.status ? 'Send uncertain — retry unchanged' : 'Send failed — content retained');
      if (e.status && e.status < 500 && e.code !== 'conflict' && e.status !== 429) { setFrozen(false); paused.current = false; sendAttempt.current = null; }
    } finally { setSending(false); }
  }
  async function files(selected: FileList | null) {
    if (!selected) return;
    try {
      const list = Array.from(selected);
      if (list.length > MAIL_LIMITS.files || list.reduce((n, f) => n + f.size, 0) > MAIL_LIMITS.attachments || list.some(f => !FILE_TYPES.includes(f.type) || !f.size)) throw new Error('Use up to 10 supported, nonempty files totaling at most 10 MiB.');
      const attachments = await Promise.all(list.map(file => new Promise<{ filename: string; contentType: string; content: string }>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve({ filename: file.name, contentType: file.type, content: String(reader.result).split(',')[1] }); reader.onerror = () => reject(new Error('Could not read attachment.')); reader.readAsDataURL(file); })));
      edit({ ...latest.current, attachments });
    } catch (error) { setError((error as Error).message); }
  }
  const recipient = (field: 'to' | 'cc' | 'bcc') => <label>{field.toUpperCase()}<input list="mail-contact-suggestions" value={recipients[field]} disabled={frozen || sending || (field === 'to' && !!target.action && target.action !== 'forward')} onChange={event => { const value = event.target.value; setRecipients(v => ({ ...v, [field]: value })); edit({ ...latest.current, [field]: value.split(',').map(s => s.trim()).filter(Boolean) }); }} /></label>;
  return <section className={`mail-composer ${expanded ? 'mail-composer-expanded' : ''}`} aria-label="Mail composer">
    <div className="mail-heading"><h2>{target.action ? target.action.replace('-', ' ') : 'New message'}</h2><div className="mail-heading-tools"><MailIconButton name="expand" label={expanded ? 'Restore composer' : 'Expand composer'} onClick={() => setExpanded(v => !v)} /><MailIconButton name="close" label="Close composer" onClick={onClose} disabled={!sent && (sending || frozen || (status !== 'Saved' && status !== 'Ready to write'))} /></div></div>
    <form onSubmit={send}>
      <datalist id="mail-contact-suggestions">{contacts.map(c => <option key={c.id} value={c.email}>{c.first_name} {c.last_name}</option>)}</datalist>
      <fieldset disabled={frozen || sending || sent}>
        {recipient('to')}<div className="mail-two">{recipient('cc')}{recipient('bcc')}</div>
        <label>Subject<input maxLength={998} value={content.subject} onChange={e => edit({ ...content, subject: e.target.value })} /></label>
        <label>Message<textarea aria-label="Message" rows={8} value={content.text} onChange={e => edit({ ...content, text: e.target.value })} /></label>
        {content.html && <p className="mail-limit-note">Edit the HTML below for the styled email. The message above is its plain-text alternative.</p>}
        <MailHtmlEditor profile={profile} html={content.html} onEdit={html => edit({ ...latest.current, html })} onApply={template => edit({ ...latest.current, subject: template.subject, text: template.text, html: template.html })} />
        <label className="mail-attachment-input"><span><MailIcon name="attachment" /> Attachments</span><input type="file" multiple accept={FILE_TYPES.join(',')} onChange={e => void files(e.target.files)} /></label>
        <p className="mail-limit-note">Up to 10 files · 10 MiB total · PDF, text, CSV, images, ZIP</p>
        <ul>{(content.attachments ?? original?.attachments ?? []).map((a, i) => <li key={i}>{a.filename}</li>)}</ul>
        {(content.attachments ?? original?.attachments ?? []).length > 0 && <button type="button" className="mail-secondary" onClick={() => edit({ ...content, attachments: [] })}>Remove attachments</button>}
      </fieldset>
      <p className="mail-save-status" role="status">{status}</p>{copyNotice && <p role="status">{copyNotice}</p>}{error && <p role="alert" className="error">{error}</p>}
      <div className="mail-actions">
        <button className="mail-send" type="submit" disabled={sending || sent}><MailIcon name="sent" />{sending ? 'Sending…' : frozen ? 'Retry unchanged send' : 'Send message'}</button>
        <button type="button" disabled={sending || frozen || sent || !hasDraftContent(content)} onClick={() => void saveRef.current!(latest.current).catch(() => {})}>Save draft</button>
        <button type="button" onClick={() => void navigator.clipboard.writeText(JSON.stringify({ ...content, attachments: content.attachments?.map(a => a.filename) }, null, 2)).then(() => setCopyNotice('Copied editable content')).catch(() => setError('Copy failed. Select and copy your message manually.'))}>Copy content</button>
        {error && needsSignIn && <a href="/login" target="_blank" rel="noopener noreferrer">Sign in in another tab</a>}
        {!frozen && !sending && <button type="button" onClick={async () => { paused.current = true; await queue.current.catch(() => {}); try { if (draftId.current) await mailApi(`drafts/${draftId.current}`, jsonWrite('DELETE')); onClose(); onSent(); } catch (error) { paused.current = false; setError((error as Error).message); } }}>Discard draft</button>}
      </div>
    </form>
  </section>;
}
