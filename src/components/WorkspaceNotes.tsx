import { useEffect, useRef, useState } from 'react';
import { jobRequest } from '../lib/job-client';
import type { Notes } from '../lib/job-contracts';
function noteId(prompt: string) { let value = 2166136261; for (const char of prompt) value = Math.imul(value ^ char.charCodeAt(0), 16777619); return `note_${(value >>> 0).toString(16).padStart(8, '0')}`; }
export default function WorkspaceNotes({ id, prompts }: { id: string; prompts: string[] }) {
  const [values, setValues] = useState<Record<string, string>>({}); const [status, setStatus] = useState('Loading notes…'); const [error, setError] = useState(''); const [loaded, setLoaded] = useState(false); const [dirty, setDirty] = useState(false);
  const state = useRef(0); const editToken = useRef(0); const queue = useRef<Promise<unknown>>(Promise.resolve()); const stopped = useRef(false);
  useEffect(() => { let active = true; void jobRequest<Notes>(`/${id}/notes`).then(notes => { if (active) { state.current = notes.state; setValues(notes.values); setStatus('Saved'); setLoaded(true); } }).catch(error => { if (active) setError(error.message); }); return () => { active = false; }; }, [id]);
  useEffect(() => {
    if (!loaded || !dirty || error) return;
    const snapshot = values; const token = editToken.current;
    const timer = window.setTimeout(() => {
      const operation = queue.current.catch(() => {}).then(async () => {
        if (stopped.current) return;
        setStatus('Saving…');
        try { const saved = await jobRequest<Notes>(`/${id}/notes`, 'PUT', { expectedState: state.current, values: snapshot }); state.current = saved.state; if (editToken.current === token) { setStatus('Saved'); setDirty(false); } }
        catch (error) { stopped.current = true; setStatus('Save failed'); setError(`${(error as Error).message} Your entered notes remain here. Copy them before reloading to merge changes.`); }
      }); queue.current = operation;
    }, 500);
    return () => clearTimeout(timer);
  }, [id, values, loaded, dirty, error]);
  const known = new Set(prompts.map(noteId));
  const entries = [...[...new Set(prompts)].map(prompt => ({ id: noteId(prompt), label: prompt })), ...Object.keys(values).filter(key => !known.has(key)).map(id => ({ id, label: 'Saved note from an earlier prompt' }))];
  return <section className="panel"><h3>Private interview notes</h3><p className="muted">Saved separately for this job. Notes are excluded from generation and document exports. Wait for Saved before leaving.</p><p role="status">{status}</p>{error && <p className="error" role="alert">{error}</p>}
    {loaded && entries.map(entry => <div key={entry.id}><label htmlFor={`workspace-${entry.id}`}>{entry.label}</label><textarea id={`workspace-${entry.id}`} rows={3} value={values[entry.id] ?? ''} onChange={event => { const next = { ...values, [entry.id]: event.target.value }; editToken.current += 1; setValues(next); setDirty(true); setStatus('Unsaved'); }} /></div>)}
  </section>;
}
