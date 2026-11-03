# Tasks

Local acceptance is recorded in [evidence/local-acceptance.md](evidence/local-acceptance.md). Planning completion is not implementation or deployment completion. Groups 1–8 target local acceptance; group 9 requires live-operation authorization and separate provider/deployed/DNS evidence.

## 1. Mail provider and backend configuration

- [x] 1.1 Add a pinned Resend SDK with the required inbox methods to the application and self-contained Functions runtime manifests; verify compatible types, successful builds, and the Functions dependency/artifact check.
- [x] 1.2 Define typed mailbox operations and live/fixture configuration with the configured owner inbox binding; verify missing configuration, unauthorized inbox selection, and production fixture mode fail explicitly in focused tests.
- [x] 1.3 Implement deterministic in-process mail fixtures for summary, conversations, drafts, labels, contacts, settings, and contact-form ingress; verify fixture operations make no network sends and preserve retry identities in adapter tests.
- [x] 1.4 Implement the live adapter's SDK mapping, pagination, error normalization, bounded read retries, and immutable write-attempt idempotency; verify SDK-contract tests include timeouts, uncertain writes, rate limits, and conflicting retry payloads.
- [x] 1.5 Document backend environment values and local mail modes in project documentation/examples without values; verify the existing root `.env.local` and configured backend credentials are preserved and no Secret Manager binding is introduced.

## 2. Private pages and API boundaries

- [x] 2.1 Add `/dashboard/inbox` to the resolver, app page selection, and page-data types; verify owner access and unauthenticated, guest-role, and revoked-session denial through emulator HTTP tests.
- [x] 2.2 Add authenticated `/api/inbox/**` dispatch with fixed inbox/sender binding and same-origin mutation validation; verify every route denies access before provider calls and returns private/no-store responses.
- [x] 2.3 Add bounded mail payload parsing separate from the existing small JSON helper, with address, recipient, content, and attachment validation; verify boundary-size, encoding-overhead, malformed-body, and unauthorized-large-body cases.
- [x] 2.4 Document the mailbox API's request/response/error contracts and opaque resource identifiers; verify route-method and resource-binding tests match the documented operations.

## 3. Owner dashboard and inbox navigation

- [x] 3.1 Remove exercise badges and exercise-oriented action text, update the owner workspace introduction, and preserve all existing tools/evidence/interview links; verify rendered dashboard assertions and link navigation.
- [x] 3.2 Add the full-width inbox card using native unread/draft/last-received values and recent-thread previews; verify populated, empty, stale, loading, and provider-error states without fabricated counts.
- [x] 3.3 Build responsive folder/list/conversation navigation with selection and cursor pagination; verify phone/desktop browser interaction, keyboard focus, read/unread changes, archive/trash/restore, and access to Sent and Spam.
- [x] 3.4 Add query/filter controls and cancellation plus focus/mutation/visible-tab refresh; verify combined filters, old-response suppression, hidden-tab polling suspension, and provider backoff, and document refresh behavior.

## 4. Composition, drafts, replies, and message content

- [x] 4.1 Implement the native-draft composer with recipient fields, subject, text/rich content, serialized debounced autosave, and save-state feedback; verify reopening persisted drafts and retaining edits after failed saves or session expiry.
- [x] 4.2 Implement explicit draft sending and send-attempt reconciliation using stable idempotency identities; verify one outbound message after duplicate submissions or lost responses and clear recovery on permanent failures.
- [x] 4.3 Implement native reply, reply-all, and forwarding actions with editable content and CC/BCC; verify recipient/thread mappings through adapter tests and fixture browser conversations, including the contact form's visitor reply address.
- [x] 4.4 Implement file selection and private attachment downloads with published application/provider limits; verify allowed files, rejected oversized/unsupported files, unauthorized downloads, foreign resource IDs, and arbitrary-URL rejection.
- [x] 4.5 Add sanitized, sandboxed HTML reading with plain text, safe external links, and explicit remote-image loading; verify malicious HTML remains inert and attachment content cannot execute as site content.
- [x] 4.6 Document composing, autosave, retry/reconciliation, session-expiry recovery, and attachment limits; verify the UI's states and controls match those instructions in the fixture browser flow.

## 5. Labels, contacts, and supported settings

