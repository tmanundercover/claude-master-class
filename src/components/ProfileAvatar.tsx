import { useEffect, useState } from 'react';
import { sitePath } from '../lib/site-path';

export default function ProfileAvatar({ name, initials, className = '' }: { name: string; initials: string; className?: string }) {
  const [src, setSrc] = useState(import.meta.env.MODE === 'pages' ? sitePath('/profile-photo.jpg') : '/api/profile-photo');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    function updated(event: Event) { setSrc((event as CustomEvent<{ url: string }>).detail.url); setFailed(false); }
    window.addEventListener('profile-photo-updated', updated);
    return () => window.removeEventListener('profile-photo-updated', updated);
  }, []);
  return failed ? <span className={`profile-avatar ${className}`} aria-label={name}>{initials}</span>
    : <img className={`profile-avatar ${className}`} src={src} alt={name} onError={() => setFailed(true)} />;
}
