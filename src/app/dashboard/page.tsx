import Link from "next/link";
import { tools } from "@/lib/tools";
import { privatePageGuard } from "@/lib/private-page";
import { getResumeEvidenceSummary } from "@/lib/resume-evidence";

export default async function Dashboard() {
  const blocked = await privatePageGuard();
  if (blocked) return blocked;
  const evidence = getResumeEvidenceSummary();
  return (
    <>
      <h1>Your next four builds.</h1>
      <p>One verified profile. One target job. Three private tools and one interview response library.</p>
      <p className="notice">This workspace is protected by a four-hour server session. All three tools use verified profile evidence, validate model output, and surface provider failures without fabricated fallback results.</p>
      <Link className="resume-intelligence" href="/dashboard/resume">
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
      </Link>
      <div className="grid three">
        {tools.map((tool, index) => <Link key={tool.id} className="panel tool-link" href={`/dashboard/${tool.id}`}>
          <span className="badge">Exercise {index + 1}</span><h2>{tool.title}</h2><p>{tool.description}</p><span>Open exercise workspace</span>
        </Link>)}
        <Link className="panel tool-link" href="/interview">
          <span className="badge">Exercise 4</span><h2>STAR Interview Responses</h2><p>Give recruiters and interviewers a searchable, evidence-linked library of recorded answers.</p><span>Open interview room</span>
        </Link>
      </div>
    </>
  );
}
