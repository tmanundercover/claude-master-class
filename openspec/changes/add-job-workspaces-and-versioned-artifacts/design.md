# Design

## Context

See [proposal.md](proposal.md) for motivation and the four delta specs for observable behavior. This design is required because the change introduces durable private data, revision transactions, document rendering, build output, and a mail handoff across existing routes.

Observed source behavior: `ToolWorkbench.tsx` holds results and personal interview notes in React state and clears them on submission. The three server routes authorize the owner, load approved candidate evidence, generate validated results, and return JSON without persistence. `src/lib/auth.ts` verifies revoked session cookies but currently returns only a role. Workspace ownership needs the verified UID as well. `career-plan` uses one endpoint for two different output modes.

The inbox already has native saved drafts, serialized autosave, idempotent explicit sending, and bounded PDF attachments. `MailHtmlEditor.tsx` applies `resumeMailTemplate` to subject/text/HTML while preserving recipients and attachments. Its current template is HTML email content, not a PDF. Public build scripts explicitly allowlist assets, and current Hosting tests reject unexpected top-level files. Vite does not copy the public directory implicitly.

`add-resume-tailor-and-candidate-advocacy` is planning-complete with 0/23 implementation tasks at inspection. It owns substantive candidate evidence, the tailored result contract, a shared HTML/text résumé renderer, and writing guidance. Its design explicitly excludes persistence/history/PDFs and specifies transient stale-result clearing. `add-resend-owner-inbox` has 34/40 tasks at inspection and owns mail transport and unfinished operational acceptance. These counts are planning snapshots, not implementation proof for this change.

## Goals / Non-Goals

**Goals:**
- Add persistence around validated tool results without replacing their factual contracts or candidate-writing purposes.
- Keep one job workspace and a bounded Current/Previous pair per artifact, with recoverable failures between database and object writes.
- Separate document saving, PDF readiness, and native mail draft saving so each reports its actual outcome.
- Reuse the existing résumé display model and visual design across output formats while keeping public and private document pipelines distinct.

**Non-Goals:**
- No blank-workspace workflow, prescribed tool sequence, fit-score gate, multi-user collaboration, vector database, queue service, autonomous sending, or application tracking system.
- No full artifact history, arbitrary older-version restoration, workspace duplication/parallel variants, historical résumé ingestion, profile evidence edits, arbitrary file upload workspace, or recovery of previously discarded page-state results. Artifact retirement is part of the two-version bound.
- No new local Firestore/Storage emulator or standalone HTTP server. Local persistence fixtures are exercised through Auth, Hosting, and Functions only.
- No production provisioning, deployment, DNS change, or external message send during proposal creation; later apply work must keep actual operational evidence separate.

## Decisions

### 1. Add a job workspace layer without taking over existing changes

Implement this as a follow-on integration around each tool. The résumé-tailoring change supplies its renderer/model boundary before the tailored branch is integrated; existing tools, storage, and standard PDF work can proceed independently. The inbox's completed composer/draft surface supplies the email branch; its DNS and external delivery tasks do not block local workspace acceptance.

When integrated, this change replaces transient result clearing with saved-current rendering, pending regeneration status, and comparison. It explicitly changes the prior UI-only-notes assumption to owner-private saved notes, while continuing to exclude personal notes from model requests and document exports. It does not change writing stance, résumé factual contracts, tool independence, or mail-send authority.

One workspace represents one job. Its job description determines what application materials emphasize. Poor results or updated tool prompts are handled through Revise or Start over in that workspace; they do not create another job workspace. The `career-artifact-history` capability name remains for continuity, but its scope is Current plus one Previous version, not a general history system.

Do not edit or check off the sibling changes' artifacts as part of this proposal. If integration occurs before they archive, record this layering in implementation evidence. If they archive first, reconcile the now-canonical requirements during apply/sync before final validation so stale-result clearing is not left as a contradictory requirement. Those lifecycle commands require the corresponding user request.

Alternative: folding persistence into the résumé-only plan would conceal the broader changes to every tool, notes, and mail. Duplicating résumé generation or mail transport here would create competing owners.

