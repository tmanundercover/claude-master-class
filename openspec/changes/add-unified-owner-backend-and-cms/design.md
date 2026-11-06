# Design

## Context

See [proposal.md](proposal.md) for motivation and scope. Source inspection establishes these integration points:

- `src/App.tsx` wraps most owner screens in a generic workspace header; Inbox has its own full-width wrapper. `AppLink` is currently a normal anchor, so navigation remounts page-local state. The inbox owns its avatar menu, folders, filters, conversation selection, and composer.
- `Dashboard.tsx` is the current overview and contains profile-photo editing plus links to all existing areas. `ToolWorkbench.tsx` saves a job and navigates to `JobWorkspace.tsx`; that workspace owns the five distinct artifact kinds and Current/Previous behavior.
- `src/entry-server.tsx` authorizes pages before rendering. `/interview` is shared by owner and guest roles; its protected media is served through the Functions application. Keep these boundaries.
- `data/profile.json` and `data/sanity-resume-snapshot.json` total 82,716 bytes in the inspected checkout. `public-profile.ts`, `resume-evidence.ts`, entry rendering, job generation/application code, types, tests, and build scripts depend on them. `resume-tailor-evidence.ts` currently constructs role/project references from array positions. Some tests explicitly require the archive to remain additive; those assertions must be replaced with migration and persisted-content acceptance.
- Authentication currently selects a role in `LoginForm`, restricts Google client login to the owner, derives access from custom claims, and verifies revocation on four-hour Firebase cookies. `owner-identity.ts` requires the exact verified owner Google identity. There is no application Accounts API. Current guest provisioning is in the emulator seeder and outside the UI.
- Existing Firestore/Storage adapters are server-only; direct-client rules deny all access. Profile-photo metadata already uses the global `portfolio/profilePhoto` document. Job documents remain under the existing verified owner UID.
- Firebase packaging writes static `index.html` and `resume.pdf` to Hosting and packages a standard PDF for Functions. These files would override immediate CMS updates if left on dynamic Firebase routes. The optional Pages export is explicitly public-only.

The active inbox and job-workspace changes already describe functionality being composed here. This change does not rewrite their artifacts. At later spec sync, reconcile this content-source change with any newly canonical document specs; retain their existing snapshot/integrity contracts.

## Goals / Non-Goals

**Goals:** coherent navigation without lost work; one bounded persisted content graph; immediate dynamic content updates; owner-administered guest approvals; revocation on every subsequent protected request; preserved source/document relationships and public/private projections.

**Non-Goals:** replacing the overview or owner landing destination; a separate CMS service; a draft/publish lifecycle; unrestricted arbitrary site-builder content; a general automation engine; new guest roles or guest access to owner tools; shared passwords; automatic credential mail; deployment or live data/account mutation during planning or local implementation acceptance.

## Decisions

### 1. Shared owner shell with a route-aware outlet

Extract the inbox shell proportions and visual values into reusable rail/sidebar/toolbar/content surfaces. Render the shell for owner working screens; keep the existing `/dashboard` overview available and keep the owner post-login default there. The owner sees the shell on `/interview`; guests keep the existing interview-only experience without owner navigation.

```text
+--------+--------------------+-------------------------------------+
| Avatar | Context sidebar    | Area toolbar                        |
| Mail   |                    +-------------------------------------+
| Jobs   | Folders / jobs /   |                                     |
| Data   | workflows /        | Selected screen, document,          |
| Flow   | CMS sections /     | recording, or editor                |
| Video  | accounts           |                                     |
| CMS    |                    |                                     |
| Users  |                    |                                     |
| Gear   |                    |                                     |
+--------+--------------------+-------------------------------------+
```

Place the avatar/dropdown at the top of the rail. Keep account identity, overview, portfolio, and sign-out actions there. Put Contacts, Manage labels, and Mailbox settings below a divider in the Mail sidebar. CMS owns the photo and content editing. Settings exposes supported application/mail configuration; it does not offer credential editing or invent new provider controls.

Desktop uses the inbox's compact scale and clear selected rail state. Below the narrow breakpoint, retain a slim left rail and make the contextual sidebar collapsible; give the main pane the remaining width. Provide icon names/tooltips, visible focus, and touch targets without shrinking document text. Relocate floating compose controls as needed so the rail/sidebar toggle and composer do not overlap.

