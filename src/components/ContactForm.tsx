import { useRef, useState, type FormEvent } from 'react';
export default function ContactForm({ candidateName }: { candidateName: string }) {
  const [notice, setNotice] = useState('');
  const [sending, setSending] = useState(false);
  const attempt = useRef<{ id: string; payload: string } | null>(null);
  const staticOnly = import.meta.env.MODE === 'pages';
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (sending || staticOnly) return;
    const form = event.currentTarget, fields = new FormData(form);
    const value = { name: fields.get('name'), email: fields.get('email'), message: fields.get('message'), website: fields.get('website') };
    const payload = JSON.stringify(value);
    if (!attempt.current || attempt.current.payload !== payload) attempt.current = { id: crypto.randomUUID(), payload };
    setSending(true); setNotice(`Sending your response to ${candidateName}…`);
    try {
      const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...value, attempt: attempt.current.id }), signal: AbortSignal.timeout(20000) });
      const result = await response.json();
      if (!response.ok) {
        setNotice(response.status === 429 ? 'Please give it a moment, then try sending your response again.' : result.code === 'uncertain' ? `We couldn’t confirm your response was sent to ${candidateName}. Your message is still here; please try again.` : `We couldn’t send your response to ${candidateName}. Your message is still here; please try again.`);
        return;
      }
      setNotice(result.localTest ? `Your response was recorded for ${candidateName}.` : `Your response was recorded and shared with ${candidateName}. He’ll also receive an email.`);
      form.reset(); attempt.current = null;
    } catch { setNotice(`We couldn’t confirm your response was sent to ${candidateName}. Your message is still here; please try again.`); }
    finally { setSending(false); }
  }
  return <form className="contact-form" method="post" action="/api/contact" onSubmit={submit}>
    <div className="contact-form-heading"><h3>Send a message</h3><span>{staticOnly ? 'Backend required' : 'Get in touch'}</span></div>
    <fieldset disabled={sending || staticOnly}>
      <div className="contact-form-row"><label>Name<input name="name" autoComplete="name" maxLength={100} required /></label><label>Email<input name="email" type="email" autoComplete="email" maxLength={254} required /></label></div>
      <label>What would you like to discuss?<textarea name="message" rows={5} maxLength={8000} required /></label>
      <label className="contact-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" defaultValue="" /></label>
      <div className="contact-form-footer"><button type="submit">{sending ? 'Sending…' : 'Send message'}</button><p className="muted">{staticOnly ? 'Message delivery is unavailable on this static site. Use the email link to get in touch.' : 'Your email is only used to reply to your message.'}</p></div>
    </fieldset><p className="contact-form-notice" role="status" aria-live="polite">{notice}</p>
  </form>;
}