### 2. Use Firestore metadata and private Cloud Storage content

Add a server-only repository interface with live and explicitly selected fixture adapters. Live metadata uses Firestore through the existing Firebase Admin app. Content objects use an explicitly configured private bucket through the Admin SDK. Production configuration failure returns an error; it never switches to fixtures. Reuse ambient server credentials; do not add browser service-account material or expose a storage bucket download token.

Proposed metadata paths are scoped under `careerOwners/{verifiedUid}`:

| Record | Main fields |
| --- | --- |
| `workspaces/{workspaceId}` | display company/title/location/requisition, metadata extraction state, current description ID, timestamps, schema version |
| `workspaces/{id}/descriptions/{descriptionId}` | description hash, object manifest, extracted details/provenance, creation time |
| `workspaces/{id}/artifacts/{kind}` | Current version ID, optional Previous version ID, monotonically changing state token, PDF summaries |
| `workspaces/{id}/artifacts/{kind}/versions/{versionId}` | at most two retained manifests: generation mode, base reference, description ID, optional change message, settings, provider/model, prompt/evidence versions, result/Markdown objects, PDF state |
| `workspaces/{id}/notes/interview` | versioned personal note values and save time, separate from generated revision content |
| `attempts/{attemptId}` | request hash, workspace/kind/mode/state/description binding, operation state, completed version identity or no-longer-retained receipt; no retired document content |
| `applicationDrafts/{draftId}` | native draft ID, workspace ID, selected revision/content hashes, managed attachment identities, standard-document hash if selected, handoff state |

Artifact kinds are `job-fit`, `resume`, `cover-letter`, `interview-prep`, and `study-plan`; do not use only the shared `career-plan` endpoint as an artifact key. Workspace lists use bounded pagination with a stable ID tiebreaker. Artifact reads return only Current and optional Previous; there is no history list, revision-event log, or saved-conflict branch.

Objects live under opaque, server-generated prefixes such as `career/{uid}/{workspaceId}/artifacts/{kind}/{versionId}/result.json`, `document.md`, and `document.pdf`. Immutable object identities keep the two retained documents and their PDFs consistent; they do not imply indefinite artifact retention. Descriptions retain their versioned source-posting snapshots separately for JD provenance; the two-version bound applies to generated artifacts, not edits to the source posting. Store hashes, sizes, MIME types, schema/render versions, and object generation IDs in manifests. Object paths are never accepted from clients. IDs, rather than extracted company/title strings, define relationships and filenames on disk.

Use document-level server transactions for attempt claims and current pointers. Deny direct browser database/storage access for this namespace and grant the runtime only its required service access. Every Admin operation still verifies owner role and UID because Admin SDK access bypasses client rules. Document configuration and deployment prerequisites without modifying unrelated bucket/rules configuration blindly.

Alternative: browser storage cannot provide cross-device persistence. A directory on the Functions filesystem is transient in production. Storing every binary and full history in one database document creates unbounded records. Separate metadata and immutable objects support bounded lists and private downloads.

### 3. Save the description first and extract identifying details safely

New tool entry retains the current 15,000-character nonblank JD validation. A stable client attempt identifies creation; the server saves the workspace and original description before model work. Hash descriptions after line-ending normalization and trimming, without lowercasing or aggressively altering meaningful content. An owner-scoped identical-description match reopens its existing workspace, with no Create separate or Duplicate action. Make matching-description lookup and creation consistent across concurrent attempts so retries or two tabs do not create parallel workspaces. Distinct opportunities can share company/title; do not guess that they are the same job from those labels. Updated descriptions for the same job are saved inside its existing workspace. The same creation attempt always resolves to its original workspace even if its response was lost.

Run a bounded structured metadata extraction once per saved description version using the existing server provider abstraction. Extract supported company/title/location/requisition fields, allowing nulls. Save extraction status separately; extraction/provider failure leaves a usable saved workspace with unknown labels and does not invalidate a successful artifact generation. Do not infer real companies or external posting facts. A metadata version check prevents late extraction from overwriting the owner's manual corrections.

