import AppLink from "@/components/AppLink";
import { tools } from "@/lib/tools";
import type { EvidenceSummary } from "@/app-types";

export default function Dashboard({ evidence }: { evidence: EvidenceSummary }) {
  return (
    <>
      <h1>Your next four builds.</h1>
      <p>One verified profile. One target job. Three private tools and one interview response library.</p>
      <p className="notice">This workspace is protected by a four-hour server session. All three tools use verified profile evidence, validate model output, and surface provider failures without fabricated fallback results.</p>
      <AppLink className="resume-intelligence" href="/dashboard/resume">
        <span>
          <span className="eyebrow">Résumé intelligence</span>
          <strong>Explore the complete evidence archive</strong>
          <span>Search dated roles, older portfolio projects, skill longevity, versions, and archived self-ratings without replacing the current résumé.</span>
        </span>
        <span className="resume-intelligence-stats" aria-label="Resume archive summary">
          <span><strong>{evidence.careerYears}+</strong> years</span>
          <span><strong>{evidence.archivedSkillCount}</strong> skills</span>
          <span><strong>{evidence.currentExperienceCount}</strong> current roles</span>
          <span><strong>{evidence.currentProjectCount}</strong> current projects</span>
        </span>
        <span aria-hidden="true">Open evidence →</span>
      </AppLink>
      <div className="grid three">
        {tools.map((tool, index) => <AppLink key={tool.id} className="panel tool-link" href={`/dashboard/${tool.id}`}>
          <span className="badge">Exercise {index + 1}</span><h2>{tool.title}</h2><p>{tool.description}</p><span>Open exercise workspace</span>
        </AppLink>)}
        <AppLink className="panel tool-link" href="/interview">
          <span className="badge">Exercise 4</span><h2>Interview Questions and Answers</h2><p>Give recruiters and interviewers a searchable, evidence-linked library of recorded answers.</p><span>View interview answers</span>
        </AppLink>
      </div>
    </>
  );
}
