import { useMemo, useState } from 'react';
import type { TailorResult } from '@/lib/resume-tailor-result';
import { resumeExports } from '@/lib/resume-export';
import { copyText } from '@/lib/clipboard';

export default function ResumeTailorResult({ result }: { result: TailorResult }) {
  const [feedback, setFeedback] = useState<{ error: boolean; message: string } | null>(null);
  const exported = useMemo(() => {
    try { return { ...resumeExports(result.document), error: '' }; }
    catch (error) { return { html: '', text: '', error: error instanceof Error ? error.message : 'The résumé could not be rendered.' }; }
  }, [result]);
  async function copy() {
    setFeedback(null);
    try {
      await copyText(exported.text, navigator.clipboard);
      setFeedback({ error: false, message: 'Résumé text copied.' });
    } catch (error) {
      setFeedback({ error: true, message: error instanceof Error ? error.message : 'The résumé could not be copied.' });
    }
  }
  function download() {
    setFeedback(null);
    let url: string | undefined;
    const anchor = document.createElement('a');
    try {
      url = URL.createObjectURL(new Blob([exported.html], { type: 'text/html;charset=utf-8' }));
      anchor.href = url;
      anchor.download = 'tailored-resume.html';
      document.body.append(anchor);
      anchor.click();
      setFeedback({ error: false, message: 'HTML download started.' });
    } catch {
      setFeedback({ error: true, message: 'The HTML download could not be started. Please try again.' });
    } finally {
      anchor.remove();
      if (url) { const objectURL = url; setTimeout(() => URL.revokeObjectURL(objectURL), 1000); }
    }
  }
  return <section className="tailor-result" aria-labelledby="tailor-heading">
    <h2 id="tailor-heading">Your tailored résumé</h2>
    <div className="tailor-actions">
      <button type="button" className="secondary" disabled={!!exported.error} onClick={download}>Download HTML</button>
      <button type="button" className="secondary" disabled={!!exported.error} onClick={copy}>Copy plain text</button>
    </div>
    {exported.error && <p className="error" role="alert">{exported.error}</p>}
    {feedback && <p className={feedback.error ? 'error' : 'success'} role={feedback.error ? 'alert' : 'status'}>{feedback.message}</p>}
    {exported.html && <iframe className="tailor-preview" title="Tailored résumé preview" sandbox="" referrerPolicy="no-referrer" srcDoc={exported.html} />}
    <aside className="verification-notes" aria-label="Résumé review details">
      <details><summary>Sources used</summary><ul>{result.evidenceUsed.map(label => <li key={label}>{label}</li>)}</ul></details>
      <section><h3>Review notes</h3>{result.factsToVerify.length
        ? <ul>{result.factsToVerify.map(note => <li key={note}>{note}</li>)}</ul>
        : <p className="muted">No specific details were flagged. Review the résumé before using it.</p>}</section>
    </aside>
  </section>;
}
