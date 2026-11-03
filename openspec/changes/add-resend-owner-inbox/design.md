# Design

## Context

See [proposal.md](proposal.md) for motivation and scope. The application is a Vite React client with universal rendering in `src/entry-server.tsx`, served through Firebase Hosting and the `portfolioApp` Functions entry point. `/dashboard/**` pages already authorize the `terrell` role, and `requireApiSession` protects owner APIs. Authentication remains a four-hour Firebase session using `__session`.

`Dashboard.tsx` currently presents career tools with exercise badges. `ContactForm.tsx` is a preview that never sends. There is no mail router or server Resend dependency yet. A configured `RESEND_API_KEY` was observed in `functions/.env.local`; its value and provider permissions were not inspected. The Functions adapter preserves the original request body, which is suitable for signed webhook verification. Its deployment allows up to three concurrent instances, so process memory is not a durable shared database.

OpenSpec has no existing canonical capabilities or other active changes. The current worktree also contains portfolio work that this change must preserve.

Confirmed choices are the owner address `terrell.singleton@thehandsomestnerd.com` and direct incoming delivery through Resend. Public MX lookup on 2026-11-03 showed Google's `aspmx.l.google.com` and four `alt*.aspmx.l.google.com` targets. That is a discovery snapshot, not a deployment record or permission to change DNS during planning.

## Goals / Non-Goals

**Goals:**

- Bind all private mail operations to the existing owner session and one configured inbox.
- Use provider-native messages, threads, drafts, folders, labels, contacts, and summary values.
- Give the public form a complete path from submission to an owner reply and visitor follow-up.
- Keep local execution on the Firebase emulators and make live activation independently verifiable.

**Non-Goals:**

- Import historical Google mail, delete Google mailbox contents, or change the Firebase login identity.
- Add a general multi-tenant mail service, campaign/broadcast application, or new standalone server.
- Rebuild Resend's search index, thread storage, or counts in a second database.
- Enable autonomous email actions or alter DNS as a side effect of application deployment.

## Decisions

### 1. Extend the existing Functions application

Add `/dashboard/inbox` to the page resolver, `PageData`, `App.tsx`, and a new owner inbox page. Add a mailbox route dispatcher under `src/server/routes/` for the parameterized `/api/inbox/**` endpoints; the existing exact-path API table remains available for current tools. Every private operation authenticates before parsing expensive bodies or invoking Resend. Mutations apply the existing same-origin policy in addition to session validation.

Public contact and signed webhooks are separate endpoints with their own validation, rather than exceptions that weaken the private mail dispatcher. Continue `private, no-store` responses and `Vary: Cookie` for private resources. Use the existing same-origin Hosting rewrite; do not expose the API key to the browser.

Alternative: a separate Express or mail server. Rejected because the existing Firebase boundary already handles authentication, deployment, and local HTTP execution.

### 2. Add a narrow provider adapter and explicit modes

Define typed mail operations for summary, threads/search, message reading, send/reply/forward, drafts, labels, contacts, inbox settings, and agent settings. Normalize provider errors into configuration, validation, rate-limit, unavailable, and uncertain-write responses. Respect provider pagination and retry headers; use cancellation and bounded backoff for reads.

The live adapter uses a pinned official Resend SDK version whose inbox methods are verified by focused contract checks. Add its server runtime dependency to both the build package and self-contained Functions package as appropriate. Match current SDK payload shapes rather than guessing them from UI descriptions.

An in-process fixture adapter runs inside the existing Functions emulator. It implements deterministic mailbox records, contacts, drafts, and idempotency without HTTP servers or real sends. `RESEND_MODE=fixture` is permitted only in emulator execution; production fixture mode is a configuration error. Live mode is explicit and is never inferred merely from the presence of an API key. Missing live configuration returns unavailable status rather than fixture mail or zero counts.

### 3. Use backend configuration for identity and ordinary environment values

