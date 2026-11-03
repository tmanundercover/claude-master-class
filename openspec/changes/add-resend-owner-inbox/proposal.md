# Proposal

## Why

The portfolio contact form currently cannot deliver messages, and the owner workspace has no way to manage correspondence. Resend Inboxes provides the mail storage, conversations, drafts, labels, and search needed to turn that workspace into a useful email client.

## What Changes

- Add a full-width inbox entry card to Terrell's dashboard showing provider-backed unread threads, unsent drafts, last received time, and recent conversations.
- Remove the dashboard's `Exercise 1–4` badges and exercise-oriented link text while preserving access to the existing career tools, résumé evidence, and interview library.
- Add an owner-only `/dashboard/inbox` workspace for `terrell.singleton@thehandsomestnerd.com`: compose/send, receive, threaded reading, reply/reply-all, forwarding, CC/BCC, attachments, persistent drafts, folders, read/unread state, labels, search/filtering, and a contacts list with recipient suggestions.
- Include inbox settings and the provider's supported agent settings, with autonomous actions disabled by default. The planned default is human-initiated sending.
- Deliver the public contact form through the backend using Resend, directing submissions to the owner inbox and preserving the visitor's reply address.
- Use Resend as the authoritative mail store; retain Firebase Auth and the existing Hosting/Functions deployment. Keep all provider credentials in ordinary Functions environment variables.
- Support local acceptance through Auth, Hosting, and Functions emulators with an in-process mail fixture adapter. Live provider operations and DNS changes remain separate operational tasks.
- **BREAKING (mail routing):** plan a direct receiving-MX cutover for `thehandsomestnerd.com` from its current Google routing to Resend. The chosen direction is confirmed; capture actual DNS records, other active recipients, provider verification, rollback, and explicit operational authorization before executing the cutover.

## Capabilities

### New Capabilities

- `owner-inbox`: Owner dashboard entry, private mail workspace, Resend-backed mail operations, contacts, settings, and private-state handling.
- `contact-email`: Public contact-form delivery into the configured inbox, validation, delivery feedback, duplicate prevention, and reply continuity.

### Modified Capabilities

None. This project has no existing canonical capability specs.

## Impact

- Frontend: `src/pages/Dashboard.tsx`, `src/components/ContactForm.tsx`, `src/App.tsx`, `src/app-types.ts`, styles, and new inbox components/pages.
- Backend: `src/entry-server.tsx`, new server mail routes/provider adapter, existing authorization/origin helpers, and the Functions raw-body adapter for signed webhooks.
- Packaging: a pinned Resend server SDK and compatible HTML-email sanitization support; declare runtime dependencies in the self-contained Functions package as well as the application build where needed.
- Static export: keep the public portfolio available on GitHub Pages and explicitly exclude inbox data and private pages from static artifacts.
- Verification: expand API, artifact/privacy, emulator, and browser checks; distinguish fixture evidence from live email and DNS evidence.
- Operations: verify domain sending/receiving, provision the inbox, configure backend environment values and signed webhooks, then perform and verify the authorized MX cutover. Existing Google mail history is preserved; importing it is outside this change.
