# 03 - Build Interview Prep / Study Plan

## Why

Start directly from a job description; no assessment or score is required. Candidates with evidence need rehearsal;
candidates new to a title need an achievable sequence of learning and practice.

This is **one private feature with two modes**, not two separate tools.

## Work

Implement `src/server/routes/career-plan.ts` and its result UI. Reuse the prior
server provider helper, authentication, and input validation. Use profile + JD
as context; do not rely on invented interview processes or hidden stored fit results.

Request:
`{ jobDescription: string, mode: "interview" | "study", weeklyHours: number }`.
Hours must be between 1 and 40; enforce that every study week's total fits the budget.

Return the `CareerResult` discriminated union in `src/lib/tools.ts`.

## Current writing stance

Build persuasive STAR talking points from documented contributions and supported qualitative outcomes, even without metrics. Reserve needs-my-input markers for genuinely missing facts, not normal paraphrasing. Keep process stages as assumptions. Study plans should build on transferable skills and prioritize meaningful preparation over keyword-by-keyword remediation.

The model receives substantive roles, bullets, projects, and skills from the consolidated profile on the server, separately from the untrusted job description. Each tool can be opened directly; running Job Fit first is optional.

## Good Prompt

```text
Implement the career-plan exercise with interview and study modes.
Use the verified profile and JD; reuse the existing protected model-call pattern.
Interview: stagesToConfirm, five practice questions, three truthful STAR outlines,
three questionsToAsk, and a notesTemplate. Mark unknown story facts as
"needs my input" and process stages as assumptions to confirm with a recruiter.
Study: roleSummary, three prioritySkills, four weeks, and a readinessCheck.
Each week needs number, tasks, hours, deliverable, measurable check;
hours must not exceed weeklyHours. No employment/readiness guarantees.
Validate the correct response variant, counts, field types, and time budgets
at runtime. Render the two modes clearly. Never fabricate source evidence,
course links, or post-interview notes. Keep notes in UI state, not public files.
Add invalid-mode, malformed-output, and budget-boundary tests.
Run the starter checks and verify both modes.
```

## Acceptance Checks

- Both modes work through the same protected route; mode is explicit in output.
- Interview stories contain true facts or explicit missing-detail markers.
- Interview notes distinguish preparation from actual post-interview observations.
- Study plan contains exactly four weeks; every week stays within the input budget.
- Checks measure doing/explaining rather than merely watching videos.
- New JD/mode submission clears stale results and displays current errors.
- Sensitive output is neither committed nor added to `data/profile.json`.
- All four tools remain independently accessible without a stored fit result.

## Boundaries, Do's and Don'ts

| Mode/boundary | Do | Don't |
|---------------|----|-------|
| Interview | Use true STAR evidence; mark missing facts and stages to confirm | Invent stories, company interview stages, or post-interview notes |
| Study | Return exactly four weeks with measurable checks inside each weekly budget | Promise employment or overload the student's available time |
| Shared scope | Reuse one protected route with discriminated output validation | Add hidden dependencies on stored scores or build separate services |
| Privacy | Keep preparation and notes in private request/UI state | Commit outputs or write them into the public profile |

## Bad Prompts

**Interview:** "Invent three leadership stories and tell me exactly what this
company will ask." This fabricates evidence and certainty.

**Study:** "Guarantee I am job-ready in four weeks; ignore my time budget."
This promises an outcome and produces an unusable plan.
