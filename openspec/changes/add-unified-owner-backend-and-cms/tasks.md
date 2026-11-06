# Tasks

Implementation is not started. Complete groups in dependency order, keeping each group's focused tests and documentation with its changes. All HTTP/browser work uses isolated Firebase Auth, Hosting, Functions, Firestore, and Storage emulators; each suite owns its temporary directories, blob data, and ports. Do not overwrite environment credentials or unrelated work. Live migrations, user provisioning, email delivery, and deployment are outside local acceptance.

## 1. Canonical content contracts and repository

- [ ] 1.1 Replace JSON-inferred profile types with explicit content/public/evidence contracts, stable record and bullet IDs, date precision, relationship maps, and ordering; verify typecheck and contract tests for invalid references, dates, URLs, and public/private fields.
- [ ] 1.2 Add the bounded `portfolio/content` repository with one coherent revision, schema validation, optimistic section saves, and explicit missing/unavailable states; verify durable reads, size/count limits, concurrent-save conflicts, and atomic relationship changes through the real Firestore emulator adapter.
- [ ] 1.3 Add explicit public and model-evidence projections from a captured content revision; verify private project evidence and administration sentinels never enter public data while model context contains readable approved facts and stable IDs.
- [ ] 1.4 Add owner-authorized `/api/cms/**` read/mutation contracts with authorization before private reads/body parsing, bounded input, same-origin checks, revision preconditions, and private/no-store responses; verify guest/unauthenticated/forged-ID and stale-write denial over emulator HTTP.
- [ ] 1.5 Document the content schema, validation limits, immediate-save/conflict behavior, and CMS API in repository docs; verify examples against the implemented request/response fixtures and typecheck.

## 2. One-time content migration and evidence relationships

- [ ] 2.1 Implement a read-only starter-data migration report and curated matching map for the current profile and historical seed, including source hashes, deterministic seed IDs, dates/precision, aliases, ordering, and ambiguous matches; verify inventory fixtures preserve approved roles, projects, bullets, links, and additional historical facts without unjustified merging.
- [ ] 2.2 Add explicit-target migration execution and versioned receipts that initialize validated canonical content atomically; verify reruns and interrupted attempts do not duplicate data, reset content, or overwrite a later CMS edit in isolated emulators.
- [ ] 2.3 Derive résumé search, evidence records, skill longevity, ratings, and summary counts from canonical relationships; verify editing dates/skill links updates derived results and preserves the meanings of self-ratings and incomplete dates.
- [ ] 2.4 Migrate recorded-answer experience references from title/period matching to stable content IDs and preserve existing media/transcript behavior; verify reorder, title correction, dependency removal, and legacy answer links still select the correct experience.
- [ ] 2.5 Replace tests that mandate a permanent parallel archive with migration/parity and persisted-content checks; document report review, retry, and local initialization commands and verify those commands against a fresh isolated emulator data directory.

## 3. Live content consumers and public document delivery

- [ ] 3.1 Refactor server page rendering and public-profile loading to capture one canonical revision per request; verify a CMS save appears on the next dynamic page request, unavailable storage fails visibly, and no runtime JSON fallback remains in these paths.
- [ ] 3.2 Update all career generation paths and résumé result assembly to consume a captured CMS revision and stable references, recording `contentRevision` plus existing evidence provenance; verify all five artifacts receive current readable facts, concurrent edits cannot mix revisions, and legacy saved results still render.
- [ ] 3.3 Update new résumé/application email templates and descriptive document names to use the relevant captured content or saved-document identity; verify CMS edits affect new template applications while existing drafts, sent attachments, Current/Previous documents, and notes retain their content and bytes.
- [ ] 3.4 Add dynamic `/resume.pdf` rendering/resolution from current public content and reuse it for new standard-résumé attachments; verify current-revision PDFs, rendering failure, revision changes during rendering, cache behavior, and matching attachment bytes without a model call.
- [ ] 3.5 Remove Firebase Hosting root/PDF shadows and packaged-standard-PDF assumptions while keeping static assets and protected media correctly packaged; verify real Hosting-emulator `/` and `/resume.pdf` requests reflect a CMS save without rebuilding and public/private artifact checks pass.
- [ ] 3.6 Add an explicit versioned public snapshot export/input for Pages, standard-PDF builds, and public icon generation; verify an offline build has matching page/PDF revisions, working base-path links and new private-route availability pages, and no accounts, private evidence, recordings, job data, server bundle, or credentials.
- [ ] 3.7 Finish removal of production starter-file dependencies and document dynamic Save versus static snapshot behavior; verify targeted source/build/asset searches leave seed files referenced only by intentional migration/test inputs, run relevant packaging tests, and run `npm run preflight`.

