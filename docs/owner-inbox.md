# Owner inbox

The dynamic Firebase application provides `/dashboard/inbox` to Firebase sessions with `portfolioRole=terrell`. Existing login identities and four-hour sessions are unchanged. Resend owns persistent messages, conversations, drafts, labels, search, and counts. Account contacts remain distinct from inbox correspondence.

## Backend configuration

Use ordinary Functions environment variables; see `functions/.env.example`. Never use a `VITE_` prefix for credentials. Existing `.env.local` files are preserved. There is no Secret Manager binding.

- `RESEND_MODE`: explicitly `fixture` or `live`. Unset mode fails visibly. Fixture mode requires `FUNCTIONS_EMULATOR=true` and a `demo-` project; it cannot run in production.
- `RESEND_API_KEY`: existing private provider key. Inboxes reads/settings and Contacts need appropriate full-access permission; sending-only keys are insufficient.
- `RESEND_INBOX_ID`: provisioned owner inbox identifier. Browser input cannot select it.
- `RESEND_INBOX_EMAIL`: must equal `terrell.singleton@thehandsomestnerd.com`.
- `RESEND_FROM_NAME`: proposed `Terrell Singleton`; confirm for live activation.
- `CONTACT_FROM_EMAIL`: proposed `website@thehandsomestnerd.com`; verify against the sending domain before activation.
- `RESEND_WEBHOOK_SECRET`: signing secret for `POST /api/mail/events`.

`npm run dev` uses Auth, Hosting, Functions, Firestore, and Cloud Storage emulators. To use mail fixtures, set `RESEND_MODE=fixture` in the backend local file, retaining its other values. `npm run preflight` uses an isolated temporary Functions package with synthetic settings; existing credential files are neither read nor rewritten. Fixtures are in process, deterministic on startup, and reset with the Functions process. Fixture startup selects Firebase’s `--inspect-functions` serialized single-process mode so concurrent browser requests share one fixture mailbox. Acceptance uses a free inspector port; local development defaults to 9229 (override with `FUNCTIONS_DEBUG_PORT`). This mode is local-only and does not simulate production parallelism. They send no real mail. Live mode is never inferred from an API key.

The pinned SDK is Resend 6.37.0 in both package manifests. Exact SDK selectors, search serialization, native reply/forward, draft idempotency, and contact Reply-To are covered with intercepted SDK contract tests. Live delivery, provider permissions, storage URLs, and real threading still require operational proof.

## Using mail

Open the full-width Inbox card from the dashboard. Counts are native `unread`/`drafts`/`last_received` values, with a bounded recent conversation page. A failed refresh retains labeled last-known values; missing configuration is an error, never a fabricated zero. Folder views include Inbox, Sent, Archive, Spam, Trash, and Drafts. Lists and messages expose provider cursor pages; a page is not the complete result set. Search combines text, participant, date, label, attachment, and read-state filters.

Compose starts locally without creating an empty provider draft. An untouched composer closes immediately; autosave begins after edits and waits 900 ms before serializing writes. Drafts may start with just a recipient, subject, body, or attachment. Empty optional fields are omitted on creation and explicitly cleared on update. Enter comma-separated plain email addresses; recipient suggestions come from the current contacts page. Choose other contacts pages to load more suggestions. CC/BCC remain editable. The rich-content field accepts HTML alongside a plain-text alternative. Saving exposes Unsaved, Saving, Saved, and failed states. Reopen drafts from Drafts. A reopened draft preserves server attachments unless you explicitly replace/remove them. Discard explicitly deletes the draft.

Preview template browses reusable content without changing the draft. If the message has no HTML copy yet, Edit HTML copies the selected template's subject, plain text, and HTML into the current email, retaining recipients and attachments. HTML edits affect that draft only and survive preview/source switches, autosave, and reopening. Existing or intentionally cleared HTML is preserved when editing again. Use template explicitly replaces the current copy with the reusable original. Keep the plain-text alternative up to date when adding information to the HTML version.

Send is an explicit action. The UI freezes content during a send, retains one attempt key after an uncertain response, and offers an unchanged retry. The live adapter uses provider idempotency keys, reads native draft `email_id` to reconcile completed sends, and includes a draft-snapshot digest in the send request. Failed validation permits editing and a new attempt. Do not create a new message to retry an uncertain send; reconcile the existing attempt first. Resend's idempotency window is 24 hours; beyond it inspect provider state before initiating any new send. Process caches are bounded optimizations, not durable duplicate prevention. Keep the active page open; mail is never saved to browser persistent storage. On session expiry, copy editable content and sign in in another tab, then retry. Copy reports failures. Closing an unsaved or uncertain composer is disabled; navigation warns when unsaved work exists.