Editing the JD creates a new immutable description object and metadata record, then atomically updates the workspace pointer with an expected-version precondition. Retained artifacts are labeled as based on an earlier description when applicable; they are not regenerated automatically. A generation started from an earlier description cannot become Current after a newer description is saved. The owner can retry Revise or Start over from the latest workspace state.

Alternative: deriving identity only from company/title merges distinct postings and breaks links on corrections. Requiring successful metadata inference before saving would lose the source when the provider is unavailable.

### 4. Save and rotate only Current and Previous

Keep model execution outside Firestore transactions, which can retry. Claim an attempt bound to UID, workspace, kind, generation mode, expected artifact state token, Current version ID, description version, settings, and optional change message. A matching completed retry returns its version only while it remains in Current/Previous. If it has been retired, return an explicit no-longer-retained result, such as 410, without regenerating or resurrecting it. A reused attempt with a different payload fails as a conflict; an active attempt reports in progress rather than running the model again. Small completion receipts carry no retired artifact bodies and do not provide a history API.

Authorize the workspace and check its state before generation. Revise loads Current's content; Start over needs only its identity for replacement bookkeeping and excludes its content from model context. Generate with the existing tool contract, validate, create deterministic Markdown, and stage immutable result/Markdown objects with their hashes. A database transaction then registers the new version as Current, moves the former Current to Previous, retires the older Previous manifest, and completes the attempt only if artifact-state and description preconditions still hold. Increment the state token on every replacement or undo, including a swap back to the same version IDs. A competing request receives 409 and its staged files are discarded; it never creates a third saved artifact or a branch for later selection.

If object writes fail, neither retained version changes. If object writes succeed but the final metadata response is interrupted, the attempt's deterministic version/object identity allows reconciliation and read-back before any new provider request. Saving a result must not be reported until the committed manifest can be retrieved. An unresolved generation may stage temporary files, but only the committed Current/Previous pair is retrievable or downloadable.

Use explicit attempt states for running, saved, conflict, failed, and interrupted/uncertain operations. Bound request duration; an expired operation with no persisted result is reported as interrupted and can be explicitly retried. Do not promise exactly-once provider execution after a process crash between provider completion and object persistence. Failure must not invent successful storage or discard either retained version. No queue/worker infrastructure is needed for this initial single-owner request flow.

Undo atomically swaps Current and Previous with an expected-state precondition and increments the state token. It does not create a version or append an event log. The pair remains available after reload; a subsequent Switch back swaps the same pair. The next successful Revise or Start over uses the currently selected document as Previous and retires the other older document. With only one generated version, comparison and undo are unavailable.

After committing replacement, retire the displaced version's JSON, Markdown, PDF, and review metadata from workspace access and delete its unneeded objects through bounded cleanup/reconciliation in the repository. Retry failed deletes without exposing an archive or deleting either retained version. Late PDF work must recheck pair membership before publishing a file and discard output for a retired version. Completed attempt receipts must not retain hidden copies of retired results. Existing native email drafts/sent messages own independent attachment bytes; cleanup must not delete provider copies or require keeping full source artifacts. In-progress attachment preparation must finish copying its selected PDF or report an explicit stale-source conflict before retirement removes its source; it must never substitute another file silently.

Alternative: full revision collections, arbitrary restore, and retained conflicting generations add history the owner does not need. A single mutable document would lose comparison/undo. The bounded pair provides those controls with explicit retirement and a small concurrency token.

### 5. Distinguish Revise from Start over and save notes separately

Generation requests identify `initial`, `revise`, or `start-over`, workspace/kind IDs, expected artifact-state and description tokens, an opaque attempt ID, and applicable settings. Revise requires a nonblank change message bounded to 2,000 characters. It loads Current on the server and supplies current approved evidence, current JD, the normalized artifact, and requested changes as separate data fields to existing request builders. Do not trust a client-submitted replacement as evidence.