## 4. Managed account repository and credential operations

- [ ] 4.1 Add approved-account, UID index, access-version/tombstone, and operation-receipt contracts/repositories; verify normalized email uniqueness, distinct dot/plus addresses, pagination/search, UID binding conflicts, reapproval version changes, and preservation of unrelated custom claims in focused emulator tests.
- [ ] 4.2 Add owner-only `/api/accounts/**` list/create/edit/remove endpoints with bounded input, optimistic versions, same-origin checks, and owner-field protection; verify denied guest/admin-forgery requests make no administrative mutation and ordinary approval accepts only recruiter/interviewer access.
- [ ] 4.3 Implement unique server-generated password provisioning and reset through Firebase Auth using stable intended UIDs and version-fenced operation receipts; verify each account receives its own credential, old credentials/sessions lose access on reset, no owner password action is accepted, and no plaintext is persisted/logged or automatically emailed.
- [ ] 4.4 Handle provider/Firestore partial failure, lost credential responses, retries, and removal during provisioning; verify reconciliation cannot duplicate identities or re-enable removed access and an unrecoverable reveal requires a new explicit generation.
- [ ] 4.5 Implement approval removal as inactive/version commit followed by retryable provider revocation cleanup; verify removal remains authoritative during cleanup failure and repeated requests do not restore access or affect another account.
- [ ] 4.6 Add explicit-target account import/report for assigned legacy guests and protected owner initialization; verify existing UIDs/passwords/roles survive, unassigned users stay unapproved, newer managed records are preserved, and live operations are never inferred from emulator configuration.
- [ ] 4.7 Document Accounts API, credential reveal/reset, approval methods, reconciliation, and guest migration; verify examples with synthetic Auth/Firestore emulator fixtures and confirm logs/receipts contain no password values.

## 5. Unified login and live session authorization

- [ ] 5.1 Replace the role-selected client form with Google and email/password login, preparing the Google popup for all users and deriving roles/return destinations on the server; verify approved guest methods, unauthorized Google identities, rejected role fields, safe returns, and unchanged Google-only owner checks through emulator HTTP/browser tests.
- [ ] 5.2 Add authenticated provider linking and recoverable collision handling for guests with both allowed methods; verify first Google binding, existing password-to-Google linking, one shared UID, disabled-method denial, and no email-text-based account takeover in emulator SDK/contract tests.
- [ ] 5.3 Add hashed-cookie session receipts, post-approval authentication-time checks, and transactional approval/version rechecks when finalizing login; verify no session is issued on receipt failure, concurrent removal, or exchange of a pre-reapproval ID token even when provider revocation fails, and no raw cookie is stored.
- [ ] 5.4 Refactor shared page/API/media authorization to require a current account and matching session receipt/version as well as verified Firebase cookies; verify removal, role/method change, reset, removal/reapproval, registry outage, and legacy-cookie denial on the next protected request across separate application contexts.
- [ ] 5.5 Cover protected recording GET/HEAD/range requests and existing saved-job/mail APIs under the shared gate; verify removed guests cannot fetch another video segment or private content while the unchanged owner UID retains all existing jobs and guest roles remain interview-only.
- [ ] 5.6 Document fresh-login cutover, guest destinations, owner Google-only behavior, and revocation limits for already delivered bytes; update emulator seed/auth helpers without credential-file replacement, verify guest/owner migration and popup cancellation flows, and run `npm run preflight`.

## 6. Shared shell, routing, and mail state

