import AppLink from './AppLink';
import { MailAddress, MailIcon, MailIconButton } from './MailUI';
import { useMail } from '../lib/mail-client';
import type { Summary } from '../lib/mail-types';
export default function InboxCard({ compact = false }: { compact?: boolean }) {
  const { value, loading, error, stale, refresh } = useMail<Summary>('summary');
  return <section className="mail-app mail-content inbox-card dashboard-inbox" aria-label="Inbox summary">
    <div className="mail-list-toolbar dashboard-inbox-heading"><div className="mail-title"><MailIcon name="mail" /><h2>{compact ? 'Mail overview' : <AppLink href="/dashboard/inbox">Your inbox</AppLink>}</h2></div><div className="mail-toolbar-actions"><MailIconButton name="refresh" label="Refresh inbox" onClick={refresh} disabled={loading} loading={loading} /><AppLink className="dashboard-inbox-open" href="/dashboard/inbox">Open inbox <MailIcon name="next" /></AppLink></div></div>
    <p role="status" className="sr-only">{loading ? 'Loading inbox…' : ''}</p>
    {error && <p role="alert" className="error mail-notice">{stale ? 'Last known values; refresh failed. ' : 'Inbox unavailable. '}{error}</p>}
    {value && <><div className="dashboard-inbox-overview"><MailAddress value={value.email_address} label="owner email" />{value.mode === 'fixture' && <span className="mail-fixture-badge">Local test inbox</span>}
      <dl className="mail-stats"><div><dt><MailIcon name="unread" />Unread conversations</dt><dd>{value.unread}</dd></div><div><dt><MailIcon name="drafts" />Unsent drafts</dt><dd>{value.drafts}</dd></div><div><dt>Last received</dt><dd>{value.last_received ? <time dateTime={value.last_received}>{new Date(value.last_received).toLocaleString()}</time> : 'No mail received yet'}</dd></div></dl></div>
      {value.recent.length ? !compact && <><div className="mail-list-heading"><h3>Recent conversations</h3></div><ul className="mail-recent">{value.recent.map(thread => <li className={`mail-row ${!thread.read ? 'unread' : ''}`} key={thread.id}><AppLink className={`mail-thread ${!thread.read ? 'unread' : ''}`} href={`/dashboard/inbox?thread=${encodeURIComponent(thread.id)}`}><span className="mail-participant">{thread.from}<small>{thread.email_count > 1 ? thread.email_count : ''}</small></span><span className="mail-row-subject">{thread.subject || '(No subject)'}{thread.has_attachment && <MailIcon name="attachment" />}</span><time dateTime={thread.received_at} title={new Date(thread.received_at).toLocaleString()}>{new Date(thread.received_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</time></AppLink></li>)}</ul></> : <div className="mail-empty"><MailIcon name="inbox" /><p>Your inbox is empty.</p></div>}
    </>}
  </section>;
}
