import { useEffect, useRef, useState, type FormEvent } from 'react';
import AppLink from '../components/AppLink';
import type { PublicProfile } from '../app-types';
import LogoutButton from '../components/LogoutButton';
import { MailIcon, MailIconButton, CopyMail, MailAddress, type MailIconName } from '../components/MailUI';
import MailComposer, { type ComposerTarget } from '../components/MailComposer';
import { mailApi, jsonWrite, useMail } from '../lib/mail-client';
import { OWNER_EMAIL, type Thread, type Message, type Page, type Label, type MailContact, type Draft, type Agent, type Summary } from '../lib/mail-types';
import { jobRequest } from '../lib/job-client';
import ProfileAvatar from '../components/ProfileAvatar';
type Settings = { name: string; fromName: string; agent: Agent };
export default function Inbox({ profile }: { profile: PublicProfile }) {
  const searchForm = useRef<HTMLFormElement>(null);
  const accountMenu = useRef<HTMLDetailsElement>(null);
  const [readingLoading, setReadingLoading] = useState(false);
  const [checked, setChecked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const summary = useMail<Summary>('summary');
  const [folder, setFolder] = useState('inbox');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [cursor, setCursor] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [composer, setComposer] = useState<ComposerTarget | null>(null);
  const [error, setError] = useState('');
  const [active, setActive] = useState<'mail' | 'contacts' | 'settings' | 'labels'>('mail');
  const [contactCursor, setContactCursor] = useState('');
  const [draftCursor, setDraftCursor] = useState('');
  const [editingContact, setEditingContact] = useState<MailContact | null>(null);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const params = new URLSearchParams({ ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)), folder: folder === 'drafts' ? 'inbox' : folder, ...(cursor ? { after: cursor } : {}) });
  const threads = useMail<Page<Thread>>(`threads?${params}`, true, active === 'mail' && folder !== 'drafts');
  const labels = useMail<Page<Label>>('labels', false);
  const contacts = useMail<Page<MailContact>>(`contacts${contactCursor ? `?after=${contactCursor}` : ''}`, false);
  const drafts = useMail<Page<Draft>>(`drafts${draftCursor ? `?after=${draftCursor}` : ''}`, false, active === 'mail' && folder === 'drafts');
  const settings = useMail<Settings>('settings', false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    void Promise.resolve().then(() => setSelected(params.get('thread')));
    const reference = params.get('applicationReturn');
    if (reference) void jobRequest<{ draftId: string }>(`/application-returns/${encodeURIComponent(reference)}`).then(result => mailApi<Draft>(`drafts/${result.draftId}`)).then(draft => setComposer({ draft })).catch(error => setError(error.message));
  }, []);
  useEffect(() => {
    function closeOutside(event: MouseEvent) { if (!accountMenu.current?.contains(event.target as Node)) accountMenu.current?.removeAttribute('open'); }
    function closeOnEscape(event: KeyboardEvent) { if (event.key === 'Escape' && accountMenu.current?.open) { accountMenu.current.removeAttribute('open'); accountMenu.current.querySelector('summary')?.focus(); } }
    document.addEventListener('click', closeOutside); document.addEventListener('keydown', closeOnEscape);
    return () => { document.removeEventListener('click', closeOutside); document.removeEventListener('keydown', closeOnEscape); };
  }, []);
  function openTool(view: typeof active) { setActive(view); accountMenu.current?.removeAttribute('open'); }
  function refresh() { summary.refresh(); threads.refresh(); drafts.refresh(); labels.refresh(); contacts.refresh(); settings.refresh(); window.dispatchEvent(new Event('mail-mutation')); }
  async function mutate(path: string, method: string, value?: unknown) { try { setError(''); await mailApi(path, jsonWrite(method, value)); refresh(); return true; } catch (e) { setError((e as Error).message); return false; } }
  async function openDraft(id: string) { if (composer) { setError('Save and close the current composer before opening another.'); return; } try { setComposer({ draft: await mailApi<Draft>(`drafts/${id}`) }); } catch (e) { setError((e as Error).message); } }
  function compose(target: ComposerTarget = {}) { if (composer) { setError('Save and close the current composer before opening another.'); return; } setComposer(target); }
  function filter(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setCursor(''); setSelected(null); setChecked([]); setFilters(Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>); }
  function switchFolder(name: string) { setActive('mail'); setFolder(name); setCursor(''); setSelected(null); setChecked([]); }
  async function bulk(value: { read?: boolean; folder?: string }) {
    setBusy(true); setError('');
    const results = await Promise.allSettled(checked.map(id => mailApi(`threads/${id}`, jsonWrite('PATCH', value))));
    const failed = checked.filter((_, index) => results[index].status === 'rejected');
    setChecked(failed); setBusy(false); refresh();
    if (failed.length) setError(`${failed.length} conversation update(s) failed. They remain selected; refresh or retry.`);
  }
  const folderNames = ['inbox', 'sent', 'drafts', 'archive', 'spam', 'trash'] as const;
  const list = folder === 'drafts' ? drafts : threads;
  const folderLoading = active === 'mail' && (selected ? readingLoading : list.loading);
  const toolLoading = { mail: folderLoading, contacts: contacts.loading, settings: settings.loading, labels: labels.loading };
  return <div className="mail-app">
    <header className="mail-topbar"><div className="mail-title"><MailIcon name="mail" /><h1>Your inbox</h1></div>
      <form ref={searchForm} className="mail-filters" onSubmit={filter}>
        <div className="mail-search-row"><MailIcon name="search" /><input name="query" type="search" aria-label="Search" placeholder="Search correspondence" /><button type="submit" className="mail-icon-button" title="Apply filters" aria-label="Apply filters"><MailIcon name="next" /></button></div>
        <details className="mail-filter-more"><summary title="Participants, dates and status"><MailIcon name="settings" /><span className="sr-only">Participants, dates and status</span></summary><div className="mail-filter-popover"><h2>Search mail</h2><div className="mail-filter-grid">
        <label>From<input name="from" type="email" /></label><label>To<input name="to" type="email" /></label>
        <label>From date<input name="startDate" type="date" /></label><label>Through date<input name="endDate" type="date" /></label>
        <label>Read state<select name="read"><option value="">Any</option><option value="false">Unread</option><option value="true">Read</option></select></label>
        <label>Attachments<select name="hasAttachment"><option value="">Any</option><option value="true">With files</option><option value="false">Without files</option></select></label>
        <label>Label<select name="label" key={filters.label || ''} defaultValue={filters.label || ''}><option value="">Any label</option>{labels.value?.data.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></label></div><button type="submit">Search</button></div></details>
      </form><div className="mail-account"><details className="mail-account-menu" ref={accountMenu}>
        <summary aria-label="Account menu" title="Account menu"><ProfileAvatar name={profile.name} initials={profile.initials} className="mail-account-avatar" /><MailIcon name="next" /></summary>
        <div className="mail-account-dropdown"><p className="mail-account-email">{OWNER_EMAIL}</p>
          <nav className="mail-account-tools" aria-label="Mailbox tools">{(['mail','contacts','settings','labels'] as const).map(view => <button type="button" key={view} aria-pressed={active === view} onClick={() => openTool(view)}><MailIcon name={view} loading={active === view && toolLoading[view]} />{view[0].toUpperCase() + view.slice(1)}</button>)}</nav>
          <div className="mail-account-actions"><AppLink href="/dashboard"><MailIcon name="back" />Workspace</AppLink><AppLink href="/dashboard#profile-photo">Profile photo</AppLink></div>
          <LogoutButton />
        </div>
      </details></div>
    </header>
    <div className="mail-shell"><aside className="mail-sidebar">
      <button className="mail-compose-button" type="button" onClick={() => compose()}><MailIcon name="compose" />Compose</button>
      <nav className="mail-folders" aria-label="Mail folders">{folderNames.map(name => <button type="button" key={name} aria-label={name[0].toUpperCase() + name.slice(1)} aria-pressed={active === 'mail' && folder === name} aria-busy={folder === name && folderLoading} onClick={() => switchFolder(name)}><MailIcon name={name} loading={folder === name && folderLoading} /><span>{name[0].toUpperCase() + name.slice(1)}</span>{name === 'inbox' && !!summary.value?.unread && <small>{summary.value.unread}</small>}{name === 'drafts' && !!summary.value?.drafts && <small>{summary.value.drafts}</small>}</button>)}</nav>
      <p className="sr-only" role="status">{folderLoading ? `Loading ${folder}…` : ''}</p>
      <div className="mail-sidebar-labels">{labels.value?.data.map(label => <button type="button" key={label.id} aria-pressed={active === 'mail' && filters.label === label.id} onClick={() => { switchFolder(folder); setFilters(v => ({ ...v, label: v.label === label.id ? '' : label.id })); }}><span style={{ color: label.color }}><MailIcon name="labels" /></span>{label.name}</button>)}</div>
      <section className="inbox-card mail-summary" aria-label="Inbox summary">
        <MailAddress value={OWNER_EMAIL} label="owner email" />
        <p className="sr-only" role="status">{summary.loading ? 'Refreshing inbox summary…' : ''}</p>
        {summary.error && <p role="alert" className="error">{summary.stale ? 'Last known values; refresh failed. ' : 'Inbox unavailable. '}{summary.error}</p>}
        {summary.value && <p>{summary.value.unread} unread · {summary.value.drafts} drafts{summary.value.recent.length === 0 && <span className="sr-only">Your inbox is empty.</span>}{summary.value.mode === 'fixture' && <span className="mail-fixture-badge">Local test inbox</span>}</p>}
      </section>
    </aside><div className="mail-content">
    {error && <p role="alert" className="error mail-notice">{error}</p>}
    {active === 'mail' && <div className={`mail-layout ${selected ? 'mail-detail-open' : ''}`}>
      {selected ? <Conversation key={selected} id={selected} labels={labels.value?.data ?? []} onBack={() => setSelected(null)} compose={compose} mutate={mutate} onLoadingChange={setReadingLoading} /> : <section className="mail-list" aria-label="Conversation list" aria-busy={list.loading}>
        <div className="mail-list-toolbar"><div className="mail-toolbar-actions">{folder !== 'drafts' && <input className="mail-select" type="checkbox" aria-label="Select all conversations on this page" checked={!!threads.value?.data.length && threads.value.data.every(t => checked.includes(t.id))} onChange={event => setChecked(event.target.checked ? threads.value?.data.map(t => t.id) ?? [] : [])} />}<MailIconButton name="refresh" label="Refresh mail" onClick={refresh} disabled={busy} />{checked.length > 0 && <><MailIconButton name="archive" label="Archive selected conversations" disabled={busy} onClick={() => void bulk({ folder: 'archive' })} /><MailIconButton name="trash" label="Trash selected conversations" disabled={busy} onClick={() => void bulk({ folder: 'trash' })} /><MailIconButton name="mail" label="Mark selected conversations read" disabled={busy} onClick={() => void bulk({ read: true })} /><MailIconButton name="unread" label="Mark selected conversations unread" disabled={busy} onClick={() => void bulk({ read: false })} /></>}</div><span className="mail-page-count">{checked.length ? `${checked.length} selected` : `${list.value?.data.length ?? '—'} conversations`}</span><div className="mail-toolbar-actions">{(folder === 'drafts' ? draftCursor : cursor) && <MailIconButton name="previous" label={folder === 'drafts' ? 'First draft page' : 'First conversation page'} onClick={() => { setCursor(''); setDraftCursor(''); setChecked([]); }} />}{(folder === 'drafts' ? drafts.value?.has_more : threads.value?.has_more) && <MailIconButton name="next" label={folder === 'drafts' ? 'Next draft page' : 'Next conversation page'} onClick={() => { if (folder === 'drafts') setDraftCursor(drafts.value!.data.at(-1)!.id); else setCursor(threads.value!.data.at(-1)!.id); setChecked([]); }} />}</div></div>
        <div className="mail-list-heading"><h2>{folder[0].toUpperCase() + folder.slice(1)}</h2>{!!Object.values(filters).filter(Boolean).length && <button className="mail-text-button" type="button" onClick={() => { setFilters({}); setCursor(''); setChecked([]); searchForm.current?.reset(); }}>Clear filters</button>}<span>{list.stale ? 'Previous results' : 'Conversations'}</span></div>
        {list.error && <p role="alert" className="error mail-notice">{list.stale && 'Previous results; refresh failed. '}{list.error}</p>}
        {folder === 'drafts' ? <>{drafts.value?.data.map(d => <div className="mail-row" key={d.id}><MailIcon name="drafts" /><button type="button" className="mail-thread" onClick={() => void openDraft(d.id)}><span className="mail-participant"><span className="mail-draft-label">Draft</span> {d.to?.join(', ') || 'No recipients'}</span><span className="mail-row-subject">{d.subject || '(Untitled draft)'}</span><time dateTime={d.updated_at}>{mailDate(d.updated_at, true)}</time></button></div>)}{drafts.value && !drafts.value.data.length && <div className="mail-empty"><MailIcon name="drafts" /><h3>No drafts</h3><p>Messages you save will appear here.</p></div>}</> : <>
          {threads.value?.data.map(t => <div key={t.id} className={`mail-row ${!t.read ? 'unread' : ''} ${checked.includes(t.id) ? 'mail-row-checked' : ''}`}><input className="mail-select" type="checkbox" aria-label={`Select ${t.subject || 'conversation'}`} checked={checked.includes(t.id)} onChange={event => setChecked(v => event.target.checked ? [...v, t.id] : v.filter(id => id !== t.id))} /><button type="button" className={`mail-thread ${!t.read ? 'unread' : ''}`} onClick={() => { setSelected(t.id); void mutate(`threads/${t.id}`, 'PATCH', { read: true }); }}><span className="mail-participant">{folder === 'sent' ? `To: ${t.to.join(', ')}` : t.from}<small>{t.email_count > 1 ? t.email_count : ''}</small></span><span className="mail-row-subject">{t.labels.map(l => <span className="mail-label-chip" key={l.id}>{l.name}</span>)}{t.subject || '(No subject)'}{t.has_attachment && <MailIcon name="attachment" />}</span><time title={t.received_at} dateTime={t.received_at}>{mailDate(t.received_at, true)}</time></button><div className="mail-row-actions"><MailIconButton name="archive" label={`Archive ${t.subject || 'conversation'}`} onClick={() => void mutate(`threads/${t.id}`, 'PATCH', { folder: 'archive' })} /><MailIconButton name={t.read ? 'unread' : 'mail'} label={`${t.read ? 'Mark unread' : 'Mark read'}: ${t.subject || 'conversation'}`} onClick={() => void mutate(`threads/${t.id}`, 'PATCH', { read: !t.read })} /></div></div>)}
          {threads.value && !threads.value.data.length && <div className="mail-empty"><MailIcon name="inbox" /><h3>You're all caught up</h3><p>No conversations match this view.</p></div>}
        </>}
      </section>}
    </div>}
    {active === 'labels' && <section className="panel"><h2>Inbox labels</h2>{labels.error && <p role="alert">{labels.error}</p>}
      <form key={editingLabel?.id ?? 'new'} onSubmit={async e => { e.preventDefault(); const v = new FormData(e.currentTarget); if (await mutate(`labels${editingLabel ? `/${editingLabel.id}` : ''}`, editingLabel ? 'PATCH' : 'POST', { name: v.get('name'), color: v.get('color') })) setEditingLabel(null); }}><div className="mail-two"><label>Label name<input name="name" required maxLength={100} defaultValue={editingLabel?.name ?? ''} /></label><label>Color<input name="color" type="color" defaultValue={editingLabel?.color ?? '#7355cc'} /></label></div><button type="submit">{editingLabel ? 'Save label' : 'Create label'}</button>{editingLabel && <button type="button" onClick={() => setEditingLabel(null)}>Cancel edit</button>}</form>
      <ul>{labels.value?.data.map(l => <li key={l.id}><span style={{ color: l.color }}>●</span> {l.name} <button type="button" onClick={() => setEditingLabel(l)}>Edit {l.name}</button><button type="button" onClick={() => void mutate(`labels/${l.id}`, 'DELETE')}>Delete {l.name}</button></li>)}</ul>
    </section>}
    {active === 'contacts' && <section className="panel"><h2>Resend account contacts</h2><p>Contacts belong to the entire Resend account. Deleting one affects that account; deleting mail never deletes contacts. New contacts are created unsubscribed. Ordinary correspondence leaves existing subscriptions unchanged.</p>{contacts.error && <p role="alert">{contacts.error}</p>}
      <form key={editingContact?.id ?? 'new'} onSubmit={async e => { e.preventDefault(); const form = e.currentTarget, v = new FormData(form); if (await mutate(`contacts${editingContact ? `/${editingContact.id}` : ''}`, editingContact ? 'PATCH' : 'POST', Object.fromEntries(v))) { setEditingContact(null); form.reset(); } }}><div className="mail-two"><label>First name<input name="firstName" maxLength={100} defaultValue={editingContact?.first_name ?? ''} /></label><label>Last name<input name="lastName" maxLength={100} defaultValue={editingContact?.last_name ?? ''} /></label></div><label>Email<input name="email" type="email" required readOnly={!!editingContact} defaultValue={editingContact?.email ?? ''} /></label>{editingContact && <p>Email changes are unsupported by Resend; add a separate contact explicitly.</p>}<button type="submit">{editingContact ? 'Save contact' : 'Add contact'}</button>{editingContact && <button type="button" onClick={() => setEditingContact(null)}>Cancel edit</button>}</form>
      <ul>{contacts.value?.data.map(c => <li key={c.id}>{c.first_name} {c.last_name} · <MailAddress value={c.email} /> <button type="button" onClick={() => compose({ initial: { to: [c.email] } })}>Write to {c.email}</button><button type="button" onClick={() => setEditingContact(c)}>Edit {c.email}</button><button type="button" onClick={() => void mutate(`contacts/${c.id}`, 'DELETE')}>Delete account contact {c.email}</button></li>)}</ul>
      {contacts.value?.has_more && <button type="button" onClick={() => setContactCursor(contacts.value!.data.at(-1)!.id)}>Next contacts page</button>}{contactCursor && <button type="button" onClick={() => setContactCursor('')}>First contacts page</button>}
    </section>}
    {active === 'settings' && <section className="panel"><h2>Inbox settings</h2>{settings.error && <p role="alert">{settings.error} Unsupported provider settings remain unavailable until the backend supports them.</p>}{settings.value && <SettingsForm initial={settings.value} save={value => mutate('settings', 'PUT', value)} />}</section>}
    </div></div>
    {composer && <MailComposer key={composer.draft?.id ?? `${composer.threadId}-${composer.action}`} target={composer} profile={profile} contacts={contacts.value?.data ?? []} onClose={() => { setComposer(null); refresh(); }} onSent={refresh} />}
  </div>;
}
function mailDate(value: string, timeToday = false) { const date = new Date(value); if (Number.isNaN(date.getTime())) return ''; return timeToday && date.toDateString() === new Date().toDateString() ? date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
function Conversation({ id, labels, onBack, compose, mutate, onLoadingChange }: { id: string; labels: Label[]; onBack: () => void; compose: (target: ComposerTarget) => void; mutate: (path: string, method: string, value?: unknown) => Promise<boolean>; onLoadingChange: (loading: boolean) => void }) {
  const [cursor, setCursor] = useState('');
  const thread = useMail<Thread>(`threads/${id}`);
  const messages = useMail<Page<Message>>(`threads/${id}/messages${cursor ? `?after=${cursor}` : ''}`);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, [id]);
  const loading = thread.loading || messages.loading;
  useEffect(() => { onLoadingChange(loading); return () => onLoadingChange(false); }, [loading, onLoadingChange]);
  async function change(value: unknown) { if (await mutate(`threads/${id}`, 'PATCH', value)) { thread.refresh(); messages.refresh(); } }
  return <section className="panel mail-reader" aria-label="Conversation" aria-busy={loading}>
    <div className="mail-conversation-toolbar"><MailIconButton name="back" label="Back to conversations" onClick={onBack} /><span>Conversation</span></div><div className="mail-subject-heading"><h2 tabIndex={-1} ref={heading}>{thread.value?.subject || 'Conversation'}</h2>{thread.value?.subject && <CopyMail value={thread.value.subject} label="subject" />}</div>
    <div className="mail-actions"><button type="button" onClick={() => void change({ read: !thread.value?.read })}><MailIcon name={thread.value?.read ? 'unread' : 'mail'} />{thread.value?.read ? 'Mark unread' : 'Mark read'}</button>{['inbox','archive','spam','trash'].map(folder => <button type="button" key={folder} onClick={() => void change({ folder })}><MailIcon name={folder as MailIconName} />{folder === 'inbox' ? 'Restore to Inbox' : `Move to ${folder}`}</button>)}</div>
    <details className="mail-thread-labels"><summary><MailIcon name="labels" />Conversation labels</summary><fieldset><legend className="sr-only">Conversation labels</legend>{labels.length ? labels.map(l => <label className="mail-checkbox" key={l.id}><input type="checkbox" checked={!!thread.value?.labels.some(x => x.id === l.id)} onChange={async e => { const current = thread.value?.labels.map(l => l.id) ?? []; if (await mutate(`threads/${id}/labels`, 'PUT', { labels: e.target.checked ? [...current, l.id] : current.filter(x => x !== l.id) })) thread.refresh(); }} />{l.name}</label>) : <p>Create labels in the Labels tab.</p>}</fieldset></details>
    {(thread.error || messages.error) && <p role="alert" className="error">{thread.error || messages.error}</p>}
    {messages.value?.data.slice().sort((a,b) => a.received_at.localeCompare(b.received_at)).map(message => <MessageReader key={message.id} threadId={id} message={message} compose={compose} />)}
    {messages.value?.has_more && <button type="button" onClick={() => setCursor(messages.value!.data.at(-1)!.id)}>Next messages page</button>}{cursor && <button type="button" onClick={() => setCursor('')}>First messages page</button>}
  </section>;
}
function MessageReader({ threadId, message, compose }: { threadId: string; message: Message; compose: (target: ComposerTarget) => void }) {
  const [html, setHtml] = useState(false), [images, setImages] = useState(false);
  const detailPath = `threads/${threadId}/messages/${message.id}`;
  const detail = useMail<Message & { document: string | null }>(detailPath, false);
  const remoteDetail = useMail<Message & { document: string | null }>(`${detailPath}?remoteImages=true`, false, images);
  const document = (images && remoteDetail.value?.document) || detail.value?.document;
  function response(action: 'reply' | 'reply-all' | 'forward') {
    const targets = message.direction === 'outbound' && message.from.toLowerCase().includes(OWNER_EMAIL) ? message.to : message.reply_to.length ? message.reply_to : [message.from];
    const to = action === 'forward' ? [] : [...new Set([...targets, ...(action === 'reply-all' ? [...message.to, ...message.cc] : [])])].filter(a => a.toLowerCase() !== OWNER_EMAIL);
    compose({ threadId, emailId: message.id, action, initial: { to, subject: `${action === 'forward' ? 'Fwd: ' : 'Re: '}${message.subject ?? ''}`, text: action === 'forward' ? `\n\nForwarded message\nFrom: ${message.from}\n${message.text ?? ''}` : '' } });
  }
  return <article className="mail-message"><header className="mail-message-header">{message.direction === 'outbound' || (message.from.match(/<([^>]+)>/)?.[1] ?? message.from).trim().toLowerCase() === OWNER_EMAIL.toLowerCase() ? <ProfileAvatar name="Your account" initials="" className="mail-message-avatar" /> : <span className="mail-message-avatar">{message.from.replace(/^["<]+/, '').slice(0, 1).toUpperCase()}</span>}<div className="mail-message-meta"><h3><MailAddress value={message.from} label="sender email" /></h3><div className="mail-message-recipients">To {message.to.map(address => <MailAddress key={address} value={address} label="recipient email" />)}{message.cc.length > 0 && <span>CC {message.cc.map(address => <MailAddress key={address} value={address} label="CC email" />)}</span>}</div></div><time title={message.received_at} dateTime={message.received_at}>{mailDate(message.received_at)}<span>{new Date(message.received_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span></time><span className="mail-direction">{message.direction === 'inbound' ? 'Received' : 'Sent'}</span></header>
    <div className="mail-message-body">
    {(detail.error || (images && remoteDetail.error)) && <p role="alert" className="error">{detail.error || remoteDetail.error}</p>}
    {document && <div className="mail-actions"><button type="button" aria-pressed={html} onClick={() => setHtml(v => !v)}>{html ? 'Read plain text' : 'Read sanitized HTML'}</button>{html && <button type="button" disabled={images && !remoteDetail.error} onClick={() => { setImages(true); if (remoteDetail.error) remoteDetail.refresh(); }}>Load remote images</button>}</div>}
    {html && document ? <iframe title={`Email: ${message.subject ?? 'Message'}`} sandbox="allow-popups allow-popups-to-escape-sandbox" referrerPolicy="no-referrer" srcDoc={document} /> : <pre className="mail-text">{message.text || 'No plain-text version. Use the sanitized HTML view if available.'}</pre>}
    {message.attachments.length > 0 && <ul>{message.attachments.map(a => <li key={a.id}><a href={`/api/inbox/threads/${threadId}/messages/${message.id}/attachments/${a.id}`} download>{a.filename || 'Attachment'}{a.size != null && ` (${a.size} bytes)`}</a></li>)}</ul>}
    <div className="mail-actions">{(['reply','reply-all','forward'] as const).map(action => <button type="button" key={action} onClick={() => response(action)}><MailIcon name={action === 'forward' ? 'forward' : 'reply'} />{action === 'reply-all' ? 'Reply all' : action === 'reply' ? 'Reply' : 'Forward'}</button>)}</div>
    </div>
  </article>;
}
function SettingsForm({ initial, save }: { initial: Settings; save: (value: Settings) => Promise<boolean> }) {
  const [notice, setNotice] = useState('');
  return <form onSubmit={async e => { e.preventDefault(); const v = new FormData(e.currentTarget); const value: Settings = { name: String(v.get('name')), fromName: String(v.get('fromName')), agent: { object: 'inbox_agent', instructions: String(v.get('instructions')), tone: (v.get('tone') || null) as Agent['tone'], actions: v.getAll('actions') as Agent['actions'] } }; setNotice('Saving…'); setNotice(await save(value) ? 'Settings saved.' : 'Settings save failed. Some inbox fields may have saved; refresh to inspect the provider state.'); }}>
    <label>Inbox name<input name="name" defaultValue={initial.name} required /></label><label>From display name<input name="fromName" defaultValue={initial.fromName} required /></label>
    <h3>Provider agent</h3><p>Autonomous actions start disabled when provisioned. Only explicitly saving checked actions enables provider behavior. The application does not automatically send mail.</p>
    <label>Instructions<textarea aria-label="Instructions" name="instructions" rows={4} maxLength={8000} defaultValue={initial.agent.instructions ?? ''} /></label><label>Tone<select name="tone" defaultValue={initial.agent.tone ?? ''}><option value="">No preset</option>{['concise_professional','concise_casual','expanded_professional','expanded_casual'].map(t => <option key={t} value={t}>{t.replaceAll('_', ' ')}</option>)}</select></label>
    <fieldset><legend>Allowed autonomous actions — explicit save required</legend>{['draft_reply','forward_thread','add_labels','assign_thread','mark_as_spam','archive','move_to_trash'].map(action => <label className="mail-checkbox" key={action}><input name="actions" type="checkbox" value={action} defaultChecked={initial.agent.actions.includes(action as Agent['actions'][number])} />{action.replaceAll('_', ' ')}</label>)}</fieldset>
    <p>Custom tones, inbox address changes, and contact email edits are unsupported here.</p><button type="submit">Save settings</button><p role="status">{notice}</p>
  </form>;
}