Proposed backend values:

| Variable | Purpose |
| --- | --- |
| `RESEND_MODE` | Explicit `fixture` or `live` selection |
| `RESEND_API_KEY` | Server-side provider credential; reuse the existing local value |
| `RESEND_INBOX_ID` | Provisioned owner inbox identifier |
| `RESEND_INBOX_EMAIL` | `terrell.singleton@thehandsomestnerd.com` |
| `RESEND_FROM_NAME` | Owner-visible outgoing display name, proposed `Terrell Singleton` |
| `CONTACT_FROM_EMAIL` | Proposed verified send-only identity `website@thehandsomestnerd.com` |
| `RESEND_WEBHOOK_SECRET` | Webhook signing value stored as an ordinary backend environment variable |

The contact sender is a proposed operational value, not an already provisioned mailbox. It must be reviewed against the verified domain before live activation. An inbox selector or arbitrary sender from the browser never overrides these bindings. Documentation and environment examples contain placeholders only; preserve existing root `.env.local` and backend values. No Secret Manager dependency or binding is introduced.

### 4. Keep the dashboard summary native and inexpensive

Place a full-width inbox card below the owner heading, alongside the existing résumé entry and above tool links. Refresh the heading and action text to describe a useful owner workspace, removing exercise badges while retaining the tools.

Use Resend's inbox summary fields `unread`, `drafts`, and `last_received`; fetch a small recent-thread page for previews. Show timestamps and explicit loading, empty, stale, and error states. A mail failure must not prevent access to other dashboard tools.

Alternative: count every page of messages or build a Firestore mirror. Rejected for these basic statistics because the provider already supplies the required values.

### 5. Build the inbox around native drafts and conversations

Use a responsive folder/label rail, paginated conversation list, and reading pane, collapsing to list/detail navigation on phones. Keep compose accessible from every folder. The mail page owns selection, query, and pending UI state; the provider owns persistent mail state.

New compositions use native inbox drafts and an explicit send action, keeping the saved draft identifier across retry. Replies and forwarding use native inbox operations and provider message/thread identifiers. Do not derive thread identity from subject lines or reconstruct native conversations in application storage. Verify recipient resolution, reply-all behavior, and the contact form's `Reply-To` behavior in provider contract/round-trip acceptance before declaring live readiness.

Autosave is debounced and serialized per draft. Expose unsaved/saving/saved/failed states; keep unsaved work in the active composer after failures or session expiry and allow copying it before reauthentication. Do not store mail bodies or attachments in persistent browser storage. Never automatically retry an uncertain send with a new idempotency key; reuse the same key and immutable payload until its result is reconciled. Editing after a failed attempt starts a new attempt.

### 6. Apply limits appropriate to email and protect rendered content

The existing `readJson` helper has a 20,000-character body limit and cannot serve attachment-bearing compositions unchanged. Keep small mutations on bounded JSON validation, and give composition/draft upload routes a separately bounded authenticated parser. The proposed application limit is 10 MiB total decoded attachments per composition and 512 KiB message content, capped further by any lower provider limit. Account for encoding overhead and reject oversize requests before unbounded buffering; expose these limits before upload.

Validate addresses, recipient counts, allowed file types, and provider attachment capabilities. Fetch private attachment metadata using the configured inbox and verified thread/message relationship. A download endpoint must not accept an arbitrary remote URL. Provider-returned download URLs are resolved just in time, restricted to trusted provider storage destinations and bounded redirects, and delivered as attachments with `nosniff` rather than executable site content. Do not copy mail files to Hosting or Pages assets.

Render HTML mail using maintained sanitization and a script-free sandboxed document. Strip active content and block remote images until the owner elects to load them. Provide plain-text reading and safe external links. Preserve accessible focus, keyboard navigation, recipient labels, and reduced-motion behavior.

### 7. Keep labels, search, contacts, and settings distinct