Reply and Reply all use the native message relationship and provider-resolved Reply-To recipients. The To field shows that resolution and is fixed for these native actions; CC/BCC and content remain editable. Forward uses explicitly selected recipients and the native forwarding API. Reply editors autosave native reply drafts. After native reply acceptance, a leftover draft is discarded; cleanup failure reports acceptance and offers no second send. A reopened reply draft can also be sent through the native draft API.

Upload limits: 10 files, 10 MiB total decoded attachments, 512 KiB combined text/HTML content, 50 total recipients, 15 MiB JSON envelope including base64 overhead. PDF, TXT, CSV, PNG, JPEG, GIF, and ZIP are permitted by the application; Resend may reject additional file types/content and enforces its 25 MB provider cap (including original files on a forward). Empty files, executable/HTML uploads, paths, and arbitrary URLs are rejected. Private downloads check the configured thread/message/attachment relationship, accept only the documented `inbound-cdn.resend.com` or `outbound-cdn.resend.com` HTTPS storage hosts, reject redirects, and bound streaming to 10 MiB. Downloads use attachment disposition, octet-stream, `nosniff`, and a sandbox CSP. Unexpected provider storage hosts fail visibly pending review.

HTML mail is sanitized on the server using sanitize-html and rendered in a script-free, opaque-origin iframe with restrictive CSP. Scripts, forms, inline event handlers, active embeds, and remote images are stripped. The owner can explicitly load remote images. Plain text remains available. External links use safe protocols and `noopener noreferrer`.

Contacts belong to the entire Resend account. Add/edit/delete is explicit; new contacts are created unsubscribed. Existing contact email changes are unsupported by the provider and are disclosed; add a separate contact deliberately. Receiving mail and deleting threads never create/delete contacts or modify subscriptions. Inbox display/from-name and supported agent instructions, preset tones, and actions require explicit saves. New fixtures and operational provisioning start with `actions: []`; the application does not enable them implicitly. Existing provider settings are displayed accurately. Partial settings failures ask the owner to refresh provider state.

Views refresh on focus, after mutations, and every 15 seconds while visible. Hidden tabs abort pending reads and stop polling. Folder, filter, and cursor changes hide the previous resource's results immediately and cancel obsolete requests. Refreshing the same resource retains its current results. Loading appears in the active sidebar folder icon without adding a visible notice above the list; assistive status text remains available, and reduced-motion preferences disable the spinner animation. Provider backoff is scoped to the requested resource, lasts at least 15 seconds, and honors longer Retry-After delays. Signed callbacks perform a safe authoritative read only; replay has no send/contact side effects. They do not guarantee cross-instance browser push; polling remains authoritative.

Open the avatar menu in the upper-right corner for Mail, Contacts, Settings, Labels, Workspace, and Sign out. Escape closes the menu and returns focus to the avatar; clicking outside also dismisses it.

## API contract

Every `/api/inbox/**` route authenticates first, including unsupported routes/methods and downloads. Mutations validate same-origin requests. Private responses set `Cache-Control: private, no-store`, `Vary: Cookie`, and `X-Content-Type-Options: nosniff`. Resource IDs are opaque `[A-Za-z0-9_-]` strings up to 160 characters; use IDs returned by the provider, not email subjects or external URLs. All inbox selectors and outgoing identities are server-bound. Resource relationships are checked by the provider's configured inbox paths. The browser has no arbitrary-provider proxy.

