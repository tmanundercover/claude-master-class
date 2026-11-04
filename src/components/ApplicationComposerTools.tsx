import { useEffect, useState } from 'react';
import { jobRequest, jobLabel } from '../lib/job-client';
import type { Workspace } from '../lib/job-contracts';
import type { ApplicationLink } from '../server/jobs/application';
import { previewEmailDocument } from '../lib/mail-templates';
import type { applicationMailTemplate } from '../lib/application-template';
export type DocumentChoices = { standardResume: boolean; omitResume: boolean; omitCoverLetter: boolean };
type Preview = { workspace: Workspace; resume: { versionId: string; pdf: string } | null; coverLetter: { versionId: string; pdf: string } | null; template: ReturnType<typeof applicationMailTemplate> };
export default function ApplicationComposerTools({ link, busy, prepare }: { link: ApplicationLink | null; busy: boolean; prepare: (workspace: Workspace, action: 'apply' | 'refresh' | 'handoff', choices: DocumentChoices) => Promise<void> }) {
  const [jobs, setJobs] = useState<Workspace[]>([]); const [selected, setSelected] = useState(link?.workspaceId ?? ''); const [preview, setPreview] = useState<Preview | null>(null); const [error, setError] = useState(''); const [next, setNext] = useState<string | null>(null);
  const [standard, setStandard] = useState(false); const [omitResume, setOmitResume] = useState(false); const [omitCover, setOmitCover] = useState(false);
  async function load(after?: string) { try { const data = await jobRequest<{ items: Workspace[]; next: string | null }>(`?limit=50${after ? `&after=${after}` : ''}`); setJobs(current => after ? [...current, ...data.items] : data.items); setNext(data.next); } catch (error) { setError((error as Error).message); } }
  useEffect(() => { void Promise.resolve().then(() => load()); }, []);
  useEffect(() => { if (link) void Promise.resolve().then(() => setSelected(link.workspaceId)); }, [link]);
  useEffect(() => { let active = true; if (selected) void jobRequest<Preview>(`/${selected}/application-draft`).then(value => { if (active) setPreview(value); }).catch(error => { if (active) setError(error.message); }); return () => { active = false; }; }, [selected]);
  const choices = { standardResume: standard, omitResume, omitCoverLetter: omitCover };
  const needsChoice = preview && !preview.resume && !standard;
  const blockedPdf = preview && ((preview.resume && preview.resume.pdf !== 'ready' && !omitResume && !standard) || (preview.coverLetter && preview.coverLetter.pdf !== 'ready' && !omitCover));
  return <details className="mail-html-section" open={!!link}><summary>Job application template</summary><p>Choose a saved job. Preview leaves the composer unchanged. Apply prepares its available documents and editable copy.</p>
    <label htmlFor="application-job-workspace">Job workspace</label><select id="application-job-workspace" value={selected} disabled={busy} onChange={event => { setSelected(event.target.value); setPreview(null); setStandard(false); setOmitResume(false); setOmitCover(false); setError(''); }}><option value="">Select a job</option>{jobs.map(job => <option key={job.id} value={job.id}>{jobLabel(job)}</option>)}</select>{next && <button type="button" disabled={busy} onClick={() => { void load(next); }}>Load more jobs</button>}
    {error && <p className="error" role="alert">{error}</p>}{preview && <>
      {(!preview.workspace.company || !preview.workspace.title) && <p className="notice">Company or role is unknown. <a href={`/dashboard/jobs/${selected}`}>Correct job details</a> before applying, or use the neutral wording shown below.</p>}
      {!preview.resume && <div className="notice"><p>No tailored résumé is saved for this job.</p><button type="button" disabled={busy} onClick={() => setStandard(true)}>Use standard résumé</button><button type="button" disabled={busy} onClick={() => { void prepare(preview.workspace, 'handoff', choices); }}>Create tailored résumé</button>{standard && <p>Standard résumé selected explicitly.</p>}</div>}
      {preview.resume && preview.resume.pdf !== 'ready' && <label><input type="checkbox" checked={omitResume} onChange={event => setOmitResume(event.target.checked)} /> Résumé PDF is {preview.resume.pdf}: proceed without it</label>}
      {preview.coverLetter && preview.coverLetter.pdf !== 'ready' && <label><input type="checkbox" checked={omitCover} onChange={event => setOmitCover(event.target.checked)} /> Cover-letter PDF is {preview.coverLetter.pdf}: proceed without it</label>}
      {(preview.resume?.pdf !== 'ready' || preview.coverLetter?.pdf !== 'ready') && <p><a href={`/dashboard/jobs/${selected}`}>Open job to create or retry PDFs</a></p>}
      {!preview.coverLetter && <p className="muted">No cover letter is saved. You can prepare a résumé-only application.</p>}
      <details><summary>Preview job application copy</summary><p>{preview.template.subject}</p><iframe title="Job application template preview" sandbox="" srcDoc={previewEmailDocument(preview.template.html)} /></details>
      <div className="mail-actions"><button type="button" disabled={busy || !!needsChoice || !!blockedPdf} onClick={() => { void prepare(preview.workspace, 'apply', choices); }}>Use job application template</button>{link && <button type="button" disabled={busy || !!needsChoice || !!blockedPdf} onClick={() => { void prepare(preview.workspace, 'refresh', choices); }}>Refresh documents</button>}{preview.resume && <button type="button" disabled={busy} onClick={() => { void prepare(preview.workspace, 'handoff', choices); }}>Edit tailored résumé</button>}</div>
      <p className="muted">Refresh replaces managed documents while preserving edited copy and manual files. Sending requires Send message.</p>
    </>}
    {link && <div><p>Saved application document snapshots:</p><ul>{link.snapshots.map((file, i) => <li key={i}>{file.filename} · {file.managed ? 'Job document' : 'Manual attachment'}{file.versionId ? ` · ${file.versionId}` : ''}</li>)}</ul></div>}
  </details>;
}
