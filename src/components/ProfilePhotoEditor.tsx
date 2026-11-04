import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import ProfileAvatar from './ProfileAvatar';

interface PhotoSettings { revision: string; url: string; updatedAt: string | null }
async function settings() {
  const response = await fetch('/api/profile-photo/settings', { cache: 'no-store' }); const value = await response.json();
  if (!response.ok) throw new Error(value.error || 'Your saved photo could not be loaded.');
  return value as PhotoSettings;
}
export default function ProfilePhotoEditor({ name, initials }: { name: string; initials: string }) {
  const [saved, setSaved] = useState<PhotoSettings | null>(null); const [photo, setPhoto] = useState<Blob | null>(null); const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  useEffect(() => { let active = true; void settings().then(value => { if (active) setSaved(value); }).catch(error => { if (active) setError(error.message); }); return () => { active = false; }; }, []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; setError(''); setNotice(''); setPhoto(null); setPreview(''); if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) { setError('Choose a JPEG, PNG or WebP photo up to 5 MB.'); return; }
    setBusy(true);
    try {
      const bitmap = await createImageBitmap(file);
      try {
        const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height)); const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const context = canvas.getContext('2d'); if (!context) throw new Error('This browser could not prepare your photo.');
        context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        const prepared = await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Your photo could not be prepared.')), 'image/jpeg', 0.9));
        if (prepared.size > 2 * 1024 * 1024) throw new Error('Choose a smaller photo.');
        setPhoto(prepared); setPreview(URL.createObjectURL(prepared));
      } finally { bitmap.close(); }
    } catch (error) { setError(error instanceof Error ? error.message : 'Your photo could not be opened.'); }
    finally { setBusy(false); }
  }
  async function save(event: FormEvent) {
    event.preventDefault(); if (!photo || !saved) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/profile-photo', { method: 'POST', headers: { 'Content-Type': 'image/jpeg', 'If-Match': `"${saved.revision}"` }, body: photo }); const value = await response.json();
      if (!response.ok) throw new Error(value.error || 'Your photo could not be saved.');
      setSaved(value); setPhoto(null); setPreview(''); setNotice('Profile photo saved.'); window.dispatchEvent(new CustomEvent('profile-photo-updated', { detail: value }));
    } catch (error) { setError(error instanceof Error ? error.message : 'Your photo could not be saved.'); }
    finally { setBusy(false); }
  }
  async function reload() {
    try { setError(''); const value = await settings(); setSaved(value); setPhoto(null); setPreview(''); window.dispatchEvent(new CustomEvent('profile-photo-updated', { detail: value })); }
    catch (error) { setError(error instanceof Error ? error.message : 'Your photo could not be loaded.'); }
  }
  return <section id="profile-photo" className="panel profile-photo-editor" aria-labelledby="profile-photo-heading">
    <div>{preview ? <img className="profile-avatar profile-photo-preview" src={preview} alt="Selected portrait preview" /> : <ProfileAvatar name={name} initials={initials} className="profile-photo-preview" />}</div>
    <div><h2 id="profile-photo-heading">Profile photo</h2><p>Your photo appears on your public portfolio and your account avatars.</p>
      <form onSubmit={save}><label htmlFor="profile-photo-file">Choose a photo<input id="profile-photo-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => void choose(event)} disabled={busy} /></label>
        <p className="muted">JPEG, PNG or WebP, up to 5 MB.</p><button disabled={!photo || !saved || busy}>{busy ? photo ? 'Saving photo…' : 'Preparing photo…' : 'Save profile photo'}</button></form>
      {notice && <p className="success" role="status">{notice}</p>}{error && <><p className="error" role="alert">{error}</p><button className="secondary" onClick={() => void reload()} disabled={busy}>Reload saved photo</button></>}
    </div>
  </section>;
}
