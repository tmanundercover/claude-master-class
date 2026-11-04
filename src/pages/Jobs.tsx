import { useEffect, useState } from 'react';
import AppLink from '../components/AppLink';
import { jobLabel, jobRequest } from '../lib/job-client';
import type { Workspace } from '../lib/job-contracts';
export default function Jobs() {
  const [items, setItems] = useState<Workspace[]>([]); const [next, setNext] = useState<string | null>(null); const [error, setError] = useState('');
  async function load(after?: string) { try { const data = await jobRequest<{ items: Workspace[]; next: string | null }>(`?limit=20${after ? `&after=${after}` : ''}`); setItems(current => after ? [...current, ...data.items] : data.items); setNext(data.next); } catch (error) { setError(error instanceof Error ? error.message : 'Could not load jobs.'); } }
  useEffect(() => { void Promise.resolve().then(() => load()); }, []);
  return <><AppLink href="/dashboard">← Your workspace</AppLink><h1>Saved jobs</h1><p>Reopen a job to retrieve its documents. To start a new job, paste its description into any tool.</p><AppLink className="button" href="/dashboard/resume-tailor">Tailor a résumé for a job</AppLink>{error && <p className="error" role="alert">{error}</p>}<div className="grid two">{items.map(job => <AppLink className="panel tool-link" key={job.id} href={`/dashboard/jobs/${job.id}`}><h2>{jobLabel(job)}</h2><p>{job.location ?? 'Location unknown'}{job.requisition ? ` · ${job.requisition}` : ''}</p><p className="muted">Saved {new Date(job.createdAt).toLocaleDateString()}</p></AppLink>)}</div>{next && <button onClick={() => { void load(next); }}>Load more jobs</button>}</>;
}
