# Live Resend connection through local emulators

Date: 2026-11-03. This follow-up supplements the earlier fixture-only acceptance record.

The user supplied Resend dashboard screenshots showing verified domain sending/receiving and the created owner inbox. Read-only official SDK calls using the existing backend key then confirmed:

- Owner inbox `terrell.singleton@thehandsomestnerd.com` exists with ID `c5acb401-3fa4-47f3-82d1-54e62210ae5b`.
- Inbox reads and agent-settings reads are permitted by the configured key.
- Agent autonomous actions are `[]`.
- Domain `thehandsomestnerd.com` is verified. DKIM, sending MX/SPF at `correspondance`, and receiving MX are all provider-verified.
- The provider inbox `from_name` is currently unset. Its display name can be set by an explicit owner save in Inbox Settings; this run did not change provider settings.

Configured only the ignored `functions/.env.local` file with explicit live mode, the confirmed inbox binding, proposed contact sender `website@thehandsomestnerd.com`, and local contact display name `Terrell Singleton`. Existing API keys and every other pre-existing environment value were preserved. The root `.env.local` remained unchanged. No webhook secret was created; polling supports this local test.

Started only the Auth, Hosting, and Functions emulators with `npm run dev`, using the demo project `demo-portfolio-local`. Auth uses locally seeded accounts. An authenticated owner request through Hosting/Functions returned:

- `/api/inbox/summary`: HTTP 200, mode `live`, exact owner mailbox binding, provider unread `0`, provider drafts `0`, `Cache-Control: private, no-store`.
- `/dashboard/inbox`: HTTP 200.

Local test URL: `http://127.0.0.1:5500/dashboard/inbox`. Local login credentials are in `.firebase/auth-users.local.json`; no passwords or session tokens are included here.

No mail was sent, provider record written, contact created, webhook configured, application deployed, or DNS changed by the agent in this follow-up. Actual external send/receive/reply continuity, account contact-write permissions, other-recipient readiness, fresh authoritative DNS/rollback records, and deployed Firebase evidence remain unproven. The six operational tasks remain unchecked because their full completion criteria have not yet been met.

Subsequent live contact-folder diagnosis and correction are recorded in [Contact folder fix](contact-folder-fix.md). Its live repair updates the reported conversation folder only; the no-write statements above describe the earlier readiness check.
