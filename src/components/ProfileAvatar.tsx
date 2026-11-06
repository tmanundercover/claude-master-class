import { useEffect, useRef, useState } from 'react';
import { sitePath } from '../lib/site-path';

export default function ProfileAvatar({ name, initials, className = '', onPhotoAvailableChange }: { name: string; initials: string; className?: string; onPhotoAvailableChange?: (available: boolean) => void }) {
  const [src, setSrc] = useState(import.meta.env.MODE === 'pages' ? sitePath('/profile-photo.jpg') : '/api/profile-photo');
  const [failed, setFailed] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const image = imageRef.current;
    if (!image?.complete) return;
    const available = image.naturalWidth > 0;
    onPhotoAvailableChange?.(available);
    if (!available) setFailed(true);
  }, [src, failed, onPhotoAvailableChange]);
  useEffect(() => {
    function updated(event: Event) { setSrc((event as CustomEvent<{ url: string }>).detail.url); setFailed(false); onPhotoAvailableChange?.(false); }
    window.addEventListener('profile-photo-updated', updated);
    return () => window.removeEventListener('profile-photo-updated', updated);
  }, [onPhotoAvailableChange]);
  return failed ? <span className={`profile-avatar ${className}`} aria-label={name}>{initials}</span>
    : <img ref={imageRef} className={`profile-avatar ${className}`} src={src} alt={name} onLoad={() => onPhotoAvailableChange?.(true)} onError={() => { setFailed(true); onPhotoAvailableChange?.(false); }} />;
}