Start over supplies current approved evidence, current JD, current configured tool instructions, and settings, without loading prior artifact text into the model request or reusing previous change messages, conversation state, or model response handles. Merely telling the model to ignore an included old artifact does not satisfy this separation. Record the current prompt-contract version and mode on the new saved version. This enables recovery from poor first output or changed prompts in the same workspace; it does not add a prompt editor or a workspace variant feature. Initial generation similarly has no previous artifact input. Use schema/evidence version fields when interpreting retained results; old request-scoped references do not automatically become valid in a newer evidence catalog.

Persist the evidence version/hash, prompt contract version, generation mode, model/provider, and settings for each retained version; do not persist credentials or a raw private evidence dump as owner-readable provenance. Keep approved material-fact validation and sibling writing guidance. A prior generated claim is editing context for Revise, not new verified candidate evidence. Both modes use the same save-and-rotate lifecycle, preserve the pair on failure, and initiate only the applicable automatic PDF work. Markdown is rendered from validated structured results; review metadata lives in separate fields, and personal notes never enter that renderer.

Personal interview notes move to a separate bounded record with debounced serialized saves, a version token, and visible unsaved/saving/saved/failed states. Associate note entries with stable IDs instead of generated array indexes; preserve unmatched notes in the workspace when prompts/templates change. Reject stale updates rather than clearing notes on regeneration. Suggested limits are 64 KiB total notes per workspace, 512 KiB per saved JSON or Markdown object, and the existing mail attachment limits for attachment preparation. Freeze exact encoded-size limits in shared contracts/tests during implementation, fail explicitly, and never silently truncate. Routes use endpoint-specific body limits rather than increasing unrelated inbox/tool limits globally.

### 6. Add workspace routes while keeping tool entry independent

Add owner pages `/dashboard/jobs` and `/dashboard/jobs/:workspaceId`, with artifact selection within the workspace dashboard. The workspace dashboard owns Generate, Revise, Start over, Current/Previous comparison, undo, downloads, and the saved description. Existing `/dashboard/<tool>` links stay usable as entry points: submit a JD to create/reopen its workspace, or select an existing workspace to use its saved description. No blank creation card, duplication action, variant-label workflow, arbitrary history browser, or forced Job Fit step appears.

Proposed APIs:

| Route | Purpose |
| --- | --- |
| `GET/POST /api/job-workspaces` | Paginated list; validate/save JD and creation attempt |
| `GET/PATCH /api/job-workspaces/:id` | Retrieve dashboard summary; correct identifying metadata |
| `POST /api/job-workspaces/:id/descriptions` | Save new description version with expected-current check |
| `POST /api/job-workspaces/:id/artifacts/:kind/generate` | Explicit initial, revise, or start-over mode with state preconditions |
| `GET /api/job-workspaces/:id/artifacts/:kind` | Current and optional Previous summaries plus state token |
| `GET /api/job-workspaces/:id/artifacts/:kind/versions/:version` | Retrieve content/provenance only if the version is still in the pair |
| `POST /api/job-workspaces/:id/artifacts/:kind/undo` | Swap Current/Previous with an expected-state precondition |
| `POST /api/job-workspaces/:id/artifacts/:kind/versions/:version/pdf` | Create/retry a PDF only for a retained version |
| `GET /api/job-workspaces/:id/artifacts/:kind/versions/:version/files/:format` | Authorized retained-version PDF/Markdown download |
| `GET/PUT /api/job-workspaces/:id/notes` | Load/save personal notes with version precondition |

Dispatch parameterized routes before the existing exact API table in `entry-server.tsx`. Extend session verification to provide a server-owned `{uid, role}` principal while keeping existing role helpers compatible. Authenticate before loading descriptions, manifests, bytes, or model context. Mutations retain origin checks; private responses retain no-store/Vary Cookie and safe content-disposition behavior.

Have old generation endpoints delegate to the same persistence service for explicit JD submissions, preserving their existing result JSON shape and adding workspace/version response headers. Reuse a matching job workspace: a legacy explicit generation with no current artifact is Initial; one with an existing artifact uses Start over semantics and the same conditional replacement rules. New workspace endpoints return a saved-result envelope. Workbench clients use explicit modes and stable attempt IDs; reopening an existing workspace alone never triggers replacement. No registered tool retains a successful ephemeral-only path. A legacy call without a stable attempt ID is a new generation request, not an idempotent retry.

