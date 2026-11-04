# Design

## Context

See `proposal.md` for motivation and scope. Design is included because the workflow spans setup, seven existing exercise files, new lessons, and two synchronized slide formats; preserving original prompts while changing when they execute needs an explicit decision.

The README currently links six exercises. `exercises/04-resume-tailor.md` exists separately, and both it and the interview-room exercise use an `04` filename prefix. The 51-slide self-contained HTML deck embeds presentation libraries and speaker-view thumbnails; its PDF is a separate artifact. No readable authoring source or export command was found. Some slide prompts differ from the corresponding exercise prompts, and the deck contains custom-auth/session-secret and unfinished-tool guidance that no longer matches Firebase authentication and the implemented tools.

Canonical `career-tool-guidance` and `resume-tailoring` specifications govern application behavior. Inbox documentation and its active change distinguish implemented local fixture acceptance from uncompleted live activation. A separate job-workspace change is in progress. This curriculum work does not change those contracts or complete those features.

## Goals / Non-Goals

**Goals:** Give students a repeatable workflow with explicit planning and implementation gates; preserve established prompts and evidence checks; cover every agreed lesson in exercises and slides; keep links and exported materials coherent.

**Non-Goals:** Application changes, a new starter branch or reset mechanism, account provisioning, live email or DNS operations, application PDF attachments, durable job workspaces, rewriting OpenSpec skills/configuration, or a new presentation platform. Generating the course PDF is separate from generating application documents.

## Decisions

### 1. One lesson change at a time

The user confirmed that students apply each lesson before starting the next. Teach this sequence in the workflow introduction and repeat a short version in each exercise and its action slides:

```text
Explore the current lesson using its existing prompt
  --> Review examples, questions, and acceptance checks
  --> Refine until the approach is satisfactory
  --> Propose a named change for this lesson only
  --> Review proposal, design, specs when applicable, and tasks
  --> Explicitly apply that named change
  --> Verify the lesson's actual outcomes
  --> Begin the next lesson
```

There is one initial apply instruction for the whole current lesson's task list, not one apply per prompt line. A failed or interrupted lesson is resumed under the same named change; students do not skip verification to preserve an artificial one-command guarantee. Already-satisfied work is verified, not removed and rebuilt. Lesson completion never implies automatic deployment, sending, sync, or archive.

**Alternative considered:** Propose the whole series and apply it in one operation. Rejected because it conflicts with the confirmed lesson-by-lesson sequence and delays feedback.

### 2. Preserve original prompts inside an explicit exploration wrapper

Keep existing good implementation prompts and the personalization extraction prompt byte-for-byte. Add the current lesson's displayed title and file path outside those preserved blocks. Old exercise numbers inside a preserved prompt are historical identifiers resolved by that surrounding context, not instructions to work on another lesson. Keep bad-prompt examples visibly labeled as examples students must not execute.

The new copy-ready exploration block begins with the assistant's supported OpenSpec explore invocation and an outer instruction equivalent to:

```text
Explore only the current lesson named below. The original prompt is a
feature brief: treat its implementation verbs as the desired outcome.
Inspect the existing project, identify what already works, discuss open
questions and tradeoffs, and agree on the acceptance checks.
Do not edit implementation files or create planning artifacts yet.
```

The original prompt follows within that same copyable block so copying only the old imperative text is not the primary classroom action. Label any separate original-prompt reference as reference material. Preserve the existing fact-review gate before portfolio edits. Discussion answers do not count as consent to write.

The next copyable instruction invokes propose for a concrete lesson change using the agreed discussion. Review the resulting artifacts before a separate apply instruction naming that exact change. In Codex the local skills are `$openspec-explore`, `$openspec-propose`, and `$openspec-apply-change`; other installed assistant integrations may expose slash forms. Show assistant prompts separately from terminal commands and verify available integration syntax when preparing the setup guide.

Authentication and Resume Tailor currently lack comparable full good-prompt blocks. Author their missing prompts from current exercise requirements and implementations; do not imply a historical prompt existed. Author new Inbox and contact/template prompts the same way. Slides reuse the canonical exercise prompt text instead of maintaining a shorter divergent version.

