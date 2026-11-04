# Tasks

## 1. Candidate evidence and résumé result contracts

- [x] 1.1 Add a server-only consolidated-profile evidence projection with source IDs, readable role/bullet/project/skill content, and parent associations; verify fixture tests include actual supporting text, retain older relevant work, and exclude the historical archive and unapproved inputs.
- [x] 1.2 Define the model schema and runtime parser for rewritten headline/summary, selected skills, rewritten experience and projects, references, and separate verification notes; verify valid paraphrases pass while malformed shapes, duplicates, oversized output, missing references, and cross-role references fail.
- [x] 1.3 Assemble a whitelisted display document using source-owned identity, contacts, education, employers, titles, periods, and project links plus validated rewritten prose; verify sentinel tests exclude the full evidence catalog/private notes and prove model output cannot replace immutable metadata.
- [x] 1.4 Document the evidence source, model/display contracts, output bounds, and source-reference limitations in `docs/resume-tailor.md`; verify examples match the parser fixtures and explicitly permit rewritten prose rather than copied text.

## 2. Candidate-oriented model instructions

- [x] 2.1 Add the Resume Tailor request builder and generation module using `generateJson` and the new result contract; verify injected-generator tests receive substantive candidate evidence and untrusted JD separately, allow professional rewriting, and propagate provider/output failures without fallback documents.
- [x] 2.2 Revise Cover Letter instructions toward confident candidate advocacy and supported semantic alignment while retaining tone, 200-300 words, two examples, and separate optional verification notes; update focused tests to cover empty notes and reject malformed output without relying on obsolete defensive prompt phrases.
- [x] 2.3 Revise Job Fit instructions for candid strengths, transferable experience, consequential gaps, and employer-claim uncertainty; verify request/contract fixtures cover required versus preferred criteria, absent evidence versus known gaps, React 18 relevance to React 19, and meaningful weak-fit analysis without an access threshold.
- [x] 2.4 Revise Interview Prep / Study Plan instructions for persuasive supported stories, qualitative outcomes, and useful preparation; verify existing structural/budget tests still pass and prompt fixtures reserve missing-detail markers for genuinely absent facts rather than normal paraphrasing.
- [x] 2.5 Update `exercises/01-job-fit.md`, `exercises/02-cover-letter.md`, and `exercises/03-career-plan.md`, and add a Resume Tailor exercise or equivalent guide; verify their examples describe the revised stances, substantive evidence context, independent tool use, and existing compatible contracts.

## 3. Shared HTML résumé presentation

- [x] 3.1 Extract a shared whitelisted résumé document renderer for matching HTML/text, selected role summaries and bullets, projects, education, and contacts; verify tests cover rewritten text, omitted unrelated work, escaping, approved links, icon fallback, and absence of review metadata in both exports.
- [x] 3.2 Adapt `resumeMailTemplate` to the shared renderer while retaining its public-profile signature, email framing, subject, full URLs, and existing icon behavior; verify `tests/mail-templates.test.ts` and targeted regression fixtures preserve its output and never serialize private project evidence.
- [x] 3.3 Add standalone preview/download handling with the existing sandbox/CSP and bundled icon support; verify tests show no scripts/forms/arbitrary remote loads, a self-contained HTML artifact, and parity of résumé content across preview, downloaded HTML, and copied plain text.
- [x] 3.4 Document standalone versus email rendering and HTML/text exports in `docs/resume-tailor.md` and the relevant template section of `docs/owner-inbox.md`; verify documentation accurately preserves current inbox customization and does not imply a PDF attachment or automatic send.

## 4. Protected endpoint and independent routing

- [x] 4.1 Register `resume-tailor` and add its API route using existing owner/session, origin/JSON, JD validation, generation, and model-error helpers; verify focused route tests reject guests/non-owners and invalid input before provider calls, and propagate configuration, rate-limit, malformed-output, and provider failures.
- [x] 4.2 Integrate `/dashboard/resume-tailor` and `/api/resume-tailor` in the server dispatch and static-unavailable export; update route/build tests to verify direct owner access without a fit result, correct denial for other roles, and absence of private evidence/results in public artifacts.

## 5. Resume Tailor workbench

- [x] 5.1 Add the typed tailor result state and document preview with HTML download/plain-text copy, keeping review/source details outside the résumé; verify component/browser fixtures render selected roles and projects and preserve identity/contact/education details.
- [x] 5.2 Integrate loading/error feedback, clipboard/download failure handling, and stale-result clearing into the workbench; verify a new submission clears old output, failed generation shows no fallback résumé, and exporting invokes no send/apply/publish endpoint.
- [x] 5.3 Update dashboard/tool copy and layout for the fourth tool and the revised purposes; verify at 375px and 1440px that independent navigation, controls, preview, and long content remain usable without horizontal page overflow or silent truncation.
- [x] 5.4 Document the actual independent user flow and export controls in `docs/resume-tailor.md`; verify the documented sequence works through the Firebase emulators without running Job Fit first.

## 6. Integrated acceptance and writing-quality evidence

- [x] 6.1 Exercise the new endpoint and existing tools through the Auth, Hosting, and Functions emulators, extending the existing emulator harness as needed; record guest/non-owner denial, owner success with controlled model fixtures, input rejection, provider failure paths, and cross-origin denial without launching a standalone server.
- [x] 6.2 Run a controlled browser acceptance through the Firebase emulators at 375px and 1440px for résumé generation, preview, export parity, source-note separation, stale output, and existing inbox template customization; record browser results separately from real-provider writing quality.
- [x] 6.3 Evaluate real server-provider output on frontend, automation, adjacent-version, ambiguous-posting, and weak-fit examples, including a supplied React 18 evidence fixture against React 19 requirements; record provider/model, sanitized cases, and observed quality against both specs, confirming persuasive rewriting and candid Job Fit rather than treating string assertions or mocked output as writing proof. If provider configuration is unavailable, record that concrete blocker and leave this task unchecked.
- [x] 6.4 Run `npm run preflight`, `git diff --check`, and strict validation of this OpenSpec change; record results and confirm public export isolation, preserved profile data, existing tool contracts, and no unintended changes to unrelated inbox work. Keep failed or unperformed acceptance tasks unchecked.
