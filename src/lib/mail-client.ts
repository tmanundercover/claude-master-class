import { useCallback, useEffect, useRef, useState } from 'react';
export class MailClientError extends Error {
  code: string; status: number; retryAfter: number;
  constructor(message: string, code: string, status: number, retryAfter: number) { super(message); this.code = code; this.status = status; this.retryAfter = retryAfter; }
}
export async function mailApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/inbox/${path}`, { ...options, cache: 'no-store', headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers } });
  const value = await response.json();
  if (!response.ok) throw new MailClientError(value.error || 'Mail request failed.', value.code ?? 'request', response.status, Number(response.headers.get('retry-after')) || 15);
  return value as T;
}
export function useMail<T>(path: string, polling = true, enabled = true) {
  const [state, setState] = useState<{ path: string; value?: T; loading: boolean; error: string; stale: boolean }>({ path, loading: true, error: '', stale: false });
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision(v => v + 1), []);
  const backoff = useRef({ path, until: 0 });
  useEffect(() => {
    if (!enabled) return;
    let controller: AbortController | undefined, current = true;
    const load = () => {
      if (document.hidden || (backoff.current.path === path && Date.now() < backoff.current.until)) return;
      controller?.abort(); controller = new AbortController();
      const signal = controller.signal;
      setState(previous => ({ ...(previous.path === path ? previous : { path, stale: false }), loading: true, error: '' }));
      mailApi<T>(path, { signal }).then(value => {
        if (current && !signal.aborted) setState({ path, value, loading: false, error: '', stale: false });
      }).catch(error => {
        if (!current || signal.aborted || error.name === 'AbortError') return;
        backoff.current = { path, until: Date.now() + Math.max(15, error instanceof MailClientError ? error.retryAfter : 15) * 1000 };
        setState(previous => ({ ...(previous.path === path ? previous : { path }), loading: false, error: error.message, stale: previous.path === path && !!previous.value }));
      });
    };
    load();
    const focus = () => { if (!document.hidden) load(); else controller?.abort(); };
    window.addEventListener('focus', focus); document.addEventListener('visibilitychange', focus); window.addEventListener('mail-mutation', load);
    const interval = polling ? window.setInterval(load, 15000) : undefined;
    return () => { current = false; controller?.abort(); window.removeEventListener('focus', focus); document.removeEventListener('visibilitychange', focus); window.removeEventListener('mail-mutation', load); clearInterval(interval); };
  }, [path, polling, revision, enabled]);
  // Effects run after rendering: gate data here so the old folder cannot paint
  // under the new heading, even for the first frame after navigation.
  return { ...(state.path === path ? state : { loading: true, error: '', stale: false, value: undefined }), refresh };
}
export const jsonWrite = (method: string, value?: unknown): RequestInit => ({ method, ...(value === undefined ? {} : { body: JSON.stringify(value) }) });