Alternative: add eight links to Inbox while keeping independent full-page layouts. Rejected because it would preserve the visual fragmentation and destroy page-local state during each switch.

### 2. Explicit URLs and persistent per-area state

Introduce a small route manifest and owner shell controller/outlet compatible with existing server page resolution. Keep server authorization authoritative for direct HTML and any client page-data requests; a client route match never authorizes access. Use a same-origin, owner-authorized page-data loader for the known workspace route set rather than fetching arbitrary URLs or reparsing rendered HTML. Render initial HTML from the same route definition and support browser history with no hydration mismatch.

| Area | Route treatment | Sidebar / main content |
| --- | --- | --- |
| Mail | Preserve `/dashboard/inbox`; encode folder/view/thread and supported filters | Existing folders/tools and mail content |
| Saved Jobs | Preserve `/dashboard/jobs` and `/dashboard/jobs/:id` | Job list and existing workspace/document controls |
| Evidence | Preserve `/dashboard/resume` | Search/categories and live evidence |
| Workflows | Add `/dashboard/workflows`; preserve all existing tool URLs | Five workflow entries and selected explanation/workbench/result |
| Recorded Answers | Preserve `/interview` and existing answer fragments | Questions/categories and recording/details |
| CMS | Add `/dashboard/cms/:section` with optional selected record | Content sections and selected list/editor |
| Accounts | Add `/dashboard/accounts` with optional selected account | Account list and approved identity editor |
| Settings | Add `/dashboard/settings` | Supported settings categories and active controls |

Preserve existing `tool`, tone/hours, generation intent, and application-return parameters. Use an explicit `area=workflows` context on shared job-document URLs when the user entered through Workflows; a legacy job URL without it opens Saved Jobs. Opening a saved job then choosing a workflow selects the same job; a new description remains an explicit action. Starting Interview Prep and Study Plan maps to their existing separate artifact kinds.

Own selected jobs/workflows and per-area navigation state above page components. Keep the composer mounted at shell level, preserving its existing serialized autosave and application handoff. Retain mail filters/selection and editor drafts during area switches; pause inactive-area polling and cancel obsolete reads. Use an unsaved-change registry for forms that cannot safely remain mounted. A navigation requiring discard presents Stay, Save, and Discard; a failed save stays on the form. Never put descriptions, passwords, or private evidence in URL state or browser storage. Full reloads restore durable drafts/artifacts; dirty full-page exits use the browser's unload protection where available.

Alternative: introduce a new framework/router and migrate every public page. Rejected because this application already has server rendering and authorization; the shell only needs a bounded owner route layer.

### 3. One bounded canonical content document

Use the existing Firestore database and server adapters. Start with a single `portfolio/content` document containing `schemaVersion`, monotonic `revision`, timestamps, profile/contact fields, site-copy fields, and normalized maps plus explicit order arrays for experiences, bullets, projects, skills, education, evidence facts, and their relationships. Stable generated IDs replace positional source IDs. Date fields carry their known precision; never turn a year-only period into a fabricated day.

The inspected source size supports a bounded singleton rather than a new multi-record publication system. Set a conservative encoded payload cap (initially 512 KiB, excluding media), per-field/count limits, and an emulator assertion that the encoded Firestore document stays safely below its storage limit. Exclude large maps from unnecessary indexes. Save one complete validated revision in a transaction using the editor's expected revision; return 409 on conflict. A section-level API applies a bounded patch to that revision, validates all affected links, and commits it atomically. No content-history browser, scheduled publication, or background synchronization is introduced.

Keep public presentation fields separate from private supporting evidence in the schema and projection functions. Preserve current public inclusion and ordering during migration; additional historical facts become editable live evidence without automatically placing every imported role/project on the homepage. CMS can change public inclusion immediately. Skill dates/ratings, aliases, project links, and role/project relationships belong to these records, not to a second archive. Linked deletion either atomically applies the owner's accepted dependency cleanup or fails with references to resolve.

Read this document once per dynamic render or generation and pass the immutable in-memory revision through its consumers. A failed/missing canonical read is an explicit unavailable state, never a silent fallback to bundled starter files. Server projection functions produce public page data, private CMS data, and approved model evidence; private project support text is never spread into public payloads. Profile-photo binaries stay in the existing bounded upload/manifest path and are linked from CMS.

