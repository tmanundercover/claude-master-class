import { existsSync } from "node:fs";
import { join } from "node:path";
import InterviewLibrary from "@/components/InterviewLibrary";
import LogoutButton from "@/components/LogoutButton";
import { currentSessionRole } from "@/lib/auth";
import { interviewResponses } from "@/lib/interview-responses";
import { privatePageGuard } from "@/lib/private-page";
import { SESSION_ROLES } from "@/lib/session";

export const dynamic = "force-dynamic";

const roleLabels = {
  recruiter: "Recruiter",
  interviewer: "Interviewer",
  terrell: "Terrell Singleton",
} as const;

export default async function InterviewPage() {
  const blocked = await privatePageGuard(SESSION_ROLES);
  if (blocked) return blocked;
  const role = await currentSessionRole();
  const availableVideoIds = interviewResponses
    .filter((response) => existsSync(join(process.cwd(), "public", response.videoSrc.replace(/^\//, ""))))
    .map((response) => response.id);

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
      <InterviewLibrary responses={interviewResponses} availableVideoIds={availableVideoIds} />
    </main>
  );
}