- [x] 5.1 Implement inbox-label CRUD and native thread-label changes; verify persisted labels, recoloring/renaming, filters, and removal using adapter and browser tests.
- [x] 5.2 Implement paginated Resend Contacts views, explicit add/edit/delete, and recipient suggestions; verify account-scope messaging, no thread-deletion contact side effects, and unchanged subscription preferences for ordinary correspondence.
- [x] 5.3 Implement inbox display settings and supported agent instructions/tone/actions with an initially disabled autonomous-action configuration; verify explicit saves, accurate provider errors, and visible unsupported states.
- [x] 5.4 Document contacts' account scope and agent-control defaults; verify the application does not auto-create contacts, subscribe public visitors, or enable autonomous actions during ordinary mail use.

## 6. Public contact-form delivery

- [x] 6.1 Add `POST /api/contact` validation, bounded per-instance abuse controls, honeypot, and origin/size checks; verify public access, invalid data, routing/header injection, cross-origin requests, rate limits, and no provider call on rejection.
- [x] 6.2 Deliver valid submissions through the fixed verified contact sender and owner recipient with validated visitor Reply-To and stable submission idempotency; verify fixture ingress creates one conversation and retries do not duplicate it or create marketing contacts.
- [x] 6.3 Replace preview-only form behavior with sending/accepted/error/uncertain/local-test states and preserved failed input; verify acceptance is not labeled confirmed delivery and that form contents are never submitted in URL query strings.
- [x] 6.4 Document the public endpoint, proposed limits, approximate rate-limit scope, and accepted-versus-delivered semantics; verify a local browser contact submission appears in the authenticated fixture inbox and supports an owner/visitor reply exchange.

## 7. Inbox events, packaging, and static privacy

- [x] 7.1 Add the signed inbox callback endpoint using the original request body and configured mailbox binding; verify valid signatures, tampering, wrong mailbox, unsupported event types, and replay without outbound-mail/contact side effects.
- [x] 7.2 Connect safe event invalidation/read behavior to the adapter while retaining provider-authoritative polling; verify refresh after event replay and document that callbacks do not supply guaranteed cross-instance browser push.
- [x] 7.3 Add the static inbox availability route and explicit static contact-form unavailability; verify Pages base-path links and that neither public artifact includes inbox payloads, credentials, attachment bytes, or private search content.
- [x] 7.4 Update Functions packaging and environment/webhook operation documentation; verify clean build artifacts declare the required server dependencies and environment fixtures restore the existing local files after tests.

## 8. Integrated local acceptance

- [x] 8.1 Run `npm run preflight` with the mail fixtures integrated into Auth/Hosting/Functions acceptance; verify all checks pass without live provider mail or standalone test servers.
- [x] 8.2 Exercise contact submission, dashboard summary, conversation replies, compose/drafts, labels, search/pagination, contacts, settings, and attachments at 375px and 1440px in the emulator browser; verify role denial, no hydration errors, and safe HTML rendering.
- [x] 8.3 Record local acceptance evidence and a deployment-readiness report; verify it separates fixture proof from still-pending deployed, live-provider, and receiving-DNS evidence and preserves unrelated worktree changes.

## 9. Live activation and receiving cutover

- [ ] 9.1 With authorization for live setup, select the real Firebase project, inspect the intended Resend account/permissions and domain verification, inventory other active recipients, and capture current MX/TTLs; verify an operational record includes exact provider DNS requirements, recipient disposition, and rollback data without credentials.
- [ ] 9.2 Provision the owner inbox and verify the selected sender/display identity and disabled autonomous-action defaults; verify recorded provider resource identifiers and sending prerequisites for `terrell.singleton@thehandsomestnerd.com` before any MX change.
- [ ] 9.3 Deploy the reviewed application and configure backend environment values and signed webhooks with explicit deployment authorization; verify deployed owner access, guest/unauthenticated denial, summary reads, and valid signed callbacks.
- [ ] 9.4 Perform the prepared direct Resend receiving-MX cutover after explicit authorization and recipient readiness; verify authoritative/public DNS propagation and controlled incoming mail to the selected address using the exact account/region records.
- [ ] 9.5 Run a controlled live contact submission -> owner reply -> visitor follow-up round trip plus compose, drafts, search, labels, contacts, and attachments; verify correct recipients, one conversation, provider-backed statistics, and actual external delivery rather than acceptance alone.
- [ ] 9.6 Record post-cutover health and the verified rollback procedure, restoring the captured MX set if receiving fails; verify separate deployment/provider/DNS evidence and retain every unproven operational task as unchecked.

## Workflow follow-up

- Review the completed implementation and operational evidence before any separately requested specification sync or archive.
