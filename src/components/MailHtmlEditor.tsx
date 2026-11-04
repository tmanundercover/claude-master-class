import { useMemo, useState } from 'react';
import type { PublicProfile } from '../app-types';
import { previewEmailDocument, resumeMailTemplate } from '../lib/mail-templates';
import { previewEmailIcons } from '../lib/mail-icons';
import { MailIcon } from './MailUI';

export default function MailHtmlEditor({ profile, html, onEdit, onApply }: { profile: PublicProfile; html: string; onEdit: (html: string) => void; onApply: (template: ReturnType<typeof resumeMailTemplate>) => void }) {
  const templates = useMemo(() => [resumeMailTemplate(profile)], [profile]);
  const [selected, setSelected] = useState('resume');
  const [tab, setTab] = useState<'preview' | 'source'>('preview');
  const [preview, setPreview] = useState<'template' | 'message'>(html ? 'message' : 'template');
  const [hasMessageCopy, setHasMessageCopy] = useState(!!html);
  const [notice, setNotice] = useState('');
  const template = templates.find(t => t.id === selected)!;
  function editHtml() {
    if (preview === 'template' && !hasMessageCopy && !html) {
      onApply(template);
      setHasMessageCopy(true);
      setNotice('Template copied to this email. Your edits only change this draft.');
    }
    setTab('source');
    setPreview('message');
  }
  return <details className="mail-html-section"><summary><MailIcon name="template" /> HTML &amp; templates <span>Preview, select, and edit</span></summary>
    <div className="mail-template-tools"><label>Email template<select aria-label="Email template" value={selected} onChange={event => { setSelected(event.target.value); setPreview('template'); setTab('preview'); setNotice(''); }}>{templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label><button type="button" className="mail-secondary" onClick={() => { setPreview('template'); setTab('preview'); }}>Preview template</button><button type="button" onClick={() => { onApply(template); setHasMessageCopy(true); setPreview('message'); setTab('preview'); setNotice('Template applied. Subject, plain text, and HTML replaced; recipients and attachments kept.'); }}>Use template</button></div>
    <p className="mail-template-description">{template.description} Edit HTML customizes this email without changing the template. “Use template” replaces the subject and both message versions. No PDF is attached.</p>
    <div className="mail-preview-toolbar"><div className="mail-segmented" aria-label="HTML editor view"><button type="button" aria-pressed={tab === 'preview'} onClick={() => setTab('preview')}>Preview</button><button type="button" aria-pressed={tab === 'source'} onClick={editHtml}>Edit HTML</button></div>{tab === 'preview' && <select aria-label="Preview content" value={preview} onChange={event => setPreview(event.target.value as 'template' | 'message')}><option value="template">Selected template</option><option value="message">Current message</option></select>}</div>
    {tab === 'preview' ? <iframe title="HTML email preview" sandbox="" referrerPolicy="no-referrer" srcDoc={previewEmailDocument(previewEmailIcons(preview === 'template' ? template.html : html || '<p style="font-family:Arial;padding:24px">No HTML in this message yet. Choose a template or edit the HTML.</p>'))} /> : <label className="mail-html-source">HTML message<textarea aria-label="HTML message" rows={10} spellCheck={false} value={html} onChange={event => { setHasMessageCopy(true); onEdit(event.target.value); }} /></label>}
    {notice && <p className="mail-template-notice" role="status">{notice}</p>}
  </details>;
}
