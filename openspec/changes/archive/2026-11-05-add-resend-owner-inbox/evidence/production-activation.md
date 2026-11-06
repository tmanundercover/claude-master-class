# Production activation

Date: 2026-11-04. Firebase project: `my-automated-resume`.

The user explicitly authorized application deployment, copying the existing AI and
Resend backend settings into the production environment, and creating the approved
owner Firebase Auth account with its server-assigned `terrell` role. Existing local
credentials were preserved. Production configuration is Git-ignored and private;
no credentials belong in this record.

## Provider setup verified

Live SDK reads confirmed inbox `c5acb401-3fa4-47f3-82d1-54e62210ae5b` belongs to
`terrell.singleton@thehandsomestnerd.com`. Its verified domain is
`32e9157b-9def-4600-b55f-94781edc4284` in `us-east-1`, with sending and receiving
enabled. Set and re-read the approved outgoing display identity `Terrell Singleton`.
Agent autonomous actions remain `[]`.

Created signed webhook `331abd3e-4bcb-4cd7-ac53-a438c5862c5c` for
`https://my-automated-resume.web.app/api/mail/events`, subscribing only to the nine
inbox events accepted by the application. Stored the provider-issued signing value
only in the private project-specific backend environment. Polling remains the
provider-authoritative refresh mechanism.

## Existing DNS observed; no DNS changes

The provider reports verified records:

| Purpose | Name | Type | Value | Priority |
| --- | --- | --- | --- | --- |
| Receiving | apex | MX | `receive.forge.rmta.net` | 0 |
| Sending feedback | `correspondance` | MX | `feedback-smtp.us-east-1.amazonses.com` | 10 |
| Sending SPF | `correspondance` | TXT | `v=spf1 include:amazonses.com ~all` | n/a |
| Sending DKIM | `resend._domainkey` | TXT | Provider public key verified; retained in private operational inspection | n/a |

The system resolver returned the priority-0 Resend record together with Google's
`aspmx.l.google.com` (priority 1), `alt1`/`alt2` (priority 5), and `alt3`/`alt4`
(priority 10). This is an observation of the existing mixed configuration, not a
new direct-cutover or authoritative propagation proof. Provider TTLs are `Auto`;
a complete authoritative TTL snapshot, other-recipient inventory, and verified
rollback procedure have not been supplied. No DNS records were modified.

The user reports successful live email tests through the emulators. This is
user-reported provider evidence; it does not establish a fresh deployed contact
round trip or every operation required by task 9.5. No live test email was sent
by this activation run.

## Local verification

`npm run preflight` passed: 119 unit tests, lint, TypeScript, eight Pages checks,
six Firebase package/privacy checks, four storage SDK/rules emulator checks, and 18 passing
five-emulator HTTP checks (two optional checks skipped). Emulator execution used
its own temporary directory and ports, with synthetic provider settings. It did
not read or rewrite real credential files or use live mail.

Production uses `PORTFOLIO_FIREBASE_*` public web setting names because Functions
reserves the `FIREBASE_` prefix. The older web-key variable remains a read-only
compatibility fallback. All seven supplied Firebase web settings are available
through the public configuration endpoint; supplying the measurement ID does not
enable Analytics. Private workspace storage is explicitly bound to `(default)`
and `my-automated-resume.firebasestorage.app`.

## Deployment verification

The full deployment completed successfully. Hosting released version
`ae5f04098e252090`; `portfolioApp` is ACTIVE in `us-central1`, on Cloud Run revision
`portfolioapp-00002-gip`. Firestore and Storage rules were released with it. The
first deployment required creating the named Functions codebase before Hosting
could resolve its pinned rewrite. Configured a 30-day Artifact Registry cleanup
policy for this project's Functions build images.

Live URL: <https://my-automated-resume.web.app>.

Deployed acceptance passed:

- Public portfolio HTTP 200; auth configuration matches all supplied Firebase
  values, exposes only the seven public web settings, and has no emulator URL.
- Approved owner password sign-in and session-cookie exchange; owner inbox HTTP
  200; live Resend summary returns the configured mailbox and native unread/draft
  counts with private/no-store headers.
- Unauthenticated page redirection and mailbox API HTTP 401. A temporary recruiter
  account received a real production guest session, was denied mailbox APIs with
  HTTP 403 and redirected away from the owner page, then was deleted in cleanup.
- A correctly signed synthetic configured-mailbox event and its replay both
  returned HTTP 200; a tampered body returned HTTP 401. This proves deployed
  signature handling and safe reads, not a newly delivered provider callback.
- Owner-authorized server Firestore access returned HTTP 200. Separate direct
  anonymous and signed-in-owner Firestore/Storage requests were denied, confirming
  client rules independently of Admin SDK authorization.
- Authenticated Chrome rendered the inbox at 375px and 1440px without horizontal
  overflow, page errors, or hydration errors. Logout cleared the session cookie.

The owner account uses the approved Gmail identity and server-assigned `terrell`
claim. Its generated password is recorded only in the ignored private
`.firebase/auth-users.production.json` (mode 600); no email or password-reset
message was sent. Authorized AI/Resend production settings were compared with the
preserved local source without printing credentials. Production environment files
and deployment logs have private permissions.

Task 9.2 and 9.3 acceptance is complete. Tasks 9.1, 9.4, 9.5, and 9.6 remain
unchecked: full recipient/TTL/rollback preparation, an explicitly authorized direct
MX cutover, a complete fresh deployed external-mail acceptance sequence, and
verified post-cutover/rollback evidence have not been established. No DNS changes,
new outbound messages, mailbox-content changes, specification sync, or archive
were performed during this activation.

## Owner acceptance follow-up: 2026-11-05

The owner confirmed that Resend works and that they have tested all the flows.
This records owner-reported live functional acceptance and completes task 9.5;
no additional agent-run mail test was performed. The owner's confirmation does
not specify whether the tests used the deployed site or local emulators with
live Resend, so it is not recorded as independent deployed round-trip evidence.

Tasks 9.1, 9.4, and 9.6 remain open for recipient/TTL/rollback preparation,
receiving-cutover verification, and post-cutover health/rollback records. The
owner's functional acceptance does not supply those operational records. No
DNS change, deployment, or provider mutation was performed for this update.

Fresh read-only provider, authoritative/public DNS, and deployed health checks,
plus the owner's `hello@` requirement and retirement of Google Workspace, are
recorded in [receiving operations verification](receiving-operations.md). That
follow-up supersedes the earlier assumption that Google remains a usable
rollback destination; it does not mark the three operational tasks complete.

The owner subsequently selected receiving-only Resend dashboard access for
`hello@thehandsomestnerd.com`. A read-only receiving metadata check confirmed
16 retained receipts for that address. Recipient preparation (9.1) and acceptance
of the already-working Resend receiving cutover (9.4) are now complete, based on
the separately recorded provider/DNS checks and owner-reported live tests.
Task 9.6 remains open for replacement of the obsolete Google recovery plan.

The owner then approved the Resend-only recovery revision and clarified that
Google will not be reactivated. The design and task 9.6 now require a short note
for restoring the captured working Resend DNS configuration after configuration
errors and following provider incident recovery for service outages. The
[receiving operations record](receiving-operations.md) verifies the documented
restoration target against the captured provider/DNS configuration and states
the limits explicitly. Revised task 9.6 is complete; no DNS change, provider
mutation, deployment, or recovery rehearsal was performed for this revision.