| Route under `/api/inbox/` | Method | Input / response |
| --- | --- | --- |
| `summary` | GET | Native counts, email address, recent threads, explicit mode |
| `threads` | GET | `folder,query,from,to,startDate,endDate,hasAttachment,read,label,after`; returns `{data,has_more}` |
| `threads/:thread` | GET / PATCH | Summary; PATCH `{read?,folder?}` with move folders inbox/archive/spam/trash |
| `threads/:thread/labels` | PUT | `{labels: string[]}` replaces labels (max 10) |
| `threads/:thread/messages` | GET | Optional `after`; returns message page |
| `threads/:thread/messages/:email` | GET | Optional `remoteImages=true`; sanitized `document`, raw HTML null |
| `threads/:thread/messages/:email/attachments/:attachment` | GET | Private bounded file download; no URL parameter |
| `threads/:thread/messages/:email/reply`, `reply-all`, `forward` | POST | `{content,attempt}`; native explicit response, `{id}` acceptance |
| `drafts` | GET / POST | Page with optional `after`; POST `{content,attempt}` returns `{id}` |
| `drafts/:draft` | GET / PATCH / DELETE | Native draft; PATCH `{content,attempt}`; explicit discard |
| `drafts/:draft/send` | POST | `{attempt}`; returns accepted email `{id}` or uncertain/conflict |
| `labels` | GET / POST | Page; POST `{name,color}` (#RRGGBB) |
| `labels/:label` | PATCH / DELETE | `{name,color}` or explicit removal |
| `contacts` | GET / POST | Account contact page with optional `after`; `{email,firstName,lastName}` |
| `contacts/:contact` | PATCH / DELETE | Names and unchanged email; explicit account-scope deletion |
| `settings` | GET / PUT | `{name,fromName,agent:{object,instructions,tone,actions}}` |

Composition is `{to:string[],cc:string[],bcc:string[],subject:string,text:string,html:string,attachments?:{filename,contentType,content:base64}[],threadId?,replyToEmailId?}`. Both relationship fields are required together. Omitted attachments on update preserve the saved set; `[]` removes them. Attempt IDs must be stable, opaque, at least 16 characters. Retry the exact immutable payload with the same ID; editing creates a different attempt. Unsupported fields are rejected. Never supply `from`, inbox selectors, headers, attachment paths, or remote URLs.

Errors are `{error,code}`: validation 400/413/415, unauthenticated 401, guest/origin 403, missing resource 404, unsupported method 405, conflict 409, provider validation/unsupported 422, rate limit 429 with `Retry-After`, configuration/unavailable/uncertain 503. Reads retry at most twice with bounded delay and 10-second attempt timeout. Writes are never automatically replayed; the owner retries using provider idempotency. Responses/logs omit credentials and private provider error payloads.

### Public contact

`POST /api/contact` accepts exactly `{name,email,message,website:'',attempt}` without login. Limits: name 100 characters, email 254, message 8,000, UTF-8 request 12 KiB. Invalid routing/header fields, control characters, bad addresses, nonempty honeypot, oversize bodies, and cross-origin requests fail before provider invocation. A bounded approximate per-instance limiter permits five valid attempts per ten minutes per observed client IP, maximum 5,000 active keys; the deployed max of three Functions instances means this is not a shared global quota. Forwarded addresses depend on the trusted Firebase proxy and are not a substitute for durable abuse enforcement. Retried requests consume limiter budget but preserve the provider attempt ID. Add shared enforcement only if actual abuse warrants it.

Delivery uses the fixed verified contact sender and owner recipient, with the visitor as validated Reply-To and plain-text encoded content. No acknowledgement, marketing contact, or subscription is created. `202 {status:'accepted',localTest:boolean}` means acceptance for delivery, not confirmed receipt. Resend may group the outbound website notification and its inbound SMTP copy into one native conversation, initially in Sent or Spam. After acceptance, the server checks bounded recent thread/message pages for up to seven seconds, matches the exact accepted send ID plus SMTP Message-ID, sender, recipient, subject, and visitor Reply-To, then files that received contact conversation in Inbox as unread. It waits for the received copy before moving the thread so a later inbound Spam classification cannot undo an early move. The transactional sending history retains the outgoing notification. Resend assigns folders to conversations, so the same conversation need not also appear in the mailbox's Sent folder. Existing Inbox read state and owner Archive/Trash choices are preserved on retries. Missing or failed filing returns an explicit uncertain result while retaining the same provider send key; unchanged retries reconcile rather than send another notification. Replies and native reply drafts selected from the website's outbound copy bind to its matching received message, because Resend replies to an outbound message's To recipients. Ordinary sent mail keeps the provider's native recipient semantics. Fixture ingress models both SMTP copies in one local conversation. Unknown/lost responses retain form contents and the same unchanged attempt. Editing starts a new attempt. Form submission uses POST JSON, never URL query strings. The public-only Pages build disables sending and explains backend unavailability.

### Signed events

Configure `POST /api/mail/events` in Resend. Original raw request bytes are preserved by the Functions adapter; a bounded 256 KiB body goes to `resend.webhooks.verify` with the Svix ID/timestamp/signature and private secret. Allowlisted types: `inbox.email.received`, `inbox.email.sent`, `inbox.thread.created`, `inbox.thread.folder.updated`, `inbox.thread.labels.updated`, and draft created/updated/sent/deleted. `data.inbox_id` must equal the configured inbox ID. Invalid signatures, unsupported types, and foreign inboxes fail. Replay performs only safe reads and never sends, writes contacts, or advances cached counts.

## Live activation gates

Local acceptance does not authorize or prove deployment, provisioning, external sending, or DNS changes. Before activation, record the intended Firebase project and Resend account, permission scope and domain verification, actual inbox ID, verified contact sender, all other active domain recipients/aliases and their disposition, exact account/region DNS records, existing MX and TTLs, and rollback instructions. Provision the owner inbox with autonomous actions explicitly disabled and verify sending prerequisites first. Do not infer account readiness from a credential's presence.

Deploy only after review and explicit authorization. Verify deployed owner/guest/revoked access and signed callbacks. Receiving-MX cutover is a separate explicitly authorized step after recipient readiness and fresh rollback capture. Preserve Google history; no import is included. Use exact account records, verify authoritative/public propagation, incoming mail, and a real contact submission → owner reply → visitor follow-up in one conversation. Test provider-backed drafts, search, labels, contacts, attachments, and actual external delivery. If receiving fails, restore the captured MX/TTLs and prove routing recovery. Leave every unproven operational task unchecked.

Provider references: [official Node SDK](https://github.com/resend/resend-node), [incoming attachment contract](https://resend.com/docs/api-reference/emails/retrieve-received-email-attachment), [outgoing attachment contract](https://resend.com/docs/api-reference/emails/retrieve-email-attachment).


## Compact mail UI and résumé template

The owner inbox uses the portfolio palette with a compact folder sidebar, searchable conversation rows, per-page selection and bulk read/archive/trash actions, and a full-width conversation pane. Copy icons beside sender/recipient addresses, subjects, and contacts report clipboard success or failure. Contacts, labels, settings, autosave, and uncertain-send recovery retain their existing provider behavior.

Compose opens a docked editor, with an expand control. Inside **HTML & templates**, choose **Send my résumé**, preview it, and click **Use template** to replace the subject, plain text, and HTML. Browsing does not change a draft. Applying a template preserves recipients and attachments. Both versions remain editable and autosave as an ordinary native draft. Sending still requires the Send message button.

The résumé is a white document with restrained portfolio colors, a skills column with the site's icons, existing public experience summaries, education, and full active contact URLs. Only each username is emphasized; the remaining URL text is muted. It uses the existing public profile projection, with no private project evidence and no implied PDF attachment. Icons are rasterized from the site's existing icon components with `node scripts/build-mail-icons.mjs`; Firebase packaging copies only those PNGs to `/email-icons/`. Draft HTML uses absolute portfolio URLs. Local previews use the bundled PNGs, so previewing needs no external image loads. External recipients can load the icon URLs after the new assets are deployed to the portfolio domain; text and links work independently of image loading.

The shared résumé renderer also powers the independent owner-only **Resume Tailor**. Its standalone preview, self-contained HTML download, and plain-text copy use selected, rewritten content without changing this template or its draft customization. It saves a matching private PDF in its job workspace. Adding it to a native mail draft requires explicit application preparation; it sends nothing automatically. See [Resume Tailor](resume-tailor.md).

The template preview iframe has an empty sandbox, no referrer, and a restrictive CSP. Scripts, forms, and external image requests stay blocked, including in manually edited HTML. Received-message rendering retains its separate sanitized HTML and explicit remote-image controls.

The public contact form spaces controls and focus outlines independently. Confirmation names James Terrell Singleton and explains the email notification; fixture mode only confirms the local record. Errors retain entered text and the original unchanged retry key while using plain visitor-facing language rather than provider diagnostics.

## Job application documents

The existing résumé HTML template remains available. The separate **Job application template** takes one template-specific selection: a saved job workspace. Preview keeps the composer unchanged; Use job application template prepares editable opportunity-specific copy with server-resolved ready Current PDFs. It does not infer recipients or send messages. Unknown company/role labels expose a correction link. Missing cover letters are visible and optional; pending/failed PDFs require retry or explicit omission.

A missing tailored résumé requires **Use standard résumé** (the exact current public `resume.pdf` bytes) or **Create tailored résumé**. Tailoring seeds useful copy for a blank composer, saves the native draft and owner-bound workspace return reference, then opens that same job. Save/linkage failure keeps the composer open. **Return to application email** reloads the same native draft; **Refresh documents** adds the newly ready résumé while retaining recipients, edited copy and manual files.

Application drafts pin managed PDF identities and independent attachment snapshots. Revise, Start over, undo and two-version retirement never mutate saved or sent attachments. Refresh replaces managed documents only; reapplying the template explicitly replaces message copy. Private recovery copies preserve managed/manual bytes across reload because the current provider API does not offer draft attachment downloads. Missing recovery bytes require explicit reattachment before replacement. Partial saves are disclosed; retry the unchanged preparation to reconcile. The existing serialized saves, attachment limits, frozen uncertain-send retries and explicit **Send message** remain authoritative. See [Job workspaces](job-workspaces.md) for routes, storage setup and local/live acceptance boundaries.