The provider adapter maps search text, sender/recipient fields, date range, folder, labels, attachment presence, and read state to documented thread search parameters. Preserve cursors and cancel stale requests when filters change; never report one page as a complete result set.

Labels use native inbox CRUD and native thread-label operations. Contacts use Resend's separate account-level Contacts API with pagination and explicit editing; names/email feed recipient suggestions. Make the account scope of contact deletion clear, and never delete a contact when deleting a thread. Do not auto-create contacts or alter marketing subscriptions from public submissions. Campaigns, topic subscriptions, and broadcasts are outside this mailbox UI.

Inbox settings expose supported display/from-name values. Agent settings expose the provider's supported instructions, tone, and allowed actions, initially with no autonomous actions enabled. Changes require an explicit owner save; preserve provider failures and report unsupported controls instead of simulating them. No app-driven automatic sending is enabled in this change.

### 8. Deliver the public form into the same mailbox

Add `POST /api/contact` with validated name, email, message, and a submission attempt identifier. Proposed limits are 100 characters for the name, 254 for the email, 8,000 for the message, and 12 KiB for the request. Reject unknown routing/header fields. Use same-origin checks, a honeypot, and a bounded per-instance rate limiter with `Retry-After`; document that three Functions instances can each hold their own limiter budget. Provider idempotency handles duplicate delivery across instance retries. Do not present this limiter as a globally durable quota.

Send transactional email from the configured contact identity to the fixed owner inbox with the validated visitor as `Reply-To`. Encode visitor content as text or escaped HTML. Do not send acknowledgements or subscribe visitors automatically. A success response means provider acceptance, not proof that delivery finished. Display errors and preserve form values on failure or uncertainty.

In fixture mode, the adapter inserts a received conversation so the complete public-form/private-inbox flow can be tested locally. Mark that result as a local test. The decisive live proof is a controlled submission, owner reply to the visitor, and visitor reply returning to the same thread. Acceptance and threading must be verified rather than inferred from an SDK success response.

### 9. Refresh from Resend and keep webhooks side-effect safe

Refresh summary/list state after successful mutations and on focus, with approximately 15-second polling while the active mail view is visible. Pause polling in hidden tabs, abort obsolete requests, and back off after failures or rate limits. This supplies cross-device consistency without an additional database or push service.

Add a signed Resend callback endpoint using the original raw request body and provider verification helper. Allowlist inbox event types and the configured inbox/domain binding. A valid event triggers only safe read/cache-invalidation work and redacted event metadata logging; it does not send mail, create contacts, or advance local authoritative counters. Replays are therefore harmless even across Functions instances. Brief per-instance read caching is optional; polling remains authoritative if an event reaches another instance. Webhooks alone are not claimed as browser push delivery.

Alternative: persist all events and introduce a real-time database/subscription layer. Defer this until durable workflow side effects or stronger push requirements exist.

### 10. Keep static builds public-only and failure-tolerant

Add the inbox availability page to `scripts/export-pages.mjs` and ensure private inbox payloads never enter HTML exports, JavaScript data, public search, source maps, or assets. Do not load live mail during public rendering or a build. The public-only Pages form remains explicitly unavailable without a backend; it cannot claim a send succeeded. Keep form submissions off URL query strings.

### 11. Stage the direct receiving cutover

The selected receiving architecture uses Resend MX records for `thehandsomestnerd.com`, without Google forwarding as the destination design. Application deployment and DNS changes are independent. Inventory other domain mailboxes/aliases before cutover so moving the domain's MX does not discard another recipient's mail.

Retrieve the exact sending and receiving DNS records from the intended Resend account and region. Do not guess MX targets or replace unrelated SPF/DKIM/DMARC configuration. Keep a fresh snapshot of prior MX records and TTLs for rollback. The observed Google MX set is only a baseline to recheck.

## Risks / Trade-offs

