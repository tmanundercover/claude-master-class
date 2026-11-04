import { useState } from "react";
import FitAnalysisResult from './FitAnalysisResult';
import ResumeTailorResult from './ResumeTailorResult';
import type { TailorResult } from '@/lib/resume-tailor-result';
import { copyText } from "@/lib/clipboard";
import { type CareerResult, type FitResult, type LetterResult } from "@/lib/tools";
import type { JobMetadata } from '@/lib/job-contracts';


export default function SavedArtifactResult({kind, result, weeklyHours, job, savedAt}: {kind: string; result: unknown; weeklyHours: number; job?: JobMetadata; savedAt?: string}) {
  const [copyFeedback, setCopyFeedback] = useState<{ kind: string; message: string } | null>(null);
  const tailorResult = kind === 'resume' ? result as TailorResult : null;
  const fitResult = kind === 'job-fit' ? result as FitResult : null;
  const letterResult = kind === 'cover-letter' ? result as LetterResult : null;
  const careerResult = kind === 'interview-prep' || kind === 'study-plan' ? result as CareerResult : null;
  const careerBudget = weeklyHours;
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

  return <div>
        {tailorResult && <ResumeTailorResult result={tailorResult} job={job} savedAt={savedAt} />}
        {fitResult && <FitAnalysisResult result={fitResult} />}
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

  </div>;
}
