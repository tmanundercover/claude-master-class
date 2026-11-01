import AppLink from "@/components/AppLink";
import ResumeEvidenceExplorer from "@/components/ResumeEvidenceExplorer";
import type { ResumeData } from "@/app-types";
import profile from "../../data/profile.json";

export default function ResumeEvidencePage({ summary, snapshotCreatedAt, skills, experiences, projects }: ResumeData) {

  return (
    <>
      <div className="workspace-header">
        <div>
          <p className="eyebrow">Private résumé intelligence</p>
          <h1>The evidence behind the timeline.</h1>
        </div>
        <AppLink className="button secondary" href="/dashboard">Back to workspace</AppLink>
      </div>
      <p className="intro">Search the older roles and projects that establish when a technology first appears, how many dated role-years support it, and the proficiency rating preserved in the former Sanity portfolio.</p>
      <div className="evidence-stat-grid">
        <div><strong>{summary.careerYears}+</strong><span>years since first engineering role</span></div>
        <div><strong>{summary.archivedSkillCount}</strong><span>archived technologies</span></div>
        <div><strong>{summary.currentExperienceCount}</strong><span>consolidated current roles</span></div>
        <div><strong>{summary.currentProjectCount}</strong><span>consolidated current projects</span></div>
      </div>
      <p className="notice">This is additive historical evidence from a {new Date(snapshotCreatedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })} homepage snapshot. It does not replace or remove the current résumé. “Years in dated roles” totals linked role intervals; it does not claim continuous daily use. Ratings are archived self-assessments.</p>
      <ResumeEvidenceExplorer
        skills={skills}
        experiences={experiences}
        projects={projects}
        currentExperiences={profile.experience}
        currentProjects={profile.projects}
      />
    </>
  );
}
