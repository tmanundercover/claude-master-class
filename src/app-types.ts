import type profile from "../data/profile.json";
import type { ComponentProps } from "react";
import type ResumeEvidenceExplorer from "./components/ResumeEvidenceExplorer";
import type { getResumeEvidenceSummary, ResumeSearchItem, SkillEvidence } from "./lib/resume-evidence";
import type { InterviewResponse } from "./lib/interview-responses";
import type { SessionRole } from "./lib/session";

export type PublicProfile = Omit<typeof profile, "projects"> & {
  projects: Array<Omit<(typeof profile.projects)[number], "evidence">>;
};

export type EvidenceSummary = ReturnType<typeof getResumeEvidenceSummary>;
export interface HomeData {
  hasProfilePhoto: boolean;
  yearsInSoftware: number;
  skillEvidence: Record<string, SkillEvidence>;
  searchItems: ResumeSearchItem[];
}
export interface InterviewData {
  role: SessionRole;
  responses: InterviewResponse[];
  availableVideoIds: string[];
}
export type ResumeData = Pick<ComponentProps<typeof ResumeEvidenceExplorer>, "skills" | "experiences" | "projects" | "currentExperiences" | "currentProjects"> & {
  summary: EvidenceSummary;
  snapshotCreatedAt: string;
};
export type PageData =
  | { page: "home"; home: HomeData }
  | { page: "login"; hasWelcomeVideo: boolean }
  | { page: "dashboard"; evidence: EvidenceSummary }
  | { page: "inbox" }
  | { page: "tool"; id: string }
  | { page: "resume"; resume: ResumeData }
  | { page: "interview"; interview: InterviewData }
  | { page: "configuration" | "static-unavailable" | "not-found" };

export type PagePayload = PageData & { profile: PublicProfile };
