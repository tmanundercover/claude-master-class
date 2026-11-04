# Curriculum review — expand-course-with-openspec-workflow

Review date: 2026-11-04. Curriculum implementation and review are complete.
Application specifications and the separate job-workspace change remain under
their own ownership. No publication, sync, archive, provider operation or runtime
implementation is performed by this curriculum change.

## Coordination and prompt preservation

The user confirmed that the job-workspace session finished and released
`exercises/03-career-plan.md` before its baseline capture or curriculum edits.
The released good prompt is preserved byte-for-byte, including owner-private
notes persisted separately from generated content. The other session's saved
Current/Previous acceptance wording and privacy table also remain intact.
A whole-file handoff digest is recorded alongside the career prompt digest.

[curriculum-prompt-baseline.json](curriculum-prompt-baseline.json) records all six
original blocks: five implementation prompts and the personalization extraction
prompt. SHA-256 covers exact UTF-8 fence-body bytes including the final newline;
new exploration wrapper bytes are excluded. All six pass after the final export.
Authentication, Resume Tailor, Inbox, contact/templates and verification prompts
are newly authored, rather than claimed historical baselines.

| Displayed lesson | Stable exercise path | Historical identifier |
|---|---|---|
| 0 OpenSpec workflow | `exercises/openspec-workflow.md` | New |
| 1 Personalize your portfolio | `exercises/00-personalize.md` | 00 |
| 2 Firebase authentication | `exercises/00-authentication.md` | 00A |
| 3 Job Fit | `exercises/01-job-fit.md` | 01 |
| 4 Cover Letter | `exercises/02-cover-letter.md` | 02 |
| 5 Interview Prep / Study Plan | `exercises/03-career-plan.md` | 03 |
| 6 Resume Tailor | `exercises/04-resume-tailor.md` | 04 résumé |
| 7 Interview room | `exercises/04-star-interview-responses.md` | 04 interview |
| 8 Inbox | `exercises/inbox.md` | New |
| 9 Contact form and resume email templates | `exercises/contact-and-email-templates.md` | New |
| 10 Verification and deployment | `exercises/verification-and-deployment.md` | New |

Filename prefixes remain legacy identifiers. The displayed order above agrees
with README, every heading, previous/next links, slide agenda and presenter notes.
Personalization's original extraction block appears before its implementation
brief in the deck; copy-ready blocks include the no-edit exploration wrapper.
Source-fact approval precedes the portfolio proposal, and proposal review precedes
explicit Apply. Every lesson is verified before starting the next named change.

## Materials walkthrough

- [x] Read OpenSpec context; root is configured, schema is spec-driven, delta specs deliberately skipped.
- [x] Read setup through Lesson 10 in displayed order; all 11 lesson headings and stable paths agree.
- [x] All six original prompt bodies match their pre-edit baseline hashes.
- [x] Source-fact approval still precedes portfolio edits and remains separate from plan approval.
- [x] Every feature lesson has Explore/refine, named Propose, artifact review, separate Apply and Verify/recovery gates.
- [x] README order and all previous/next transitions agree; all local links and Markdown anchors resolve.
- [x] Full exploration blocks match the concatenated slide prompt parts exactly, including complete paste order.
- [x] Four career entries remain independently accessible; Interview Prep / Study Plan remains one entry with two modes.
- [x] Active setup/deployment teaching has no custom-auth, repeated initialization, expected unfinished-endpoint, three-tool or whole-series duration instruction.
- [x] Introductory stopping point after Lesson 5 and continuation Lessons 6–10 are explicit.
- [x] Inbox/contact practice distinguishes fixtures, deliberate Send, acceptance and actual external delivery.
- [x] Final source/status reviewed; private saved versions and notes are preserved during failed replacements.

Run `node docs/review-curriculum.mjs` to repeat the materials checks. Actual
results are in [curriculum-materials-review.json](curriculum-materials-review.json):
11 lessons, six preserved blocks, all checked links, zero failed checks. These
are materials checks and do not assert that a student ran the application lessons.

## HTML, PDF and presenter review

[Slide review results](curriculum-slide-review.json) record a passing final file-only
review: 91 HTML slides, 91 nonempty PDF pages, matching totals and topic order,
zero title/prompt mismatches, zero clipped HTML elements, no missing assets or page
errors. The independent PyMuPDF extractor finds each complete prompt part on its
corresponding PDF page. No application dependencies were added for these tools;
PDF inspection used an isolated temporary Python tool installation.

All HTML slides and PDF pages were visually inspected through eight contact
sheets per format, with dense prompts and presenter views also opened at full
size. The final handoff-related content changes were reinspected in both formats.
Prompts stay 24px monospace on the 1600×900 design canvas and span labeled
continuation slides. The control strip sits below slide content, preserving
footer text. Staged fragments in the retained closing table were expanded before
inspection, with opacity settled. Reduced-motion screenshots avoid sampling
entrance animations halfway through; the deck honors reduced-motion preferences.