**Alternative considered:** Rewrite every prompt to say only 'explore.' Rejected because the user asked to retain the same prompts, including their concrete constraints and checks.

### 3. Stable paths, one displayed lesson order

Use the following order in the README, exercise headings/navigation, slide agenda, and presenter notes. Preserve all existing exercise paths; filename prefixes are legacy identifiers, not the new displayed sequence.

| Display order | Topic | Exercise path | Course work |
|---|---|---|---|
| 0 | OpenSpec workflow | `exercises/openspec-workflow.md` | New setup, practice, review gates, and recovery guide |
| 1 | Personalize your portfolio | `exercises/00-personalize.md` | Preserve extraction/implementation prompts and approved-facts gate |
| 2 | Firebase authentication | `exercises/00-authentication.md` | Add a complete prompt; align Firebase role/session teaching |
| 3 | Job Fit | `exercises/01-job-fit.md` | Preserve the original prompt and candid-fit outcomes |
| 4 | Cover Letter | `exercises/02-cover-letter.md` | Preserve the original prompt, word limit, tone, and evidence checks |
| 5 | Interview Prep / Study Plan | `exercises/03-career-plan.md` | Preserve one feature/two modes and original prompt |
| 6 | Resume Tailor | `exercises/04-resume-tailor.md` | Expand into a complete lesson, prompt, and acceptance checks |
| 7 | Interview room | `exercises/04-star-interview-responses.md` | Preserve the original prompt and add corresponding slides |
| 8 | Inbox | `exercises/inbox.md` | New full exercise and slides |
| 9 | Contact form and resume email templates | `exercises/contact-and-email-templates.md` | New integration exercise and slides |
| 10 | Verification and deployment | `exercises/verification-and-deployment.md` | New exercise organizing existing checks and deployment guidance |

Each feature lesson contains purpose, current supplied behavior, its bounded learning task, prerequisites, the exploration/proposal/apply instructions, expected observable results, acceptance checks, and the next lesson link. The teaching sequence is not an application dependency: owners can still run career tools independently without a Job Fit score or preceding result.

**Alternative considered:** Rename every old numbered file. Rejected to retain saved links and keep original prompt references interpretable.

### 4. Teach the supplied app honestly

Setup installs and verifies OpenSpec and the chosen assistant integration alongside existing project prerequisites. Run read-only project checks first; explain initialization only for a genuinely uninitialized student project, never as a step to repeat in an already-configured clone. Do not change this repository's workflow configuration or skills as part of course editing.

Describe current tools as supplied implementations students inspect, verify, and extend within the agreed lesson scope. Remove expected-501 instructions where working routes now exist. Explain explicit missing-provider configuration separately from an unfinished endpoint. Four career tool entries exist; Interview Prep and Study Plan are modes of one tool. Teach Firebase Auth email/password, server-assigned `portfolioRole`, Admin-verified four-hour sessions, and direct route/API denial. Do not teach custom session signing or client-selected authorization.

Preserve historical prompt text even if an implementation name has moved: put a current-code note outside the preserved block, pointing to the current equivalent and retaining the intended behavior. Do not alter application code to match an old instructional path.

Keep the expanded material as a multi-lesson series. Replace any blanket 90-minute promise with an explicitly bounded introductory session and continuing lessons; no expanded-series duration is promised.

### 5. Inbox and contact/templates have distinct learning outcomes

Inbox teaches private state and reliable asynchronous operations: owner-only access; dashboard counts; folders and conversations; compose, reply/reply-all/forward; drafts and save states; search/filters/pagination; labels/contacts; attachments; inert HTML/remote-image controls; refresh; and recoverable failed or uncertain sends. The core student acceptance flow is reading, composing, reopening a saved draft, replying, and checking failure/role denial. Less common controls can be instructor demonstrations, but their supplied-versus-exercise status must be explicit.

Contact/templates follows Inbox and teaches public-to-private delivery boundaries and reusable document content: validate a public submission, observe its fixture inbox conversation, reply to the visitor, preview and apply Send my resume, customize both text and HTML, reopen the saved draft, and preserve recipients/attachments. Preview does not change a draft; applying a template changes the current copy; Send remains an explicit action. The existing template does not imply a PDF attachment or automatically use a tailored resume.

