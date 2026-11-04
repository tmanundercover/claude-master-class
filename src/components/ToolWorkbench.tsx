import { useEffect, useRef, useState, type FormEvent } from 'react';
import AppLink from './AppLink';
import { JOB_DESCRIPTION_MAX_LENGTH, type ToolId } from '../lib/tools';
import { jobLabel, jobRequest } from '../lib/job-client';
import type { Workspace } from '../lib/job-contracts';
export default function ToolWorkbench({ id }: { id: ToolId }) {
  const [jd, setJd] = useState(''); const [tone, setTone] = useState('formal'); const [mode, setMode] = useState('interview'); const [hours, setHours] = useState(5); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [jobs, setJobs] = useState<Workspace[]>([]); const [selected, setSelected] = useState(''); const [next, setNext] = useState<string | null>(null);
  const attempt = useRef({ text: '', id: '' });
  useEffect(() => { void jobRequest<{ items: Workspace[]; next: string | null }>('?limit=50').then(data => { setJobs(data.items); setNext(data.next); }).catch(error => setError(error.message)); }, []);
  const kind = id === 'fit-analyzer' ? 'job-fit' : id === 'resume-tailor' ? 'resume' : id === 'cover-letter' ? 'cover-letter' : mode === 'study' ? 'study-plan' : 'interview-prep';
  const target = (workspaceId: string, generate = false) => `/dashboard/jobs/${workspaceId}?tool=${kind}&tone=${tone}&hours=${hours}${generate ? '&generate=1' : ''}`;
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try { if (attempt.current.text !== jd || !attempt.current.id) attempt.current = { text: jd, id: crypto.randomUUID() }; const saved = await jobRequest<{ workspace: Workspace }>('', 'POST', { jobDescription: jd, attemptId: attempt.current.id }); window.location.assign(target(saved.workspace.id, true)); }
    catch (error) { setError(error instanceof Error ? error.message : 'The job could not save. Retry to reconcile the same attempt.'); }
    finally { setBusy(false); }
  }
  return <div className="panel"><p>Your posting is saved before generation. Identical postings reopen the same job. Revise or Start over there to improve a result.</p><AppLink href="/dashboard/jobs">Browse saved jobs</AppLink>
    <label>Reopen a saved job<select value={selected} onChange={event => setSelected(event.target.value)}><option value="">Choose a saved job</option>{jobs.map(job => <option value={job.id} key={job.id}>{jobLabel(job)}</option>)}</select></label>
    {next && <button className="secondary" onClick={() => { void jobRequest<{ items: Workspace[]; next: string | null }>(`?limit=50&after=${next}`).then(data => { setJobs(current => [...current, ...data.items]); setNext(data.next); }).catch(error => setError(error.message)); }}>Load more saved jobs</button>}
    {selected && <AppLink className="button" href={target(selected)}>Open saved job</AppLink>}
    <form onSubmit={submit}><label htmlFor="jd">Target job description (include the role and company)<textarea id="jd" aria-describedby="jd-count" rows={8} required maxLength={JOB_DESCRIPTION_MAX_LENGTH} value={jd} onChange={event => setJd(event.target.value)} /></label><p id="jd-count" className="muted jd-count">{jd.length.toLocaleString()} / {JOB_DESCRIPTION_MAX_LENGTH.toLocaleString()} characters</p>
      {id === 'cover-letter' && <label>Tone<select value={tone} onChange={event => setTone(event.target.value)}><option value="formal">Formal</option><option value="conversational">Conversational</option><option value="technical">Technical</option></select></label>}
      {id === 'career-plan' && <><label>Preparation mode<select value={mode} onChange={event => setMode(event.target.value)}><option value="interview">Interview preparation</option><option value="study">New-role study plan</option></select></label>{mode === 'study' && <label>Learning hours per week<input type="number" min={1} max={40} required value={hours} onChange={event => setHours(Number(event.target.value))} /></label>}</>}
      <button disabled={busy}>{busy ? 'Saving job…' : 'Run tool'}</button>
    </form>{error && <p className="error" role="alert">{error}</p>}
  </div>;
}
