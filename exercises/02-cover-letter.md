# 02 - Build the Cover Letter Generator

## Why

Reuse reviewed knowledge to produce relevant writing, then separate generation
from factual verification and the final decision to send.

## Work

Implement `src/server/routes/cover-letter.ts` and its result presentation in
`src/components/ToolWorkbench.tsx`. Reuse the authenticated request/model patterns
from exercise 01 rather than duplicating them. Keep all existing checks.

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

## Good Prompt

```text
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