Use deterministic in-process mail fixtures with Firebase Auth, Hosting, and Functions emulators. Teach environment variable names without values and preserve existing credentials; use isolated fixture configuration, not instructions to overwrite `.env.*`. Acceptance means local fixture behavior, not confirmed external delivery. Provider provisioning, deployed routes, webhooks, receiving DNS cutover, and controlled real email round trips remain separately authorized operational work.

The student-facing guides must use their own approved identity in explanations; the repository's fixed owner/mailbox configuration is described accurately without directing students to access or modify the maintainer's live mailbox. Generalizing that application configuration requires a separate application change.

### 6. Maintain one slide content source and paired exports

Keep the existing deck's visual style, explain/action distinction, and presenter support. Establish a readable source under `docs/slides/` and document its export procedure there without adding a runtime dependency or unrelated tooling platform. Keep delivery filenames `portfolio-career-workspace.html` and `portfolio-career-workspace.pdf` stable. If the existing HTML can itself become the readable source, a second source file is unnecessary.

Each feature topic gets purpose/current-state teaching, an explore/refine action, proposal review, apply/verify instructions, and an observable completion checkpoint. Long preserved prompts span readable continuation slides; label their complete paste order and retain the full copyable block in the exercise. Do not shrink prompt text to fit or replace it with a divergent summary presented as the exact prompt.

Regenerate agenda, lesson navigation, slide numbers/totals, speaker notes, and speaker-view thumbnails together. The PDF contains the same instructional slide order and visible content as HTML. Existing closing material remains unless it makes a promise contradicted by the expanded course. Opening the self-contained deck from a local file and inspecting local PDF output need no standalone HTTP server; app examples use only the approved Firebase emulators.

**Alternative considered:** Append Inbox slides to the current 51-slide export and leave the rest unchanged. Rejected because it retains stale prompts, authentication guidance, and navigation and leaves PDF/HTML content inconsistent.

### 7. Documentation-only OpenSpec handling

This change declares `skip_specs: true`. The spec-driven proposal instructions explicitly allow this for pure documentation changes without system behavior changes, and the specs instruction confirms that no delta files should be created with this marker. Requirements for course coverage and verification live here and in `tasks.md`; neither canonical application specs nor other active changes are modified.

## Risks / Trade-offs

- [An old 'Implement' prompt escapes exploration] -> Make the wrapper and original brief one primary copyable block, repeat the no-edit boundary, and review before propose/apply.
- [A fixed apply count is mistaken for guaranteed success] -> Teach one initial apply per lesson and same-change recovery until checks actually pass.
- [Preserving old prompt text leaves stale names or historical exercise numbers] -> Provide a clear current-title/path mapping and code-reference notes outside the preserved blocks.
- [Application work progresses while the course is edited] -> Verify current source and change status before finalizing examples; document only shipped behavior and keep pending features separate.
- [The large embedded deck diverges from PDF or speaker view] -> Use one readable source and inspect all exported formats and updated thumbnails/navigation.
- [Mail fixtures are mistaken for real sending] -> Label fixture demonstrations and place live activation outside classroom completion criteria.
- [The series becomes too dense for an introductory session] -> Mark a stopping point after the original core sequence and present later lessons as continuation material without compressing acceptance checks.

## Migration Plan

1. Capture the current canonical exercise prompts for byte-preservation checks during implementation, and establish the displayed lesson map.
2. Update setup and existing exercises, then add missing exercises following their lesson prerequisites.
3. Update slide source/content and export matching HTML/PDF materials; reconcile all cross-links and displayed order.
4. Record a curriculum review covering prompt preservation, local links, complete workflow gates, status accuracy, and all slide/export checks. Preserve unrelated work in the tree.

Release consists of reviewed documentation changes only. Deployment is a later explicit action. Rollback restores only the course files from this change, retaining the stable original paths and leaving application work, profiles, environment files, and unrelated edits intact.
