import { useState, type ReactNode } from 'react';

const paths = {
  inbox: 'M3 13h5l2 3h4l2-3h5M5 4h14l2 9v7H3v-7Z',
  sent: 'm3 3 19 9-19 9 4-9Zm4 9h15',
  archive: 'M3 3h18v5H3Zm2 5v13h14V8m-10 4h6',
  spam: 'm8 3-5 5v8l5 5h8l5-5V8l-5-5ZM12 7v6m0 4h.01',
  trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7',
  drafts: 'M5 3h10l4 4v14H5Zm9 0v5h5M8 12h8m-8 4h6',
  search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  refresh: 'M20 7V3m0 4h-4M4 17v4m0-4h4M5 7a8 8 0 0 1 14-2l1 2M4 17l1 2a8 8 0 0 0 14-2',
  compose: 'm15 4 5 5M4 20l5-1L21 7l-5-5L4 14Z',
  contacts: 'M16 21v-3a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v3m16-7a4 4 0 0 1 4 4v3M13 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0m4-3a4 4 0 0 1 0 8',
  settings: 'M4 7h16M4 17h16M8 4v6m8 4v6',
  labels: 'M3 3h9l9 9-9 9-9-9ZM7 7h.01',
  copy: 'M9 9h12v12H9ZM15 5V3H3v12h2',
  check: 'm5 12 4 4L19 6',
  close: 'm6 6 12 12M6 18 18 6',
  back: 'm12 5-7 7 7 7M5 12h16',
  next: 'm9 5 7 7-7 7',
  previous: 'm15 5-7 7 7 7',
  mail: 'M3 5h18v14H3Zm0 0 9 8 9-8',
  unread: 'M3 8v11h18V8M3 8l9-6 9 6-9 7Z',
  attachment: 'm8 13 7-7a3 3 0 0 1 4 4l-9 9a5 5 0 0 1-7-7l9-9a2 2 0 0 1 7 7l-8 8a2 2 0 0 1-3-3l7-7',
  reply: 'm9 5-7 6 7 6M2 11h12a7 7 0 0 1 7 7',
  forward: 'm15 5 7 6-7 6m7-6H10a7 7 0 0 0-7 7',
  expand: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',
  template: 'M3 3h18v18H3ZM3 9h18M9 9v12',
} as const;
export type MailIconName = keyof typeof paths;
export function MailIcon({ name, loading = false }: { name: MailIconName; loading?: boolean }) {
  return <svg className={`mail-icon${loading ? ' mail-icon-loading' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{loading && <circle cx="12" cy="12" r="9" opacity=".2" />}<path d={loading ? 'M12 3a9 9 0 0 1 9 9' : paths[name]} /></svg>;
}
export function MailIconButton({ name, label, onClick, disabled, loading }: { name: MailIconName; label: string; onClick: () => void; disabled?: boolean; loading?: boolean }) {
  return <button type="button" className="mail-icon-button" title={label} aria-label={label} aria-busy={loading} onClick={onClick} disabled={disabled}><MailIcon name={name} loading={loading} /></button>;
}
export function CopyMail({ value, label }: { value: string; label: string }) {
  const [notice, setNotice] = useState('');
  return <span className="mail-copy"><MailIconButton name={notice.startsWith('Copied') ? 'check' : 'copy'} label={`Copy ${label}`} onClick={() => { void navigator.clipboard.writeText(value).then(() => setNotice(`Copied ${label}`)).catch(() => setNotice(`Could not copy ${label}. Select the text to copy it manually.`)); }} /><span className={notice.startsWith('Could not') ? 'mail-copy-error' : 'sr-only'} role="status">{notice}</span></span>;
}
export function MailAddress({ value, label = 'email address' }: { value: string; label?: string }) {
  const email = value.match(/<([^>]+)>/)?.[1] ?? value;
  return <span className="mail-address"><span>{value}</span><CopyMail value={email} label={label} /></span>;
}
export function MailAction({ icon, children, onClick }: { icon: MailIconName; children: ReactNode; onClick: () => void }) {
  return <button type="button" className="mail-secondary" onClick={onClick}><MailIcon name={icon} />{children}</button>;
}
