# Tasks

This documentation-only change follows `design.md`; application specifications are unchanged and delta specs are deliberately skipped. All tasks below are implementation work for the curriculum and remain unchecked until actually completed. Changes to application source, credentials, provider setup, live delivery, DNS, and the separate job-workspace feature are outside this change.

## 1. OpenSpec introduction and student readiness

- [x] 1.1 Add `exercises/openspec-workflow.md` with the confirmed lesson-at-a-time Explore -> refine -> Propose -> review -> Apply -> Verify sequence, supported assistant invocations, concrete named-change examples, and same-change recovery; verify no instruction proposes the entire series, starts implementation from explore/propose, or advances before lesson checks pass.
- [x] 1.2 Update `docs/pre-class.md` for OpenSpec CLI/integration readiness using read-only checks before any initialization, current supplied-feature status, and four career tool entries; verify setup commands match installed integration behavior, working routes are not described as expected 501s, and no credential file replacement is instructed.
- [x] 1.3 Record a baseline of existing good implementation prompts and the personalization extraction prompt in a review record under `docs/`, with source paths and exact-body hashes; verify it covers every preserved block and records the displayed lesson-to-legacy-path mapping without changing the prompt bodies.

## 2. Existing core exercises

- [x] 2.1 Update `exercises/00-personalize.md` with the displayed lesson order, copyable exploration wrapper, separate propose/review/apply instructions, and next link; verify both original good prompts match their baseline byte-for-byte and source-fact approval still precedes portfolio edits.
- [x] 2.2 Update `exercises/00-authentication.md` with a complete good prompt and all workflow stages using the existing Firebase Auth, Admin verification, signed role claims, session-cookie, and emulator boundaries; verify references match current source and checks include direct API denial without introducing custom session signing or role-dropdown authorization.
- [x] 2.3 Update `exercises/01-job-fit.md` with the same staged workflow and explicit current-supplied-versus-extension guidance; verify its original good prompt is unchanged, existing satisfied behavior is inspected rather than deleted, the score remains candid decision support, and other tools require no Job Fit result.
- [x] 2.4 Update `exercises/02-cover-letter.md` with the staged workflow and lesson navigation; verify its original good prompt is unchanged and checks retain supported advocacy, selected tone, actual 200-300 words, two real examples, separate optional verification notes, and explicit copy rather than sending.
- [x] 2.5 Update `exercises/03-career-plan.md` with the staged workflow and lesson navigation; verify its original good prompt is unchanged and checks retain one feature with interview/study modes, truthful stories, counts, four weeks, bounded weekly hours, and private notes.

## 3. Resume Tailor and interview-room lessons

- [x] 3.1 Expand `exercises/04-resume-tailor.md` into a complete lesson with purpose, current supplied behavior, prerequisites, full feature brief, staged OpenSpec instructions, and acceptance checks; verify its documented contracts and examples agree with `docs/resume-tailor.md`, canonical `resume-tailoring`, and current source, including independent owner access, immutable facts, HTML/text exports, and no implied PDF attachment or sending.
- [x] 3.2 Update `exercises/04-star-interview-responses.md` with staged OpenSpec instructions, displayed order, and current-code notes outside the preserved original prompt; verify the good prompt matches its baseline, legacy exercise 04 is resolved by the current title/path, and access, evidence, missing-media, reduced-motion, and guest-facing wording checks remain intact.

## 4. Inbox lesson

- [x] 4.1 Add `exercises/inbox.md` with a full bounded prompt, prerequisites, current supplied behavior, and Explore/Propose/review/Apply/Verify instructions; verify it accurately points to owner routes and the existing mailbox adapters/components without directing students to access the maintainer's live mailbox or rebuild completed application features.
- [x] 4.2 Add the inbox exercise's ordered local practice and observable checks for owner/guest denial, dashboard summary, folders, reading/replying, compose, saved-draft reopening, search/pagination, and failed/uncertain-send recovery; verify each action has an expected result and fixture sends are explicitly distinguished from external delivery.
- [x] 4.3 Include clearly identified practice or instructor-demo coverage for CC/BCC, forwarding, labels, contacts, attachments, safe HTML/remote images, and refresh; verify the lesson preserves explicit Send, stable retry identity, private attachments, visible errors, and supplied-versus-student-work distinctions using `docs/owner-inbox.md` and current source.

## 5. Contact form and resume email templates