Alternative: normalized Firestore collections plus immutable full snapshots for every edit. Deferred because the current single-owner content fits a small document and atomic edits avoid mixed revisions without introducing another publishing/history system. If the cap is reached, report it accurately; a future storage-layout change can preserve the API contract.

### 4. Import starter data once, then remove runtime authority

Implement a server-side migration command with a read-only report first, explicit emulator/live targeting, source hashes, versioned mapping rules, and receipts. Use deterministic seed IDs and a curated identity map based on existing IDs, employer/title/period, project links, and explicit skill aliases. Prefer current approved narrative for clearly matched records while retaining useful historical dated facts and self-ratings as linked editable evidence. Never merge ambiguous matches solely by similar labels. Report them for resolution or retain distinct facts/records.

The first import transaction creates canonical content only after validation. A retry recognizes its completed receipt; later starter-file changes or existing CMS content cause a report/conflict instead of reseeding over edits. Produce before/after inventories of roles, projects, skills, bullets, dates, links, public inclusion, and unresolved mappings. Update recorded-answer experience links to stable IDs while preserving their current media and transcript behavior; this is not a new video-production system.

After parity checks, replace runtime imports in `entry-server`, `public-profile`, `resume-evidence`, AI generation/application routes, filenames, templates, and build entry points. Move JSON-inferred application types into explicit shared contracts. Starter files can remain migration/test inputs until removal is safe, but production never reads them as fallback and the UI stops describing the archive as the authority. Migration receipts record import provenance, not a perpetually synchronized archive.

Alternative: leave archive calculations in place and place a CMS override over `profile.json`. Rejected because records and skill totals would still disagree and runtime would still have competing authorities.

### 5. Revision-consistent documents and dynamic public delivery

Each model request captures one content document revision, readable evidence, and stable IDs. Extend saved provenance with `contentRevision` while retaining the existing evidence hash and legacy-reader compatibility. Stored structured results are self-contained: deleted/reordered live sources never change an old résumé. Validate returned source IDs against the captured graph, not a fresh database read. Existing Current/Previous rotation, notes isolation, PDFs, and email attachment snapshots remain unchanged.

Refactor standard résumé rendering to accept an explicit public projection. Serve dynamic Firebase `/` through Functions rather than the packaged Hosting `index.html`; serve `/resume.pdf` through Functions rather than a Hosting asset. Remove static files that shadow these routes in Firebase packaging. On PDF request, load current public content, render or reuse a PDF keyed by the public content hash and renderer version, and use revalidation/no-cache headers. After generation, recheck that the selected public revision is still current before claiming it as current; retry within a bounded request budget or return a visible unavailable response. New standard-résumé mail attachments use the same resolver. A rendering failure leaves CMS content saved, reports PDF unavailability separately, and never serves an older file as the new document.

The optional Pages build receives a versioned, allowlisted public snapshot exported deliberately from saved content. The snapshot contains enough public dated/skill data for search and the standard PDF, with no private support text, accounts, media access data, or job records. Builds use a selected checked-in/public snapshot or an explicit input file and require no live Firestore/Auth calls. An owner-authorized snapshot-download action may prepare that input; exporting or deploying it remains an explicit action. The existing static output is a snapshot and does not update with live CMS saves. Public mail-icon generation similarly uses the selected public snapshot and existing allowlisted assets.

Alternative: trigger Firebase builds on every Save. Rejected because Save should update dynamic content directly and build/deployment is unnecessary complexity.

### 6. Managed approval records separate authentication from authorization

Use `portfolio/access/accounts/{emailHash}` records containing an opaque account ID, normalized email, display name, guest role, allowed methods, active state, bound UID when known, monotonic `accessVersion`, `reauthenticateAfter`, and timestamps. Normalization trims and lowercases only; it does not collapse Gmail dots or plus aliases. A UID index enforces one active application identity per provider UID. Retain an inactive tombstone when removing access so reapproval increments the version instead of reviving old authority. The email field is immutable after creation; changing an approved email uses remove-and-add so access is never silently transferred.

Store the owner record separately/protected with the existing UID and Google-only method. Bootstrap it from verified owner identity and trusted server-side migration configuration, never from an arbitrary first visitor or an email submitted by a client. Preserve the exact owner email and server-assigned `terrell` claim checks. Guest management accepts only recruiter/interviewer roles; owner role/method/removal fields are immutable. Do not expose password provisioning/reset for the owner. No guest can create another owner.