### 7. Compare saved content with native scroll synchronization

Extract saved artifact rendering from the growing `ToolWorkbench` into focused workspace/result/comparison components. Offer Revise with its change-message input and Start over with clear fresh-generation wording. Render only Previous and Current with generation mode, prompt version, and change message when applicable, plus a word/section diff view; do not add a revision picker. Use structured document section IDs for alignment, falling back to proportional scroll progress when sections differ. Native scroll events, refs, requestAnimationFrame, and a feedback-loop guard are sufficient; keep sync optional and independent scrolling accessible. The installed `react-scroll` remains available for existing navigation but is not a required comparison dependency.

On mobile, offer Current/Previous tabs and preserve section context. Keyboard navigation, focus, and reduced-motion behavior must work. During either generation mode, keep the retained pair available with a pending status. After durable replacement, display the new pair and Undo replacement; after undo, offer Switch back for the same pair. Hide or disable comparison/undo when Previous does not exist. Saved personal notes remain visible and are not reset by either mode.

### 8. Share résumé content and design, with separate PDF components

Reuse the sibling change's whitelisted résumé display model, formatting helpers, approved links, bundled icons, and extracted visual tokens. Keep `resumeMailTemplate`'s public-profile adapter and existing editable email behavior. Add PDF-specific document components using `@react-pdf/renderer`; HTML tables and browser CSS cannot be passed unchanged into its PDF primitives. Standard and tailored documents share the PDF layout; the standard model comes only from `publicProfile()`, while tailored documents come from the saved normalized résumé result. Cover letters and other artifact types get appropriate print layouts with the same restrained palette.

Render with the Node `renderToBuffer` API from server/build modules. Pin a tested release compatible with React 19 in both root and Functions packages and corresponding lockfiles. Official React PDF compatibility docs state React 19 support since 4.1.0, but the page's Node test list does not establish Node 22 support; require a real Node 22 build/runtime render in acceptance. Preserve ESM/package externalization through Vite rather than copying a server renderer into public client bundles. Package only approved local fonts/icons; do not fetch model-provided image/font URLs. Allow document wrapping without fixed page-count truncation, keep headings with following content, and verify long URLs/sections and multi-page output visually.

Automatically attempt a PDF after résumé/cover-letter JSON and Markdown are committed, within the bounded server invocation. Store per-version pending/ready/failed state; if the invocation ends early, a subsequent read reports the incomplete attempt and the owner can retry while the version is retained. Other artifacts only render after Generate PDF. PDF work never reruns an LLM. A manifest includes source content hash and renderer version; writes cannot relabel an old PDF as a new version. PDF failure does not roll back a saved textual version. Undo swaps the associated manifests, and retirement removes the displaced older PDF; an in-flight PDF completion cannot recreate a retired version.

