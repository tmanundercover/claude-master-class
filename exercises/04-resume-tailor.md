# Lesson 6 — Resume Tailor

## Purpose and prerequisites

Turn documented experience into a relevant résumé while keeping original facts
immutable. Complete the core lessons through Lesson 5 and confirm owner access.
The teaching order is not a tool dependency: open `/dashboard/resume-tailor`
directly with a job description; no prior assessment is needed.

## Current supplied behavior and bounded work

HTML preview/download and text copy are supplied. Inspect and verify them, then
agree on one improvement within this lesson. This full prompt is newly authored;
it does not replace an older canonical implementation prompt.

Read [Resume Tailor contracts](../docs/resume-tailor.md) and canonical
[resume-tailoring](../openspec/specs/resume-tailoring/spec.md). The canonical HTML/text contract predates the concurrent workspace delta; current
saved-version behavior below follows that implementation without changing canonical
application specs in this curriculum. The route now delegates
through `src/server/routes/job-workspaces.ts` to the shared generation service;
validators and the shared renderer still own document correctness. Saved jobs,
Current/Previous versions, application PDFs and attachments are being delivered
under the separate [job-workspace change](../openspec/changes/add-job-workspaces-and-versioned-artifacts/tasks.md).
Its documentation describes that branch's behavior; its remaining acceptance
and live operations are separate. This lesson's HTML/text exports do not attach
a PDF or send an email. Use only configured local fixtures for classroom checks.

## Explore and refine — assistant chat

Prerequisites and acceptance checks below define this lesson's scope. Copy this
whole block, including the wrapper. Discuss what already works and agree on one
bounded improvement or verification task before proposing. Use the corresponding
installed invocation for other assistants from [Lesson 0](openspec-workflow.md).

```text
$openspec-explore
Explore only Lesson 6 — Resume Tailor in exercises/04-resume-tailor.md.
The original prompt below is a feature brief: its implementation verbs describe
our desired outcome. Inspect supplied behavior, discuss unknowns and tradeoffs,
and refine the acceptance checks with me. Do not edit implementation files or
create planning artifacts yet. Preserve satisfied behavior and unrelated work.

Inspect src/server/routes/resume-tailor.ts, src/server/jobs/, src/lib/model.ts,
src/lib/resume-tailor-result.ts and src/lib/resume-document.ts before changes.
Keep Resume Tailor independently owner-accessible at /dashboard/resume-tailor;
no Job Fit score, result, or preceding tool is required.
Accept a nonblank jobDescription up to 15,000 characters. Reuse generateJson,
TAILOR_RESULT_SCHEMA and parseTailorModelResult; validate output at runtime.
Supply approved consolidated profile roles, bullets, projects and skills on the
server as verifiedCandidateEvidence, separately from untrustedJobDescription.
Encourage supported professional rewriting and transferable experience without
inventing facts or claiming unsupported exact technology versions.
Validate unique source selections, bounded prose and parent-bound references.
Reject unknown and cross-parent IDs; never truncate an oversized result silently.
Assemble immutable identity, contacts, employers, titles, dates, education and
approved links from trusted sources; whitelist fields rather than accepting them
from model prose. Keep evidenceUsed and optional factsToVerify outside exports.
Render the shared inert ResumeDocument preview, self-contained Download HTML,
and matching Copy plain text, with visible success/failure feedback.
Keep saved Current/Previous available during pending or failed replacements. Reset
version-specific export feedback when the selected saved version changes, and
surface provider/configuration errors without displaying old content as new.
Keep private evidence, provider calls and credentials server-side; exclude private
results from public builds. Do not change the profile, Send my résumé template,
mail drafts, or send/submit/publish anything through these HTML/text export actions.
Test owner/guest denial, input limits, references, output bounds and failures.
Inspect 375px/1440px layouts; use the five configured Firebase emulators for app checks.
```

## Propose, review, then Apply

After exploration is satisfactory, send this separate assistant instruction:

```text
$openspec-propose lesson-resume-tailor
Use our agreed Lesson 6 discussion only. Preserve satisfied behavior.
Write planning artifacts; do not implement yet.
```

Review the proposal, design, applicable specs, and tasks. Confirm the named files,
role boundaries, evidence rules, failure cases, and this lesson's observable checks.
Correct the plan before proceeding. Then explicitly send:

```text
$openspec-apply-change lesson-resume-tailor
Implement the reviewed lesson tasks and report actual verification results.
```

## Verify before continuing

Run the lesson checks below and record expected versus actual results. Inspect
supplied behavior instead of removing working features. An unchecked or failed
check keeps this lesson open. Resume the same `lesson-resume-tailor` change after diagnosis;
see [same-change recovery](openspec-workflow.md#same-change-recovery). No automatic
sending, deployment, sync, or archive follows lesson completion.

## Contract and examples

Input: `{ jobDescription: string }` (nonblank, maximum 15,000 characters).
Output: `{ document, evidenceUsed, factsToVerify }`. Inspect the exact document
schema/parser rather than inventing a replacement type.

A React 18 project can support a React engineering summary for a React 19 posting;
it cannot establish React 19 usage. Source references permit supported synthesis,
not arbitrary new claims. A role bullet must reference that role's evidence.

Bounds from the current contract: headline 180 characters, summary 1,600, role
summary 1,200, bullet 900, project description 1,400; 1–40 skills, 1–16 roles,
0–8 bullets per role, 0–13 projects, 1–12 references per prose item, 0–10 optional
notes at 500 characters each, and maximum 100,000 model JSON characters.
Identity/employer/title/dates/education/links come from server assembly. Review
notes and raw source catalogs are excluded from the finished document.

## Acceptance checks

- Sign in as owner and open directly: submit a JD without Job Fit and see a complete résumé.
- Logged-out API call returns 401; guests receive 403 before evidence/model loading.
- Blank/oversized input fails before generation. Missing provider or fixture storage
  configuration is explicit; failures never return a fabricated document.
- Unknown, duplicate, cross-role/cross-project IDs and invalid bounds fail visibly.
- Compare immutable fields against approved profile facts and inspect every rewritten claim.
- Download HTML and copy text: same complete content and contact URLs as the preview,
  without evidence notes; previews execute no scripts or arbitrary external loads.
- Long output remains readable and complete; 375px/1440px layouts have no overflow.
- Denied copy/download reports failure while retaining the selected saved result.
  Pending or failed replacements preserve Current/Previous. Selecting a different
  saved version resets action feedback and never mislabels earlier content as new.
- Inspect public exports: no tailored result, private evidence, notes, credentials,
  or server bundle. The separate branch's intentional public `resume.pdf` contains
  approved public profile facts only and does not make tailored documents public.
- HTML/text actions neither change profile/template content nor attach/send mail.

Previous: [Lesson 5 — Interview Prep / Study Plan](03-career-plan.md) · Next: [Lesson 7 — Interview room](04-star-interview-responses.md).