- [ ] 6.1 Add the route manifest, server/client owner page-data contract, and shell outlet while preserving server authorization and `/dashboard` overview/default login; verify direct legacy URLs, deep reloads, owner `/interview`, guest interview-only rendering, and absence of hydration mismatch.
- [ ] 6.2 Build the eight-destination left rail in the agreed order with avatar/dropdown, selected states, accessible icon labels, Accounts people icon, and Recorded Answers play icon; verify keyboard navigation and every destination at 375px and 1440px.
- [ ] 6.3 Extract contextual sidebar/toolbar/main-pane surfaces and compact shared styles from Inbox; move Contacts, Manage labels, and Mailbox settings below the Mail sidebar divider and verify their existing provider-backed fixture interactions remain usable.
- [ ] 6.4 Lift the mail composer and bounded per-area state into the shell; verify mail folder/search/thread restoration and unsaved composition retention across area changes, plus autosave failure and application-tailoring return behavior.
- [ ] 6.5 Add explicit URLs/history for area/item/workflow selection and preserve existing generation/return parameters; verify Back/Forward, bookmarked shared job URLs, `area=workflows`, and old tool aliases select the same job/document without duplicate creation.
- [ ] 6.6 Add dirty-form navigation handling, inactive-view polling suspension, and obsolete-request cancellation; verify failed saves retain values, explicit discard works, delayed reads cannot overwrite a newer selection, and hidden mail views do not keep polling.
- [ ] 6.7 Document shell routes/state and responsive interaction rules; verify phone rail/sidebar/compose layout has no overflow or obstructed controls and run `npm run preflight` after routing/build integration.

## 7. Contextual working screens and editors

- [ ] 7.1 Adapt Saved Jobs to sidebar job selection and the existing document workspace in the main pane; verify same-job context, edit/revise/start-over, Current/Previous comparison/undo, notes, downloads, and email handoff at phone/desktop widths.
- [ ] 7.2 Build the five-entry workflow sidebar and main-pane explanations/inputs/results, splitting Interview Prep and Study Plan navigation over existing artifact types; verify each starts independently with a new description or reuses the selected job without a fit gate.
- [ ] 7.3 Adapt Résumé Intelligence and owner Recorded Answers to their contextual sidebars and compact content panes; verify live evidence filtering, stable experience links, video selection/playback, and unchanged guest library access.
- [ ] 7.4 Build CMS profile/contact/site-copy and education editors with immediate Save, validation, conflict feedback, and preserved dirty values; verify public page/contact and newly generated document propagation without changing login or mailbox identity.
- [ ] 7.5 Build CMS experience/bullet, project/link, skill/category/date/rating, ordering, and relationship editors; verify create/edit/remove, dependency cleanup, stable IDs after reorder, private evidence exclusion, and saved values after reload/restart.
- [ ] 7.6 Integrate existing profile-photo editing into CMS profile/media, retaining public avatar updates and current upload restrictions; verify valid/invalid uploads, conflict/failure feedback, and no exposure of protected recordings.
- [ ] 7.7 Build Accounts sidebar/list/details and add/method/role/password/remove actions with pending/failure/reconciliation and one-time reveal states; verify first Google guest access, generated-password guest access, no owner password control, and immediate denial in a second already-signed-in context after removal.
- [ ] 7.8 Compose Settings from supported application/mail controls and preserve overview navigation into CMS/Accounts; document all updated owner flows and verify supported saves, unsupported states, help disclosure, and account sign-out without duplicate content/account editors in Settings.

## 8. Integrated acceptance and release preparation

- [ ] 8.1 Extend Firestore/Storage rule acceptance for content, account, session, receipt, and media paths; verify anonymous, guest, and owner direct clients are denied separately from authorized server SDK access using isolated emulator directories and ports.
- [ ] 8.2 Run a cross-process restart/retrieval and concurrent-client acceptance covering CMS edits, migrated facts, guest approvals, protected owner identity, old-session removal/reapproval, and unchanged job/document snapshots; verify it uses real emulator SDK adapters rather than fixture-only persistence.
- [ ] 8.3 Run integrated browser acceptance at 375px and 1440px across all eight areas, Google/password guest login, removed guest requests, preserved mail drafts/job context, dirty-editor navigation, and live page/PDF propagation; verify no hydration errors, page overflow, unintended sends, or live provider mutations.
- [ ] 8.4 Run `npm run preflight`, strict validation of this OpenSpec change, and relevant artifact/privacy checks after integration; record local evidence without equating it to production/provider acceptance and confirm unrelated work and credential files are preserved.
- [ ] 8.5 Deliver a release/migration/rollback runbook with source inventories, protected owner UID checks, assigned-guest import, initialization checks, fresh login, dynamic route/PDF checks, and preservation of later content/access edits; verify its rehearsal in isolated emulators and leave real-project migration/deployment separately authorized.

## Workflow follow-up

- Review implementation and its evidence before separately requested canonical spec sync or archive; do not mark implementation complete because these planning files exist.
- At sync, reconcile content-source wording with whichever inbox/job-document capabilities have become canonical, preserving their Current/Previous, explicit-send, and attachment snapshot contracts.
- Keep inbox provider/DNS/deployment gates and any live release evidence distinct from this change's local completion.
