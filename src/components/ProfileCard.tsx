import { useState } from 'react';
import ProfileAvatar from './ProfileAvatar';

export default function ProfileCard({ name, initials, yearsInSoftware }: { name: string; initials: string; yearsInSoftware: number }) {
  const [expanded, setExpanded] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(false);
  const showingPhoto = expanded && hasPhoto;

  return <div className={`identity-card${showingPhoto ? ' identity-card--photo' : ''}`} onPointerEnter={event => {
    if (event.pointerType === 'mouse' || event.pointerType === 'pen') setExpanded(true);
  }} onPointerLeave={event => {
    if (event.pointerType === 'mouse' || event.pointerType === 'pen') setExpanded(false);
  }}>
    <div className="identity-photo-frame">
      <ProfileAvatar name={name} initials={initials} className="avatar" onPhotoAvailableChange={setHasPhoto} />
    </div>
    <div className="identity-photo-space" aria-hidden="true" />
    <div className="identity-card-copy">
      <h2>{name}</h2>
      <p>Fullstack engineering. AI systems. Product delivery.</p>
      <span className="badge">{yearsInSoftware}+ years in software · Since 2004</span>
    </div>
    <button type="button" className="identity-card-trigger" disabled={!hasPhoto}
      aria-label={`${showingPhoto ? 'Restore profile card' : 'Expand profile photo'}: ${name}`} aria-expanded={showingPhoto}
      onFocus={event => { if (event.currentTarget.matches(':focus-visible')) setExpanded(true); }}
      onBlur={() => setExpanded(false)} onClick={() => setExpanded(current => !current)}
      onKeyDown={event => { if (event.key === 'Escape') { setExpanded(false); event.currentTarget.blur(); } }} />
  </div>;
}
