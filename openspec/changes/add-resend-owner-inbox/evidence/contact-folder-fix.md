# Contact notification Inbox placement and reply correction

Date: 2026-11-03.

The user confirmed a live compose/external-reply round trip, then reported that a public contact notification appeared in Sent. Read-only Resend inspection found the exact contact conversation contained both an outbound website notification and an actual inbound SMTP copy with matching SMTP Message-ID, subject, sender/owner bindings, and visitor Reply-To. The provider's current conversation folder was Spam; the transactional notification's delivery status was delivered. The initial fixture incorrectly represented contact delivery as one direct inbound message from the visitor, so it could not expose that lifecycle.

Changes:

- Preserve the existing send payload and provider idempotency key. After acceptance, use bounded native recent thread/message pages with a seven-second operation budget to locate the exact accepted send and its correlated inbound copy. Only then move that contact thread from Sent/Spam to Inbox as unread. Unrelated same-subject messages and mismatched SMTP identities cannot select a thread.
- Return an explicit uncertain result if native receipt/filing is pending or fails. Retrying unchanged reuses the accepted send key and reconciles placement instead of sending another notification. Already-filed Inbox read state and Archive/Trash choices are preserved on retries.
- Resolve a native reply or reply draft selected from the website's outbound copy to the matching received message. Resend documents that replying to an outbound message targets its To recipients; selecting the received copy preserves the visitor's Reply-To and prevents a self-addressed reply.
- Make fixtures retain both SMTP copies in one native conversation, and show the sender on outbound message details. Native folders remain conversation-level; transactional sending history retains the sent notification.
- Parse actual JavaScript import/export declarations in the Functions dependency check. Its former regex mistook the email subject's `from` text for an import.

Verification:

- `npm run preflight`: passed, 68 unit tests, lint, TypeScript, 6 Pages checks, 4 Functions package/privacy checks, and 14 Auth/Hosting/Functions HTTP tests.
- Focused mail tests cover delayed receipt, Sent-to-Spam arrival, exact send/SMTP correlation, bounded pagination, unrelated-mail rejection, lost folder-write responses, repeated send-key reuse, preserving Inbox read state and Archive/Trash choices, paired reply/reply-draft mapping, and fixture/public route parity.
- `npm run test:mail:browser`: passed at 375px and 1440px with the paired-message fixture. The browser's first contact Reply action selects the displayed outbound copy, exercising the corrected reply binding. See [browser record](contact-folder-browser-results.json).
- An additional final lint/typecheck passed after the outbound sender display change.
- Both local environment files retained their exact pre-fix SHA-256 fingerprints. Existing credentials/live configuration were restored after isolated fixture runs.
- `openspec validate add-resend-owner-inbox --strict --json` passed; no specification sync/archive or deployment was performed.

Live repair: reconciled only the reported contact conversation. The provider then confirmed folder Inbox, unread state, and retention of both outbound and inbound copies. No new email was sent, no message body changed, and no contacts, agent settings, DNS, or deployment configuration were modified by the repair. A fresh public contact submission and external reply/follow-up still require the user's live round-trip check; this repair is not proof of a new send or external reply delivery. The six broader operational tasks remain unchecked.

Provider contract: [Reply to Thread Email](https://resend.com/docs/api-reference/inboxes/reply-thread-email), [Update Thread](https://resend.com/docs/api-reference/inboxes/update-thread).
