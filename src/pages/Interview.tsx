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
          <p className="eyebrow">Interview answers / {role ? roleLabels[role] : "Guest"} view</p>
          <h1>Interview questions<br /><span>and answers.</span></h1>
          <p className="intro">Browse my answers to common interview questions, learn about my experience, and open any response for the full answer.</p>
        </div>
        <LogoutButton />
      </header>
      <InterviewLibrary responses={responses} availableVideoIds={availableVideoIds} />
    </main>
  );
}