- New provider APIs or SDK gaps -> pin a supported version, cover exact payloads with contract tests, and block live readiness if native reply/attachment/agent behavior differs from the promised contract.
- Contact-form replies accidentally target the site's sender -> preserve the visitor's reply address and require a real owner/visitor round trip before cutover completion.
- Domain-wide receiving change affects other addresses -> inventory active recipients and provision approved recipients or document their disposition before changing MX.
- Duplicate or uncertain sends -> immutable attempt payloads, stable provider idempotency keys, and reconciliation instead of fresh-key automatic retries.
- HTML/attachment content is untrusted -> sanitization, sandboxing, remote-image consent, private downloads, and published resource limits.
- Polling consumes API quota and introduces a refresh delay -> query bounded pages only while visible, refresh immediately after user actions, and respect provider backoff.
- Per-instance abuse limits are approximate -> state the limit honestly, monitor real volume, and add shared enforcement only if observed abuse requires it.
- Agent configuration can enable provider-side actions -> start with actions disabled, expose only documented settings, and require deliberate owner saves.
- Changing MX does not migrate historical messages -> keep Google history intact and scope any later import separately.

## Migration Plan

1. Implement and pass fixture unit, role/origin, emulator HTTP, browser, and artifact/privacy checks. Update existing dashboard assertions and run `npm run preflight`.
2. Prepare deployment and backend environment configuration without logging or committing values. Keep the new inbox visibly unconfigured until its live provider setup is ready.
3. With explicit live-operation authorization, verify the Resend account/domain, permission scope, exact DNS requirements, recipient inventory, and inbox provisioning; capture prior DNS/TTLs and rollback instructions. An existing API-key value is not proof of domain verification or inbox permissions.
4. Deploy the reviewed application and configure the signed webhook endpoint. Verify owner access and unauthenticated/guest denial against the deployed Functions application.
5. With explicit authorization for the prepared DNS cutover, install Resend's receiving MX records, verify propagation, and test controlled external incoming and outgoing mail.
6. Prove public submission -> owner inbox -> visitor reply delivery -> visitor response in the same thread; exercise drafts, labels, search, contacts, and attachments against the live provider. Record fixture, deployed, provider, and DNS evidence separately.
7. If receiving fails, restore the recorded MX set and verify Google routing recovery. Disable or accurately report contact delivery problems while keeping the public portfolio and existing tools available. Preserve mailbox content and Google history throughout rollback.

Operational tasks remain unchecked until their own evidence exists. Local acceptance alone does not complete deployment or MX-cutover tasks.

## Open Questions

- The actual Resend inbox ID, domain verification state, exact region-specific DNS records, and webhook signing value will be obtained during provider setup.
- Other active `thehandsomestnerd.com` recipients must be inventoried before the already-selected domain cutover; this gates operations, not local implementation.
- Confirm the proposed contact sender `website@thehandsomestnerd.com` and outgoing display name before live activation.

## Provider References

Checked during planning on 2026-11-03; recheck API contracts when selecting the SDK and during provider acceptance.

- [Inboxes overview](https://resend.com/docs/dashboard/inboxes/introduction)
- [Retrieve inbox and native summary fields](https://resend.com/docs/api-reference/inboxes/get-inbox)
- [Search threads](https://resend.com/docs/api-reference/inboxes/search-threads)
- [Update thread state](https://resend.com/docs/api-reference/inboxes/update-thread)
- [Reply to thread email](https://resend.com/docs/api-reference/inboxes/reply-thread-email)
- [Contacts](https://resend.com/docs/api-reference/contacts/list-contacts)
- [Domain and inbox setup](https://resend.com/docs/dashboard/inboxes/create-inboxes)
- [Signed webhooks](https://resend.com/docs/webhooks/verify-webhooks-requests)
- [Inbox agent capabilities](https://resend.com/blog/announcing-inboxes)
- [Pricing](https://resend.com/pricing#pay-as-you-go-inboxes)
