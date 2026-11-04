export const JOB_DESCRIPTION_MAX_LENGTH = 15_000;

export const tools = [
  { id: "fit-analyzer", title: "Job Fit Analyzer", description: "Assess strengths, transferable experience, meaningful gaps, and questions about the role." },
  { id: "cover-letter", title: "Cover Letter Generator", description: "Make a confident, specific case through supported examples and professional writing." },
  { id: "career-plan", title: "Interview Prep / Study Plan", description: "Build persuasive interview stories or a practical four-week preparation plan." },
  { id: "resume-tailor", title: "Resume Tailor", description: "Write a cohesive résumé for your target role, then preview, download HTML, or copy text." },
] as const;

export type ToolId = (typeof tools)[number]["id"];
export type Tone = "formal" | "conversational" | "technical";
export type CareerMode = "interview" | "study";

export interface ToolInput {
  jobDescription: string;
  tone: Tone;
  mode: CareerMode;
  weeklyHours: number;
}

export interface FitResult {
  score: number;
  summary: string;
  matches: { requirement: string; evidence: string }[];
  gaps: string[];
  nextActions: string[];
}

export interface LetterResult {
  letter: string;
  evidenceUsed: string[];
  factsToVerify: string[];
}

export type CareerResult =
  | { mode: "interview"; stagesToConfirm: string[]; questions: string[]; stories: { situation: string; task: string; action: string; result: string }[]; questionsToAsk: string[]; notesTemplate: string[] }
  | { mode: "study"; roleSummary: string; prioritySkills: string[]; weeks: { week: number; tasks: string[]; hours: number; deliverable: string; check: string }[]; readinessCheck: string };

export function validateToolInput(body: unknown): { ok: true; value: ToolInput } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null || !("jobDescription" in body)) {
    return { ok: false, error: "Provide a jobDescription string." };
  }
  if (typeof body.jobDescription !== "string" || !body.jobDescription.trim()) {
    return { ok: false, error: "Paste a job description before running the tool." };
  }
  if (body.jobDescription.length > JOB_DESCRIPTION_MAX_LENGTH) {
    return { ok: false, error: `Job description must be ${JOB_DESCRIPTION_MAX_LENGTH.toLocaleString("en-US")} characters or fewer.` };
  }
  const tone = "tone" in body ? body.tone : "formal";
  const mode = "mode" in body ? body.mode : "interview";
  const weeklyHours = "weeklyHours" in body ? body.weeklyHours : 5;
  if (tone !== "formal" && tone !== "conversational" && tone !== "technical") {
    return { ok: false, error: "Choose a supported tone." };
  }
  if (mode !== "interview" && mode !== "study") {
    return { ok: false, error: "Choose interview or study mode." };
  }
  if (typeof weeklyHours !== "number" || !Number.isFinite(weeklyHours) || weeklyHours < 1 || weeklyHours > 40) {
    return { ok: false, error: "Weekly learning hours must be between 1 and 40." };
  }
  return { ok: true, value: { jobDescription: body.jobDescription.trim(), tone, mode, weeklyHours } };
}
