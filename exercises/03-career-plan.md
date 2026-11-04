# Lesson 5 — Interview Prep / Study Plan

## Why

Start directly from a job description; no assessment or score is required. Candidates with evidence need rehearsal;
candidates new to a title need an achievable sequence of learning and practice.

This is **one private feature with two modes**, not two separate tools.

## Prerequisites, current supplied behavior, and bounded work

Complete [Lesson 4](02-cover-letter.md) and verify owner authorization. Both modes,
validated counts/time budgets, saved job workspaces and separate private notes are
present in the current branch. Inspect and verify these supplied behaviors, then
agree on one bounded improvement; do not remove them to recreate an empty starter.

The teaching sequence is not a tool dependency. Open either mode directly without
Job Fit. Current compatibility requests pass from `src/server/routes/career-plan.ts`
through `src/server/routes/job-workspaces.ts` to shared server generation and
analysis. The complete original prompt below remains verbatim, including the
other session's private-notes instruction.

Read [job workspace documentation](../docs/job-workspaces.md) for local fixture
storage, saving, Current/Previous retention, and recovery. Workspace operations
and their remaining live acceptance belong to the separate job-workspace change.
Use isolated fixtures under Auth, Hosting and Functions emulators; preserve
credential files. Never treat a missing storage/provider configuration as a
successful empty plan. Personal notes are separate from generated content and
excluded from model input, exports and public profile data.

## Work

Inspect the supplied `src/server/routes/career-plan.ts` and its result UI. Reuse the prior
server provider helper, authentication, and input validation. Use profile + JD
as context; do not rely on invented interview processes or hidden stored fit results.

Request:
`{ jobDescription: string, mode: "interview" | "study", weeklyHours: number }`.
Hours must be between 1 and 40; enforce that every study week's total fits the budget.

Return the `CareerResult` discriminated union in `src/lib/tools.ts`.

## Current writing stance

Build persuasive STAR talking points from documented contributions and supported qualitative outcomes, even without metrics. Reserve needs-my-input markers for genuinely missing facts, not normal paraphrasing. Keep process stages as assumptions. Study plans should build on transferable skills and prioritize meaningful preparation over keyword-by-keyword remediation.

The model receives substantive roles, bullets, projects, and skills from the consolidated profile on the server, separately from the untrusted job description. Each tool can be opened directly; running Job Fit first is optional.

## Explore and refine — assistant chat

Prerequisites and acceptance checks below define this lesson's scope. Copy this
whole block, including the wrapper. Discuss what already works and agree on one
bounded improvement or verification task before proposing. Use the corresponding
installed invocation for other assistants from [Lesson 0](openspec-workflow.md).

```text
$openspec-explore
Explore only Lesson 5 — Interview Prep / Study Plan in exercises/03-career-plan.md.
The original prompt below is a feature brief: its implementation verbs describe
our desired outcome. Inspect supplied behavior, discuss unknowns and tradeoffs,
and refine the acceptance checks with me. Do not edit implementation files or
create planning artifacts yet. Preserve satisfied behavior and unrelated work.

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
course links, or post-interview notes. Persist owner-private notes separately in the job workspace; exclude them from model input, generated documents, and public files.
Add invalid-mode, malformed-output, and budget-boundary tests.
Run the starter checks and verify both modes.
```

## Propose, review, then Apply

After exploration is satisfactory, send this separate assistant instruction:

```text
$openspec-propose lesson-career-plan
Use our agreed Lesson 5 discussion only. Preserve satisfied behavior.
Write planning artifacts; do not implement yet.
```

Review the proposal, design, applicable specs, and tasks. Confirm the named files,
role boundaries, evidence rules, failure cases, and this lesson's observable checks.
Correct the plan before proceeding. Then explicitly send:

```text
$openspec-apply-change lesson-career-plan
Implement the reviewed lesson tasks and report actual verification results.
```

## Verify before continuing

Run the lesson checks below and record expected versus actual results. Inspect
supplied behavior instead of removing working features. An unchecked or failed
check keeps this lesson open. Resume the same `lesson-career-plan` change after diagnosis;
see [same-change recovery](openspec-workflow.md#same-change-recovery). No automatic
sending, deployment, sync, or archive follows lesson completion.

## Acceptance Checks

- Both modes work through the same protected route; mode is explicit in output.
- Interview stories contain true facts or explicit missing-detail markers.
- Interview notes distinguish preparation from actual post-interview observations.
- Study plan contains exactly four weeks; every week stays within the input budget.
- Checks measure doing/explaining rather than merely watching videos.
- New postings open their saved job workspace; Interview Prep and Study Plan remain independent. Pending or failed replacements preserve Current/Previous and notes while displaying current errors.
- Sensitive output is neither committed nor added to `data/profile.json`.
- All four tools remain independently accessible without a stored fit result.

## Boundaries, Do's and Don'ts

| Mode/boundary | Do | Don't |
|---------------|----|-------|
| Interview | Use true STAR evidence; mark missing facts and stages to confirm | Invent stories, company interview stages, or post-interview notes |
| Study | Return exactly four weeks with measurable checks inside each weekly budget | Promise employment or overload the student's available time |
| Shared scope | Reuse one protected route with discriminated output validation | Add hidden dependencies on stored scores or build separate services |
| Privacy | Keep preparation and notes in owner-authorized workspace storage | Commit outputs or write them into the public profile |

## Bad Prompts

**Interview:** "Invent three leadership stories and tell me exactly what this
company will ask." This fabricates evidence and certainty.

**Study:** "Guarantee I am job-ready in four weeks; ignore my time budget."
This promises an outcome and produces an unusable plan.

Previous: [Lesson 4 — Cover Letter](02-cover-letter.md) · Next: [Lesson 6 — Resume Tailor](04-resume-tailor.md).
