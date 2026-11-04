import { useState, type FormEvent } from "react";
import ResumeTailorResult from './ResumeTailorResult';
import type { TailorResult } from '@/lib/resume-tailor-result';
import { isTailorResult } from '@/lib/resume-tailor-client';
import { copyText } from "@/lib/clipboard";
import { isCareerResult } from "@/lib/career-result";
import { isFitResult } from "@/lib/fit-result";
import { isLetterResult } from "@/lib/letter-result";
import { JOB_DESCRIPTION_MAX_LENGTH, type CareerMode, type CareerResult, type FitResult, type LetterResult, type Tone, type ToolId } from "@/lib/tools";

type CopyFeedback = { kind: "success" | "error"; message: string } | null;

export default function ToolWorkbench({ id }: { id: ToolId }) {
  const [jd, setJd] = useState("");
  const [tone, setTone] = useState<Tone>("formal");
  const [mode, setMode] = useState<CareerMode>("interview");
  const [hours, setHours] = useState(5);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [fitResult, setFitResult] = useState<FitResult | null>(null);
  const [tailorResult, setTailorResult] = useState<TailorResult | null>(null);
  const [letterResult, setLetterResult] = useState<LetterResult | null>(null);
  const [careerResult, setCareerResult] = useState<CareerResult | null>(null);
  const [careerBudget, setCareerBudget] = useState<number | null>(null);
  const [careerNotes, setCareerNotes] = useState<string[]>([]);
  const [copyFeedback, setCopyFeedback] = useState<CopyFeedback>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult("");
    setFitResult(null);
    setTailorResult(null);
    setLetterResult(null);
    setCareerResult(null);
    setCareerBudget(null);
    setCareerNotes([]);
    setCopyFeedback(null);
    setBusy(true);
    const submittedMode = mode;
    const submittedHours = hours;
    try {
      const response = await fetch(`/api/${id}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: jd, tone, mode, weeklyHours: hours }),
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        const message = typeof data === "object" && data !== null && "error" in data && typeof data.error === "string" ? data.error : `Request failed (${response.status}).`;
        const retryAfter = response.headers.get("retry-after");
        setError(response.status === 429 && retryAfter ? `${message} Try again in ${retryAfter} seconds.` : message);
        return;
      }
      if (id === 'resume-tailor') {
        if (!isTailorResult(data)) {
          setError('The server returned an invalid résumé result. No résumé was displayed.');
          return;
        }
        setTailorResult(data);
        return;
      }
      if (id === "fit-analyzer") {
        if (!isFitResult(data)) {
          setError("The server returned an invalid job-fit result. No analysis was displayed.");
          return;
        }
        setFitResult(data);
        return;
      }
      if (id === "cover-letter") {
        if (!isLetterResult(data)) {
          setError("The server returned an invalid cover-letter result. No draft was displayed.");
          return;
        }
        setLetterResult(data);
        return;
      }
      if (id === "career-plan") {
        if (!isCareerResult(data, submittedMode, submittedHours)) {
          setError("The server returned an invalid career-plan result. No plan was displayed.");
          return;
        }
        setCareerResult(data);
        setCareerBudget(submittedHours);
        setCareerNotes(data.mode === "interview" ? data.notesTemplate.map(() => "") : []);
        return;
      }
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Tool request failed:", error);
      setError("The request failed. Check the server logs and your connection.");
    } finally {
      setBusy(false);
    }
  }

  async function copyLetter() {
    if (!letterResult) return;
    setCopyFeedback(null);
    try {
      await copyText(letterResult.letter, navigator.clipboard);
      setCopyFeedback({ kind: "success", message: "Draft copied to the clipboard. Nothing was sent." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "The draft could not be copied. Copy it manually instead.";
      setCopyFeedback({ kind: "error", message });
    }
  }

  return (
    <div className="panel">
      <form onSubmit={submit}>
        <label htmlFor="jd">Target job description (include the role and company)
          <textarea id="jd" rows={8} required maxLength={JOB_DESCRIPTION_MAX_LENGTH} aria-describedby="jd-count" value={jd} onChange={(event) => setJd(event.target.value)} />
        </label>
        <p id="jd-count" className="muted jd-count">{jd.length.toLocaleString("en-US")} / {JOB_DESCRIPTION_MAX_LENGTH.toLocaleString("en-US")} characters</p>
        {id === "cover-letter" && <label htmlFor="tone">Tone
          <select id="tone" value={tone} onChange={(event) => {
            const value = event.target.value;
            if (value === "formal" || value === "conversational" || value === "technical") setTone(value);
          }}>
            <option value="formal">Formal</option><option value="conversational">Conversational</option><option value="technical">Technical</option>
          </select>
        </label>}
        {id === "career-plan" && <>
          <label htmlFor="mode">Preparation mode
            <select id="mode" value={mode} onChange={(event) => {
              const value = event.target.value;
              if (value === "interview" || value === "study") setMode(value);
            }}>
              <option value="interview">Interview preparation</option><option value="study">New-role study plan</option>
            </select>
          </label>
          {mode === "study" && <label htmlFor="hours">Learning hours per week
            <input id="hours" type="number" min={1} max={40} required value={hours} onChange={(event) => setHours(Number(event.target.value))} />
          </label>}
        </>}
        <button type="submit" disabled={busy}>{busy ? "Working..." : "Run tool"}</button>
      </form>
      <div aria-live="polite">
        {error && <p className="error" role="alert">{error}</p>}
        {tailorResult && <ResumeTailorResult result={tailorResult} />}
        {fitResult && <section className="fit-result" aria-labelledby="fit-result-heading">
          <div className="fit-summary">
            <div className="fit-score" aria-label={`Evidence fit score: ${fitResult.score} out of 100`}>
              <strong>{fitResult.score}</strong><span>/100</span>
            </div>
            <div>
              <h2 id="fit-result-heading">Evidence fit analysis</h2>
              <p>{fitResult.summary}</p>
              <p className="muted">This score summarizes profile evidence against this job description. It is not a hiring probability or guarantee.</p>
            </div>
          </div>
          <div className="fit-columns">
            <section>
              <h3>Evidence-backed matches</h3>
              {fitResult.matches.length > 0 ? <ul className="result-list">
                {fitResult.matches.map((match, index) => <li key={`${match.requirement}-${index}`}>
                  <strong>{match.requirement}</strong>
                  <span>{match.evidence}</span>
                </li>)}
              </ul> : <p className="muted">No supported matches were returned.</p>}
            </section>
            <section>
              <h3>Gaps and absent evidence</h3>
              {fitResult.gaps.length > 0 ? <ul>
                {fitResult.gaps.map((gap, index) => <li key={`${gap}-${index}`}>{gap}</li>)}
              </ul> : <p className="muted">No gaps were returned.</p>}
            </section>
          </div>
          <section>
            <h3>Three next actions</h3>
            <ol>{fitResult.nextActions.map((action, index) => <li key={`${action}-${index}`}>{action}</li>)}</ol>
          </section>
        </section>}
        {letterResult && <section className="letter-result" aria-labelledby="letter-result-heading">
          <div className="letter-heading">
            <div>
              <h2 id="letter-result-heading">Cover-letter draft</h2>
              <p className="muted">Review and edit this draft before using it. This tool never sends or submits it.</p>
            </div>
            <button type="button" className="secondary" onClick={copyLetter}>Copy draft</button>
          </div>
          {copyFeedback && <p className={copyFeedback.kind === "error" ? "error" : "success"} role={copyFeedback.kind === "error" ? "alert" : "status"}>{copyFeedback.message}</p>}
          <article className="letter-draft">{letterResult.letter}</article>
          <aside className="verification-notes" aria-label="Cover letter verification notes">
            <section>
              <h3>Verified evidence used</h3>
              <ul>{letterResult.evidenceUsed.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
            </section>
            <section>
              <h3>Facts to verify before use</h3>
              {letterResult.factsToVerify.length > 0
                ? <ul>{letterResult.factsToVerify.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
                : <p className="muted">No additional facts were flagged, but you should still review the entire draft.</p>}
            </section>
          </aside>
        </section>}
        {careerResult?.mode === "interview" && <section className="career-result" aria-labelledby="interview-plan-heading">
          <div>
            <h2 id="interview-plan-heading">Interview preparation</h2>
            <p className="muted">Stages are assumptions to confirm. STAR outlines use profile evidence and flag missing details for your input.</p>
          </div>
          <section>
            <h3>Stages to confirm with the recruiter</h3>
            <ul>{careerResult.stagesToConfirm.map((stage, index) => <li key={`${stage}-${index}`}>{stage}</li>)}</ul>
          </section>
          <section>
            <h3>Five practice questions</h3>
            <ol>{careerResult.questions.map((question, index) => <li key={`${question}-${index}`}>{question}</li>)}</ol>
          </section>
          <section>
            <h3>Three truthful STAR outlines</h3>
            <div className="star-grid">{careerResult.stories.map((story, index) => <article className="career-card" key={`story-${index}`}>
              <h4>Story {index + 1}</h4>
              <dl>
                <dt>Situation</dt><dd>{story.situation}</dd>
                <dt>Task</dt><dd>{story.task}</dd>
                <dt>Action</dt><dd>{story.action}</dd>
                <dt>Result</dt><dd>{story.result}</dd>
              </dl>
            </article>)}</div>
          </section>
          <section>
            <h3>Questions to ask</h3>
            <ol>{careerResult.questionsToAsk.map((question, index) => <li key={`${question}-${index}`}>{question}</li>)}</ol>
          </section>
          <section>
            <h3>Private notes template</h3>
            <p className="muted">These notes stay only in this page&apos;s UI state. They are not uploaded or written to public files and clear on a new submission or reload.</p>
            <div className="notes-grid">{careerResult.notesTemplate.map((prompt, index) => <label key={`${prompt}-${index}`} htmlFor={`career-note-${index}`}>
              {prompt}
              <textarea id={`career-note-${index}`} rows={3} value={careerNotes[index] ?? ""} onChange={(event) => {
                const value = event.target.value;
                setCareerNotes((current) => current.map((note, noteIndex) => noteIndex === index ? value : note));
              }} />
            </label>)}</div>
          </section>
        </section>}
        {careerResult?.mode === "study" && <section className="career-result" aria-labelledby="study-plan-heading">
          <div>
            <h2 id="study-plan-heading">Four-week study plan</h2>
            <p>{careerResult.roleSummary}</p>
            <p className="muted">Weekly budget used for this plan: up to {careerBudget} hours. This plan does not guarantee readiness or employment.</p>
          </div>
          <section>
            <h3>Three priority skills</h3>
            <ol>{careerResult.prioritySkills.map((skill, index) => <li key={`${skill}-${index}`}>{skill}</li>)}</ol>
          </section>
          <div className="week-grid">{careerResult.weeks.map((week) => <article className="career-card" key={week.week}>
            <div className="week-heading"><h3>Week {week.week}</h3><span className="badge">{week.hours} hours</span></div>
            <h4>Tasks</h4>
            <ul>{week.tasks.map((task, index) => <li key={`${task}-${index}`}>{task}</li>)}</ul>
            <h4>Deliverable</h4><p>{week.deliverable}</p>
            <h4>Measurable check</h4><p>{week.check}</p>
          </article>)}</div>
          <section className="notice"><h3>Readiness self-check</h3><p>{careerResult.readinessCheck}</p></section>
        </section>}
        {result && <section><h2>Result</h2><pre>{result}</pre></section>}
      </div>
    </div>
  );
}