Remove the role dropdown and owner-only Google hint/rejection from the general login client. Keep recent-token verification, four-hour secure HttpOnly cookies, throttling, same-origin exchange, popup preparation, and server-controlled return destinations. The server checks verified provider identity, approved email, bound UID, allowed method, active state, and current access version. For Google, require verified email and the Google provider. For passwords, require the bound provisioned Firebase UID/email and enabled password method. Unknown Firebase users can exist after an unsuccessful Google attempt but receive no application authority.

Alternative: use only Firebase user existence or custom claims as the allowlist. Rejected because unapproved Google identities may exist and old signed claims do not reflect an owner's immediate access removal.

### 7. Server session receipts make removal effective and reapproval safe

When issuing a Firebase session cookie, create a private session receipt at `portfolio/access/sessions/{sha256(cookie)}` with account ID, UID, verified method, accessVersion, issued time, and expiry. Store no raw cookie. Require the verified token's authentication time to be strictly later than the account's latest `reauthenticateAfter` boundary, using conservative whole-second handling. A refreshed token from an old sign-in is insufficient. Immediately before finalizing the receipt/session response, transactionally recheck that the approval remains active at the version authenticated, closing approval-change races. Failure to write the receipt issues no application session.

On every protected page/API/media request, verify the Firebase cookie with revocation checking, load the matching receipt and active account, compare UID/method/accessVersion, and derive the current permitted role from that account. Owner requests additionally retain the exact Google identity and owner-claim checks. Refactor the shared authorization functions so legacy direct claims readers cannot bypass the registry. Never use a positive cross-request allowlist cache. Session expiry permits best-effort receipt cleanup; stale receipts cannot grant access.

Removal commits inactive status and increments accessVersion first; it then revokes Firebase sessions with a retryable cleanup receipt. Account/method/role changes, password resets, and reapproval increment accessVersion and advance `reauthenticateAfter`. Consequently old cookies fail even if Firebase revocation is delayed, fails, or has coarse timestamp granularity; an old ID token also cannot be exchanged for a new-version session after reapproval. New approvals also require authentication after approval. Existing cookies without a receipt require fresh authentication at cutover. An already delivered page/video segment cannot be recalled; subsequent protected requests, including range requests, are denied.

Alternative: revoke Firebase tokens and trust cookie claims until expiry. Rejected because failures and reapproval races would violate the immediate-removal contract. The extra Firestore reads are acceptable for this small private application and reuse the existing verified server boundary.

### 8. Individual password provisioning and provider linking

Expose bounded owner-only account operations through `/api/accounts/**`, authorizing before body parsing/provider calls. Generate each password on the server using cryptographic randomness (for example 24 random bytes encoded as base64url). Store credentials only through Firebase Authentication; never persist plaintext in content, receipts, logs, URLs, local storage, or account lists. Reveal it only in the explicit successful operation response; clearing/leaving the reveal requires copying or acknowledging its loss. Do not send mail or add routine password rotation.

Provisioning spans Firestore and Auth, so use attempt IDs, a stable intended UID, a per-account operation/version fence, and private pending/completed/failed/uncertain receipts without secrets. Do not enable a password method until Auth confirms provisioning. A lost reveal cannot be recovered from storage: reconcile the account and offer an explicit new generation. Do not automatically replay an uncertain password reset as a new reset. Removing/changing an account fences an in-flight provisioning completion so it cannot re-enable removed access. Retry uses the same UID and checks the expected account version. UI distinguishes saved approval, provisioning progress, and usable credential.

Google-only approval does not need a password or necessarily a pre-created Auth user. First approved Google login binds the verified UID transactionally. Existing password users and users enabling both methods must link using authenticated Firebase provider-linking flows and resolve credential collisions explicitly; do not merge records by unverified email text. If the provider has already linked both methods to the same verified UID, accept only when the registry also permits both. App-level allowed-method checks remain authoritative even if provider recovery enables an unwanted credential. Guest access removal preserves the identity/tombstone and revokes sessions rather than relying on deleting a Google user who could be recreated.

Alternative: a shared rotating password. Rejected because any recipient could authenticate against another allowlisted email and removing one person's address would not reliably remove that person.