Arrow/Page Down navigation, Esc overview and lesson jumps passed. Presenter view
has 91 thumbnails, actual notes, current/next previews, bidirectional selection
sync and no next preview at the end. Thumbnails derive from the current DOM.
The original poll, instructor, rationale and program/advisor closing material is
retained. Existing program figures are not independently refreshed and are not
new employment guarantees. Publication is never implied by course completion.

The initial review's poll-slide navigation target and PDFKit text-extraction
issues were resolved before acceptance; only passing final results are recorded.
Export and review used local `file:` URLs with no standalone server or emulator
process. Application examples require only Auth, Hosting and Functions emulators.

Final local screenshots, contact sheets and extracted text are in:
`/var/folders/nz/7z5wsn4n00d3wl9391730bhc0000gn/T/portfolio-curriculum-review-rpyY9o`.
These are temporary local inspection artifacts, not shipped public assets.

## Current feature status and source review

The final read-only OpenSpec snapshot shows:

- `add-job-workspaces-and-versioned-artifacts`: 41/42 tasks complete.
- `add-resend-owner-inbox`: 34/40 tasks complete.

Remaining job-workspace acceptance tasks at review:

- 8.2 Verify the live repository against an identified nonproduction Firestore database/private bucket with synthetic records, covering durable write/read across restart, manifests/hashes, concurrent promotion, undo/swap back, two-version retention/cleanup, private downloads, and configuration failure; record project/mode/results without secrets. If resources or authorization are unavailable, record the concrete blocker and leave this task unchecked rather than treating fixtures as live proof.

Current code and workspace docs show the local branch implementations: saved
job workspaces, Current/Previous artifacts, private notes, PDF preparation and
explicit application-email preparation. The course acknowledges those supplied
behaviors while leaving their remaining acceptance and live gates open. This
curriculum does not complete their tasks or claim live storage, deployment, DNS
or external mail delivery. The separate session's runtime evidence remains its
own evidence; it is not reported as this session's application test run.

Career-plan notes and saved-pair behavior are preserved after the handoff. Resume
Tailor lesson wording and slides now describe retained saved versions and reset
version-specific export feedback, following the current workspace implementation.
Its existing canonical HTML/text contract predates the concurrent delta; no
canonical specs were changed here. HTML/text actions still do not attach/send
mail, and Send my résumé remains distinct from the Job application template.

Workspace docs were read without editing: `docs/job-workspaces.md`,
`docs/resume-tailor.md`, and `docs/owner-inbox.md`. Fingerprints after the handoff
read match at final verification. Owner-inbox setup prose still describes an older
test environment replacement; current `scripts/test-firebase-emulator.mjs` creates
an isolated Functions package with synthetic settings instead. Course setup follows
that current source behavior and preserves credential files. The workspace docs
were left untouched as requested.

## Scope and validation

The following files were authored or changed by this curriculum session. All
other dirty-tree changes belong to the other session and were preserved. After
the user-confirmed release, edits to `exercises/03-career-plan.md` were limited to
curriculum wrappers, current-code context, heading and navigation; its released
prompt and saved-version/privacy acceptance changes were retained.

```text
README.md
docs/curriculum-materials-review.json
docs/curriculum-prompt-baseline.json
docs/curriculum-review.md
docs/curriculum-slide-review.json
docs/deploy-firebase.md
docs/pre-class.md
docs/review-curriculum.mjs
docs/slides/README.md
docs/slides/brand.css
docs/slides/course.css
docs/slides/course.mjs
docs/slides/export.mjs
docs/slides/fonts.css
docs/slides/logo.svg
docs/slides/pdf-review.py
docs/slides/portfolio-career-workspace.html
docs/slides/portfolio-career-workspace.pdf
docs/slides/presenter.js
docs/slides/retained-slides.html
docs/slides/reveal.css
docs/slides/reveal.js
docs/slides/review.mjs
exercises/00-authentication.md
exercises/00-personalize.md
exercises/01-job-fit.md
exercises/02-cover-letter.md
exercises/03-career-plan.md
exercises/04-resume-tailor.md
exercises/04-star-interview-responses.md
exercises/contact-and-email-templates.md
exercises/inbox.md
exercises/openspec-workflow.md
exercises/verification-and-deployment.md
openspec/changes/expand-course-with-openspec-workflow/tasks.md
```

`git diff --check` and
`openspec validate expand-course-with-openspec-workflow --strict --json` passed,
with the expected documentation-only skip_specs information. Application source,
credential files, packages, build scripts and deployment configuration were not
changed by this curriculum work. `npm run preflight` was not run by this session
because routing, authentication and application builds were not changed; it is
still a student verification command in the course. No unrelated runtime test
expansion, deployment, provisioning, email delivery, sync or archive occurred.

Syntax/setup references checked during authoring:
[OpenSpec command forms](https://github.com/Fission-AI/OpenSpec/blob/main/docs/how-commands-work.md),
[OpenSpec installation](https://github.com/Fission-AI/OpenSpec#quick-start),
[official Codex IDE setup](https://developers.openai.com/codex/ide/).