- [x] 5.1 Add `exercises/contact-and-email-templates.md` with a full prompt, the same workflow stages, Inbox prerequisites, and public-to-private contact practice; verify checks cover input/origin/routing validation, retained failed input, fixture conversation creation, visitor Reply-To, duplicate prevention, and acceptance-versus-delivery wording without requiring live mail or DNS.
- [x] 5.2 Add template practice and completion checks for preview, explicit apply, editing HTML and text, preserving recipients/attachments, autosave/reopen, and explicit sending; verify examples match the supplied Send my resume template and do not imply a tailored-resume substitution, PDF attachment, or automatic send.

## 6. Verification, deployment, and complete class path

- [x] 6.1 Add `exercises/verification-and-deployment.md` using existing `npm run preflight`, responsive checks, Firebase guidance, and public-only Pages export; verify it teaches actual results and blockers, public/private artifact isolation, and separate authorization for live publication without modifying deployment configuration or initiating deployment.
- [x] 6.2 Update `README.md` to link the complete displayed lesson order from design, with current-supplied behavior, continuation lessons, and matching exercise previous/next links; verify every local path resolves, all old exercise URLs remain valid, and filename prefixes are not presented as the displayed sequence.
- [x] 6.3 Reconcile course-facing setup/deployment references and legacy-path notes with current Firebase/Vite behavior; verify searches find no active custom-auth, repeated-init, three-tool, expected-501, or whole-expanded-series-in-90-minutes instructions, while deliberately preserved historical prompt text and labeled bad examples remain clearly contextualized.

## 7. Slides for the workflow and existing lessons

- [x] 7.1 Establish a readable slide source under `docs/slides/` and document how it produces the stable HTML/PDF delivery filenames without adding application dependencies; verify the authoring source contains editable text, preserves the existing visual language and presenter support, and its documented export procedure is runnable without a standalone HTTP server.
- [x] 7.2 Update opening/agenda/setup/workflow slides for the expanded series and one lesson change at a time; verify explain/action labels, planning review gates, current implementation status, a bounded introductory-session stopping point, and continuation positioning agree with the exercises.
- [x] 7.3 Update portfolio, authentication, Job Fit, Cover Letter, and Interview Prep / Study Plan slides to the staged workflow and current application behavior; verify their original prompt content comes from the canonical exercise blocks, any continuation slides preserve the complete paste order, and stale custom-auth/501/three-tool guidance is removed.

## 8. Slides for additional lessons and completion

- [x] 8.1 Add complete Resume Tailor and interview-room slide lessons with purpose/current state, exploration/refinement, proposal review, apply/verify, and observable checkpoints; verify text and constraints match their exercises and no missing media or unimplemented export is presented as delivered.
- [x] 8.2 Add complete Inbox slides with its workflow and local practice checkpoints; verify folder/conversation/draft/reply/recovery examples match the exercise and distinguish local fixtures from real delivery throughout.
- [x] 8.3 Add contact/template slides with workflow and checkpoints for fixture submission/reply and template preview/apply/customize/reopen; verify recipients/attachments remain explicit, template examples use approved public profile content, and sending remains a deliberate action.
- [x] 8.4 Update verification/deployment and closing slides to match the final lesson, supplied feature count, public-only Pages/full Firebase distinction, and continuation scope; verify they make no automatic live deployment, live mail, or job-workspace completion claim.

## 9. Export and integration review

- [x] 9.1 Regenerate `docs/slides/portfolio-career-workspace.html` and `.pdf` from the final source, including lesson navigation, page totals, speaker notes, and speaker-view thumbnails; verify both outputs exist, are nonempty, and contain the same instructional topics and slide order with current totals.
- [x] 9.2 Inspect all slides and PDF pages for legible prompts, clipping, missing assets, and consistent styling, and exercise HTML keyboard navigation and speaker view; record results in the curriculum review record and verify local-file inspection or approved emulator hosting uses no standalone server.
- [x] 9.3 Complete an end-to-end materials walkthrough from setup through the final lesson; verify all relative links, displayed lesson numbers, preserved-prompt hashes, per-lesson Explore/Propose/review/Apply/Verify gates, original source-fact approval, and next-lesson transitions, recording actual pass/fail results without completing unrelated feature tasks.
- [x] 9.4 Run `git diff --check` and `openspec validate expand-course-with-openspec-workflow --strict --json`, and inspect the curriculum change's file list; verify edits are limited to authorized course material, record that application/credential/deployment files were not changed by this work, and leave all failed or unperformed review items unchecked. Run `npm run preflight` if routing, authentication, or builds were changed under separately approved scope; documentation-only edits do not require an unrelated runtime change or test expansion.

## Workflow follow-up

- Present the completed curriculum and recorded review evidence before any separately requested commit, publication, specification sync, or archive.
- Students use a separate named change for each lesson; this curriculum-authoring change does not authorize applying all student feature changes together.
