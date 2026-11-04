# Lesson 10 — Verification and deployment

## Purpose, supplied behavior, and prerequisites

Turn completed lesson checks into a reviewable release decision. Finish Lessons
0–9 first. Existing preflight, Pages export, Firebase packaging and emulator
harnesses are supplied. Your task is to run/inspect them, explain results, and
agree on any bounded verification improvement. Deployment is a later explicit action.

## Explore and refine — assistant chat

Prerequisites and acceptance checks below define this lesson's scope. Copy this
whole block, including the wrapper. Discuss what already works and agree on one
bounded improvement or verification task before proposing. Use the corresponding
installed invocation for other assistants from [Lesson 0](openspec-workflow.md).

```text
$openspec-explore
Explore only Lesson 10 — Verification and deployment in exercises/verification-and-deployment.md.
The original prompt below is a feature brief: its implementation verbs describe
our desired outcome. Inspect supplied behavior, discuss unknowns and tradeoffs,
and refine the acceptance checks with me. Do not edit implementation files or
create planning artifacts yet. Preserve satisfied behavior and unrelated work.

Review the completed current project and lesson evidence without publishing.
Inspect package.json, docs/deploy-firebase.md, public export allowlists and the
Firebase packaging boundaries. Preserve routing/auth/build configuration.
Use npm run preflight and record actual test, lint, type, build, export and emulator
HTTP outcomes. Use only Auth, Hosting and Functions emulators for app HTTP checks.
Inspect 375px and 1440px layouts, focus, reduced motion, stale-state and error flows.
Check direct owner/guest API boundaries, private interview media and source evidence.
Firebase Hosting serves dist/hosting with dynamic/private requests in Functions.
GitHub Pages serves only dist/pages public output with backend-unavailable guidance.
Never copy a server bundle, environment files, raw resumes, interview recordings,
private workspace artifacts, tailored results or personal notes into a public export.
The separate branch's intentional public resume.pdf uses only approved public facts.
Record pass/fail/unperformed with evidence and retain blockers. Do not mark an
unrun provider, real email, deployment or job-workspace acceptance check complete.
Prepare a target-specific release checklist for review; publication requires
separate explicit authorization. Do not deploy, provision, change DNS or send mail.
```

## Propose, review, then Apply

After exploration is satisfactory, send this separate assistant instruction:

```text
$openspec-propose lesson-verification
Use our agreed Lesson 10 discussion only. Preserve satisfied behavior.
Write planning artifacts; do not implement yet.
```

Review the proposal, design, applicable specs, and tasks. Confirm the named files,
role boundaries, evidence rules, failure cases, and this lesson's observable checks.
Correct the plan before proceeding. Then explicitly send:

```text
$openspec-apply-change lesson-verification
Implement the reviewed lesson tasks and report actual verification results.
```

## Verify before continuing

Run the lesson checks below and record expected versus actual results. Inspect
supplied behavior instead of removing working features. An unchecked or failed
check keeps this lesson open. Resume the same `lesson-verification` change after diagnosis;
see [same-change recovery](openspec-workflow.md#same-change-recovery). No automatic
sending, deployment, sync, or archive follows lesson completion.

## Local verification sequence

1. Inspect `git status` and preserve unrelated work. Read the scripts in
   `package.json` and [Firebase guidance](../docs/deploy-firebase.md).
2. In the terminal run `npm run preflight`. Record actual exit status and the
   unit/lint/types/build/export/emulator results. The existing harness creates an
   isolated Functions package with synthetic settings; it does not need to replace
   credential files or call a paid provider. If a stage fails, diagnose and rerun
   the affected check; unperformed later stages remain open.
3. Run the approved fixture UI walkthrough via `npm run test:mail:browser` for mail
   behavior. App HTTP checks use only Firebase Auth, Hosting and Functions emulators.
   Open the printed Hosting origin; never launch a standalone server.
4. Inspect the portfolio and private flows at 375px and 1440px: no horizontal
   overflow, visible keyboard focus, usable copy/error states and reduced motion.
   Request private APIs and recordings directly as logged-out, guest and owner.
5. Inspect generated `dist/pages` and `dist/hosting` allowlists and build tests.
   Search for accidental raw documents, environment/server files and private data
   without printing keys or confidential content. Confirm only approved public
   profile facts enter the intentional standard résumé PDF when that branch is used.
6. Complete the record below; return to the same named change for any failure.

| Check | Expected | Record actual result/evidence |
|---|---|---|
| Preflight | All configured stages pass | command, exit code, failing stage or pass |
| Responsive/keyboard | Both viewports usable, focus visible, no overflow | viewport and observation |
| Direct access | 401 absent session; 403 guest on owner APIs; protected media guarded | route, role, status |
| Public isolation | No source evidence, private media/workspaces, tailored results, credentials or server bundle | export inspection/build test |
| Mail | Fixture acceptance/recovery only; explicit Send | fixture scenario and actual outcome |
| Provider quality | Claims sourced, useful prose, constraints satisfied | separately controlled real-provider evidence or unperformed |
| Publication | Target, artifact scope, account/roles, rollback reviewed | authorization and deployed evidence or unperformed |

## Choose the release target deliberately

| Target | Artifact | Expected capability |
|---|---|---|
| GitHub Pages | `npm run build:pages` → `dist/pages`; `BASE_PATH=/YOUR_REPOSITORY/` for a project site | Public portfolio only; private routes explain Firebase backend requirement; contact sending disabled |
| Firebase | `npm run build:firebase` → `dist/hosting` plus private Functions package | Hosting assets with authenticated dynamic pages/APIs through Functions and Firebase Auth |

These build commands prepare artifacts; they do not publish. The course PDF is
an instructional deck export, independent of application PDF documents.
Never copy the server bundle, environment files, private interview media or
workspace fixture storage into Pages or Hosting's public directory.

For a future Firebase release, review the guide's target project, account
provisioning, server-assigned claims, backend configuration, provider/storage
readiness and rollback with the instructor before separately authorizing deployment.
Create a missing project-specific environment file only after approval; never copy
a template over an existing one or move keys between environments. Production
provisioning, receiving DNS and external email round trips need their own evidence.
A successful build is not deployed-runtime proof. Keep any separate job-workspace
change's unfinished tests and live gates open.

Completion: report what passed, what failed/unperformed, and the next concrete
fix. Begin release work only after the review and separate authorization.

Previous: [Lesson 9 — Contact form and resume email templates](contact-and-email-templates.md) · Finish: [course index](../README.md#class-path).
