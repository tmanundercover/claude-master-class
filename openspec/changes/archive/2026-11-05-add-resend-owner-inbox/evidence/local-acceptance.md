# Local acceptance and deployment readiness

Date: 2026-11-03. Change: `add-resend-owner-inbox`.

Follow-up: [live local readiness](live-local-readiness.md) records subsequent read-only provider verification and local emulator configuration. The fixture-only statements below describe the earlier acceptance run.

Local implementation and acceptance are complete (tasks 1.1–8.3, 34/40 total). Tasks 9.1–9.6 remain unproven and unchecked. The application has not been deployed and the receiving MX records have not been changed.

## Verified evidence

| Check | Result | Scope |
| --- | --- | --- |
| `npm run preflight` | Passed | 63 unit tests, lint, TypeScript, public Pages build, 6 Pages checks, Firebase build, 4 package/privacy checks, 14 emulator HTTP tests |
| `npm run test:mail:browser` | Passed | Chrome at 375px and 1440px through Auth, Hosting, and Functions emulators |
| `BASE_PATH=/owner-inbox-proof/ npm run build:pages` followed by `npm run test:pages` | Passed, 6/6 | Non-root asset/link base paths, inbox availability route, static form unavailability, public-only export |
| `openspec validate add-resend-owner-inbox --strict --json` | Valid, no issues | Coherent planning artifacts and delta requirements; not proof of live delivery |
| Environment preservation | Exact original SHA-256 fingerprints match | Root `.env.local` and `functions/.env.local`; no values printed or copied into evidence |
| `git diff --check` | Passed | Whitespace and conflict-marker hygiene |

The 63 unit tests include 16 focused mail tests. They cover explicit modes and production fixture denial, deterministic fixture state without network sends, combined search/cursors, native drafts, labels and account contacts, subscription preservation, fixed delivery identity, 10 MiB decoded attachment boundaries/base64 overhead, malformed/streamed bodies, every private route's authorization before provider creation, origin checks, foreign resources/download URLs, public abuse controls, HTML sanitization, signed event tampering/replay, exact pinned SDK serialization, bounded read failures/rate limits, conflicting attempts, cross-instance contact-send reconciliation, and native draft `email_id` reconciliation after a lost response. SDK contract tests intercept fetch; they do not use live credentials or send real mail.

HTTP tests exercise the actual Hosting rewrite and Functions raw-body adapter with Auth emulator sessions: owner access, recruiter/interviewer denial, unauthenticated requests, revoked owner sessions, dashboard links/badge removal, contact ingress and duplicate prevention, correct visitor Reply-To, duplicate owner replies, private attachment disposition, same-origin checks, and signed callback replay/tampering. Existing career tools retain their role and missing-provider behavior.

The browser record is [browser-results.json](browser-results.json). Both sizes cover public contact → local inbox → owner reply, compose, CC/BCC, file selection/private download, persisted draft reopening, native forwarding, cursor navigation, read state, archive/trash/restore, Sent/Spam, label creation/rename/application, explicit account contact creation/editing, explicit settings saves with no autonomous actions enabled, keyboard focus, safe HTML, explicit remote-image consent, and guest denial. There was no horizontal overflow or captured hydration/page error. Remote tracking-image requests were intercepted locally; the fixture's active HTML remained inert.

Desktop recovery checks use deliberate browser response interception to exercise unavailable autosave, expired-session responses with retained edits, provider-accepted/lost contact and draft-send responses, unchanged attempt reuse with one resulting conversation/send, empty/stale/error summaries, obsolete-response suppression, hidden-tab polling suspension, and Retry-After backoff. These are UI recovery proofs, not real provider failures. Contact browser proof covers ingress and the owner's reply; a fixture unit test supplies the visitor's follow-up to the same native conversation. Actual external email exchange remains task 9.5.

Raw execution logs remain temporary local files (`/tmp/owner-inbox-preflight-final.log`, `/tmp/owner-inbox-browser.log`, `/tmp/owner-inbox-pages-base.log`). Only the redacted browser result record is retained here.

## Implementation choices established during acceptance

- Pin Resend 6.37.0 and sanitize-html 2.18.1 in both application and self-contained Functions manifests. Use server-only adapters, validated IDs and payloads, native provider pagination/counts, immutable attempt IDs and provider idempotency. No credential or live provider work enters client/static rendering.
- Use Firebase's documented serialized Functions emulator mode for in-process fixtures. Concurrent browser requests otherwise reach separate fixture processes. This is selected only for fixture startup/tests and is explicitly not production-concurrency evidence. The existing live Functions max-instances/concurrency configuration remains unchanged.
- Refresh draft lists when closing a saved composer. Preserve failed edits and give reopened textareas stable accessible names. Keep the dashboard inbox card full width and the inbox-page summary compact; expose advanced search controls through a native disclosure on both sizes.
- Keep the existing root and backend environment files unchanged. No Secret Manager binding, standalone application server, persistent browser mail cache, Firestore mail mirror, marketing subscription side effect, or automatic email sending was introduced.

Implementation/API/operator instructions are in [Owner inbox](../../../../../docs/owner-inbox.md). Reproduce browser acceptance with `npm run test:mail:browser`; Chrome is required (the script uses the installed macOS Chrome by default, or `CHROME_PATH`).

## Live readiness and remaining gates

| Task | Unproven requirement |
| --- | --- |
| 9.1 | Select the real Firebase project and intended Resend account; verify permissions/domain records; inventory every other active domain recipient; capture fresh MX/TTLs and exact account/region DNS requirements plus rollback data |
| 9.2 | Provision the owner inbox and confirm the proposed sender/display identity and disabled autonomous actions; record actual provider identifiers and sending prerequisites |
| 9.3 | Review/authorize deployment and backend values/webhook configuration; then prove deployed owner/guest/revoked behavior, native summary reads, and signed callbacks |
| 9.4 | Separately authorize the prepared receiving-MX cutover after recipient readiness; then verify authoritative/public propagation and external inbound mail |
| 9.5 | Prove actual external contact → owner reply → visitor follow-up in one conversation, plus real drafts/search/labels/contacts/files and native counts |
| 9.6 | Record health and verify the captured MX restoration procedure; restore prior routing if receiving fails |

No `.firebaserc` currently selects a live project. The account's inbox ID, permission scope, verified contact sender, webhook signing value, other-recipient disposition, and exact receiving records have not been verified in this implementation run. A backend credential's presence is not evidence of any of those prerequisites. The planning-time Google MX observation is not a fresh rollback record. Local results therefore establish source/fixture readiness for controlled setup, not deployed, provider, or receiving-DNS readiness.

The pre-existing dirty proposal/design and untracked tasks artifact were preserved; the design gained the fixture-process decision and task checkboxes now reflect evidence. No commit, canonical spec sync, archive, deployment, provider provisioning, external mail send, or DNS mutation was performed.