References: [React PDF Node API](https://react-pdf.org/docs/v4/node), [styling](https://react-pdf.org/docs/v4/styling), and [compatibility](https://react-pdf.org/docs/v4/compatibility).

### 9. Publish one approved standard PDF in both public builds

Add a build helper using the shared public-profile document adapter and PDF renderer, with no model calls or live storage dependency. Generate `resume.pdf` for each build target and a standard-document content/version hash for server attachment selection. `scripts/prepare-firebase.mjs` and `scripts/export-pages.mjs` must explicitly include only this public PDF and needed allowlisted resources. Ensure the Functions package can resolve the same built standard PDF/hash for email fallback. Attach the same bytes that the current release publishes; do not independently rerender a divergent fallback.

Place a small download-icon/text link labeled Download résumé (PDF) directly beneath the identity card in `Home.tsx`, preserving the hero layout and adding hover/focus affordances. Use `sitePath` for static base-path support and an appropriate `download` filename. No anonymous generation endpoint, storage token, session, or workspace ID is needed. A PDF build failure fails that build instead of publishing a dead link. Update Hosting top-level allowlists and Pages checks deliberately; retain all private-data sentinels and exclusions.

### 10. Add a deterministic application template and server attachment resolver

Keep HTML email body creation in the mail-template layer and PDF creation in the document layer. Add a Job application template beside the existing résumé template. Workspace selection is its only template-specific input. Selecting/previewing does not replace the current composition; applying populates subject/plain text/HTML and managed attachments. Use server-approved candidate identity and editable workspace company/title; absent identifiers produce neutral wording and a correction affordance. Do not discover recipients from the posting or run another LLM just to write the short application email.

Add an owner-authorized application preparation endpoint, provisionally `POST /api/job-workspaces/:id/application-draft`, which resolves current document IDs/hashes server-side and uses the existing native draft adapter. A missing tailored résumé returns a choice-needed state: Use standard résumé, or Create tailored résumé. A pending/failed current PDF returns its status and retry/explicit omit action; it must not fall back to a previous tailored revision. Missing cover letters are disclosed and omitted from generated copy. Attachment references are checked against the selected workspace; neither arbitrary URLs nor storage paths are accepted.

On applying a template, snapshot selected ready revision IDs, file content hashes, filenames, and whether the résumé is standard. Load bounded bytes on the server and pass permitted PDF attachments through the existing mail adapter. Preserve the existing total 10 MiB/10-file limit and provider validation, including manually attached files. Reject oversize sets before replacing saved draft content. Distinguish generated managed attachments from manually attached files; refreshing documents only replaces the managed set. User-edited copy changes only when the owner explicitly reapplies the template. Normal attachment edits remain possible and do not trigger hidden template reapplication or model calls.

Store only application linkage/attachment manifests in Firestore; Resend remains the authority for actual draft body/recipients/files and sent mail. A later Revise, Start over, undo, or source retirement never mutates a native draft or sent message. Native mail retains actual attachment bytes independently, while linkage retains source version IDs, filenames, and hashes as provenance without requiring the retired workspace JSON/Markdown/PDF to remain available. Reopening the draft shows those snapshot labels and an explicit Refresh documents action; it must not dereference retired artifact records to load existing attachments. Initial template copy references only the successfully prepared attachment set. Subsequent manual editing follows normal composer semantics; do not silently rewrite user text after attachment changes.

Native draft updates and Firestore linkage cannot be one transaction. Persist a pending immutable preparation attempt and intended snapshot before provider mutation; reuse the native draft attempt identity, then verify the returned draft and finalize linkage. On interruption, reconcile that draft before issuing another create/update. Expose partial/uncertain preparation rather than claiming a saved attachment set. No send call is part of preparation. Existing send freezing, idempotency, recipient validation, and explicit Send message remain intact.

### 11. Preserve the draft before the tailoring round trip

Create tailored résumé first flushes the composer save queue and saves its native draft, then persists its workspace association and opaque return reference. If the composer is still blank, this explicit action seeds the selected opportunity's application subject and an editable message that makes no premature attachment claim before saving; it does not create a contentless provider draft. Preserve any existing edited copy. Only navigate to `/dashboard/jobs/:id` with résumé tailoring selected after both saves succeed. Draft save/linkage failure leaves the composer open with edits and actionable error feedback.

Use an owner-bound draft return reference, not an arbitrary return URL or browser-persisted mail body. The workspace shows Return to application email. Returning reloads the same native draft and offers to attach the newly ready résumé. Updating attachments preserves recipients, edited body, and unrelated files. If tailoring fails or the session expires, the previously saved email remains retrievable after signing in. Do not auto-attach an unrelated workspace résumé or send when returning.

### 12. Keep local fixtures and live evidence distinct

Use explicitly selected server fixture repositories for local HTTP/browser testing through the existing Auth, Hosting, and Functions emulator harness. Persist fixture data in an ignored task-scoped directory with serialized/atomic writes so reload and process-restart behavior is testable. Fixture content is synthetic and is neither production storage nor public build input. Unit tests exercise the live repository boundary with injected SDK clients; concurrency/failure tests must model manifest writes and pointer preconditions, not merely replay implementation internals.

No Firestore/Storage emulator or standalone server is added. A live adapter smoke test, when a designated nonproduction project/bucket and credentials are available, separately verifies write/read/restart/undo/download, the two-version bound, retired-object cleanup, and byte hashes with synthetic records. Keep absent credentials, service permissions, or bucket configuration as specific open acceptance gates, not reasons to replace the design with local-only persistence. Real-model Revise/Start over and external attachment delivery are independent acceptance records and remain unproven until performed under their applicable authorization.

Firebase references: [Admin Cloud Storage](https://firebase.google.com/docs/storage/admin/start) and [Firestore transactions](https://firebase.google.com/docs/firestore/manage-data/transactions).

## Risks / Trade-offs

- [Database and object storage cannot commit together] -> Save immutable content first, publish only committed manifests, bind all writes to an attempt, reconcile interrupted operations, and never promote a missing object.
- [A process dies after model output but before persistence] -> Keep the prior revision and report an interrupted attempt; do not promise exactly-once generation or claim unsaved output is recoverable.
- [Two tabs replace or undo a document concurrently] -> Expected state tokens reject stale writes, including after swapping back; a conflict cannot create a third saved version.
- [PDF bytes lag the saved content] -> Track readiness per revision, permit rendering-only retries, and pin draft attachments to content hashes.
- [Saved notes broaden the older UI-only behavior] -> Persist only owner-private notes in a separate record, exclude them from generation and exports, and test sentinels through every boundary.
- [Shared design drifts across HTML and PDF] -> Reuse model/helpers/tokens and verify rendered standard/tailored examples visually; do not claim identical pagination across formats.
- [React PDF integration fails under Node 22 or deployed ESM packaging] -> Prove a render from the built Functions package early; keep package/lockfile parity and build-public isolation checks.
- [A standard PDF leaks private project evidence] -> Build only through the existing public projection and add PDF text/content sentinels, never serialize raw profile/project evidence into the public document builder.
- [A mail draft changes while a preparation request is pending] -> Serialize composer writes, bind preparation to the intended draft snapshot, and reconcile native draft results before navigation or retry.
- [Retired documents accidentally remain as hidden history or cleanup breaks email] -> Authorize only the pair, reconcile obsolete file deletion and late PDF work, and preserve independent native mail attachment snapshots. Keep receipt metadata free of retired document bodies.
- [Poor generated content leaks into Start over] -> Construct a fresh request without prior artifact text, earlier change messages, or provider conversation handles; test with unique sentinels and current prompt versions.

## Migration Plan

1. Confirm shared résumé contracts from the résumé-tailoring change and preserve unrelated dirty inbox work. Add storage contracts/live-fixture boundaries and UID-aware authorization first; new private services fail explicitly if unconfigured.
2. Add workspace creation/retrieval and revision persistence around current tool services. Migrate workbench entry/results/notes to that layer, retaining legacy initial endpoint shapes and tool-independent access.
3. Add the Revise/Start over controls, Current/Previous comparison, swap-based undo, retirement cleanup, and PDF layouts. Prove Node 22 rendering before broader integration; then wire automatic application PDFs, optional other PDFs, and public build artifacts/link.
4. Add the application template, pinned document preparation, and saved-draft tailoring return flow using native mail operations. Exercise existing composer regressions after each integration.
5. Run deterministic unit, storage-restart/concurrency/failure, emulator HTTP, responsive browser, PDF inspection, public-build/privacy, and full preflight checks. Include repeated replacements, undo/swap back, Start over context exclusion, duplicate-job reuse, late PDF completion, and email snapshots after source retirement. Record local proof separately from designated live-storage, real-model, and external-mail checks; keep unperformed gates unchecked.
6. A separately authorized release provisions the named database/bucket and runtime access, deploys the verified package, and checks owner/non-owner/private/public paths. No workspace data backfill exists for lost transient results. Rollback disables new routes/template entry while preserving current/previous data, referenced objects, metadata, and native drafts; retired versions cannot be recovered as full history. Do not publish private files or discard retained data during rollback.