### 9. Scoped APIs, validation, and local evidence

Add `/api/cms/**` and `/api/accounts/**` with owner authorization before private reads, bounded bodies, same-origin mutations, optimistic revision/version preconditions, private/no-store responses, and explicit method/error contracts. Do not reuse a whole-record public spread. Extend server adapters as needed for account listing/search and receipts; keep Firestore/Storage client rules denying direct access, including authenticated owner clients. Public content is served only through explicit safe projections and approved media/PDF routes.

Use isolated Auth/Hosting/Functions/Firestore/Storage emulator suites with separate ports and temporary blob/export directories. Synthetic accounts and mail fixtures prove local flows without live user provisioning, credential mail, model calls, or cloud fallback. Check direct rules denial separately from server authorization. Browser checks cover 375px/1440px navigation, dirty-form handling, popup login and guest linking, CMS propagation, documents, and removal from a second already-signed-in browser context. Run `npm run preflight` after routing/auth/build changes and preserve existing credentials and unrelated work.

## Risks / Trade-offs

- Historical/current records disagree -> deterministic mapping report, preservation of richer approved facts, explicit unresolved matches, and no continuing parallel archive.
- Stable IDs change AI source contracts -> capture a full immutable input revision per request, preserve legacy stored-result readability, and reject cross-record references in focused tests.
- Firestore singleton growth or contention -> conservative size/count bounds, optimistic saves, no binaries, and explicit conflict/limit errors rather than silent loss.
- Static Hosting files mask live updates -> remove root/PDF shadows from Firebase packaging and verify the actual emulator Hosting routes after Save.
- Access approval and Firebase operations partially fail -> deny-first registry transitions, version fences, stable UIDs, operation receipts, and visible reconciliation.
- Cached cookies/roles outlive approval -> mandatory receipt/version checks on every protected route and range request; cutover requires fresh login.
- Inactive view state causes unwanted polling or memory growth -> mount only bounded per-area state, suspend polling, and cancel obsolete reads.
- Broad restyling disrupts mail/document behavior -> reuse existing functional components and accept navigation/state preservation before expanding visual changes.
- Existing static exports cannot update on live saves -> retain the explicit snapshot/rebuild boundary and test their public-only contents.

## Migration Plan

1. Add explicit contracts, repositories, migration reports, and synthetic fixtures without switching live consumers. Capture current content inventories and preserve the existing owner UID and guest passwords.
2. Exercise content import and account import in isolated emulators. Import only explicitly assigned recruiter/interviewer users, retaining UIDs and existing methods; unassigned Auth users remain unapproved. Seed the protected owner record. Commit receipts and validate before enabling new runtime gates.
3. Wire canonical content and session registry readers, coherent documents, dynamic public routes, safe static snapshots, and new CMS/Accounts APIs. Missing initialization fails visibly; no runtime JSON/custom-claim-only fallback is allowed.
4. Compose the shell and editors, migrate direct links and guest login, and complete emulator/browser/preflight acceptance. Existing private job paths and owner UID stay unchanged. Keep `/dashboard` and its landing behavior.
5. Prepare a separate release runbook with content/account exports, exact migration report, initialization checks, fresh-login cutover, route/PDF verification, and rollback. Running it against a live project and deploying remain separately authorized operations.
6. Rollback must preserve canonical content, account tombstones/access versions, guest credentials, and existing job/media objects. Prefer restoring the prior UI while retaining new data/authorization adapters. Do not roll back to claims-only guest authorization after access has been removed. If full code rollback is necessary, deny guest access first and reconcile provider users/claims to current approvals; export later CMS edits before restoring any snapshot. Never reseed old starter data over saved edits.

## Provider References

Reviewed during planning on 2026-11-05; confirm installed SDK contracts during implementation:

- [Firebase Admin user management](https://firebase.google.com/docs/auth/admin/manage-users): server-side account creation/update and provider user administration.
- [Firebase session cookies](https://firebase.google.com/docs/auth/admin/manage-cookies): verified cookie issuance, revocation checking, and server-managed session handling.
- [Firebase provider linking](https://firebase.google.com/docs/auth/web/account-linking): multiple authenticated login methods attached to the same UID; verify known SDK caveats in the local and live acceptance boundaries separately.
