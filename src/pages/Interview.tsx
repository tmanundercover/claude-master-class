import InterviewLibrary from "@/components/InterviewLibrary";
import LogoutButton from "@/components/LogoutButton";
import type { InterviewData } from "@/app-types";

const roleLabels = {
  recruiter: "Recruiter",
  interviewer: "Interviewer",
  terrell: "Terrell Singleton",
} as const;

export default function InterviewPage({ role, responses, availableVideoIds }: InterviewData) {
  return (
    <main id="main" className="interview-page">
      <header className="interview-header">
        <div>
          <p className="eyebrow">STAR interview responses / {role ? roleLabels[role] : "Guest"} view</p>
          <h1>Start with the story.<br /><span>Stay for the evidence.</span></h1>
          <p className="intro">Explore concise responses to common interview questions, trace each one to a real role, and open the full story when you want more context.</p>
        </div>
        <LogoutButton />
      </header>
      <InterviewLibrary responses={responses} availableVideoIds={availableVideoIds} />
    </main>
  );
}
