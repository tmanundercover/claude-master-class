# Lesson 4 — Cover Letter

## Why

Reuse reviewed knowledge to produce relevant writing, then separate generation
from factual verification and the final decision to send.

## Prerequisites and current supplied behavior

Complete the preceding lesson checks and verify owner authorization. The route,
word-count validation, result presentation and copy feedback are supplied. Inspect
and verify them, then propose one bounded improvement. The teaching order does not
require a Job Fit result; owners can open Cover Letter directly.

## Work

Inspect the supplied `src/server/routes/cover-letter.ts` and its result presentation in
`src/components/ToolWorkbench.tsx`. Reuse the authenticated request/model patterns
from the Job Fit lesson rather than duplicating them. Keep all existing checks.
The current compatibility route delegates through `src/server/routes/job-workspaces.ts`
to shared server generation/analysis. This is a code-location note outside the
preserved original prompt, not a request to rewrite working behavior.

Request: `{ jobDescription: string, tone: "formal" | "conversational" | "technical" }`.
Include company and role inside the pasted JD; the form has no separate fields.
Return the `LetterResult` contract:

```text
letter: string
evidenceUsed: string[]
factsToVerify: string[]
```

## Current writing stance

Act as a confident candidate advocate. Permit supported paraphrasing, synthesis, and accurate employer terminology. Connect documented contributions to the role without unnecessary apologies about wishlist gaps. Keep specific uncertainties separate; factsToVerify may be empty. Adjacent technology versions can support relevant engineering claims without claiming unsupported exact usage.

The model receives substantive roles, bullets, projects, and skills from the consolidated profile on the server, separately from the untrusted job description. Each tool can be opened directly; running Job Fit first is optional.

## Explore and refine — assistant chat

Prerequisites and acceptance checks below define this lesson's scope. Copy this
whole block, including the wrapper. Discuss what already works and agree on one
bounded improvement or verification task before proposing. Use the corresponding
installed invocation for other assistants from [Lesson 0](openspec-workflow.md).

```text
$openspec-explore
Explore only Lesson 4 — Cover Letter in exercises/02-cover-letter.md.
The original prompt below is a feature brief: its implementation verbs describe
our desired outcome. Inspect supplied behavior, discuss unknowns and tradeoffs,
and refine the acceptance checks with me. Do not edit implementation files or
create planning artifacts yet. Preserve satisfied behavior and unrelated work.

Build the cover-letter exercise using the existing form and protected API.
Reuse the server provider and validation pattern from job fit.
Generate a 200-300 word draft using only the verified profile and supplied JD.
Use the selected tone, correct company/role, and two relevant real examples.
Never invent metrics, skills, company news, connections, or recipient details.
Return letter, evidenceUsed, and factsToVerify; validate all fields at runtime.
Keep the letter separate from verification notes in the UI.
Add a copy button with visible success/failure feedback; do not auto-send.
Surface configuration, provider, parsing, and clipboard errors.
Preserve other routes and auth. Add focused tests and run checks.
```

## Propose, review, then Apply

After exploration is satisfactory, send this separate assistant instruction:

```text
$openspec-propose lesson-cover-letter
Use our agreed Lesson 4 discussion only. Preserve satisfied behavior.
Write planning artifacts; do not implement yet.
```

Review the proposal, design, applicable specs, and tasks. Confirm the named files,
role boundaries, evidence rules, failure cases, and this lesson's observable checks.
Correct the plan before proceeding. Then explicitly send:

```text
$openspec-apply-change lesson-cover-letter
Implement the reviewed lesson tasks and report actual verification results.
```

## Verify before continuing

Run the lesson checks below and record expected versus actual results. Inspect
supplied behavior instead of removing working features. An unchecked or failed
check keeps this lesson open. Resume the same `lesson-cover-letter` change after diagnosis;
see [same-change recovery](openspec-workflow.md#same-change-recovery). No automatic
sending, deployment, sync, or archive follows lesson completion.

## Acceptance Checks

- Unauthenticated/invalid requests fail before generation.
- Unsupported tones fail validation.
- Draft names the correct role/company and uses only true examples.
- Gaps are not rewritten as strengths; unknowns stay in verification notes.
- Validate the actual 200-300 word requirement; revise generation if needed.
- Copy feedback is accurate; failure is visible.
- A letter is never sent or stored publicly by this tool.

## Boundaries, Do's and Don'ts

| Boundary | Do | Don't |
|----------|----|-------|
| Scope | Reuse authenticated provider code; implement this route and result UI | Rewrite authentication or change the other result contracts |
| Facts | Use two true examples and separate unknowns into notes | Invent experience, metrics, company news, or recipient details |
| Output | Enforce 200-300 words at runtime and retain selected-tone instructions | Accept valid JSON as proof that content constraints pass |
| User control | Copy only on request; report clipboard errors | Auto-send, auto-apply, or publish drafts |

## Bad Prompt

```text
Write whatever gets me hired. Invent stronger results, ignore the word limit,
and email the letter to the recruiter automatically.
```

This trades truth for persuasion and takes an external action without review.

Previous: [Lesson 3 — Job Fit](01-job-fit.md) · Next: [Lesson 5 — Interview Prep / Study Plan](03-career-plan.md).
