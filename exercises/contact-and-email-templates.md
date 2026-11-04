# Lesson 9 — Contact form and resume email templates

## Purpose, current state, and prerequisites

Connect a public submission to private owner follow-up, then reuse approved
content without taking sending away from the owner. Complete [Lesson 8](inbox.md)
and its fixture checks first. The contact form and **Send my résumé** HTML template
are supplied; inspect and verify them before agreeing on a bounded improvement.
Use the same isolated fixture harness (`npm run test:mail:browser`) and demo owner.
No live mail, receiving DNS, or maintainer mailbox access is required or authorized.

See [Owner inbox contracts](../docs/owner-inbox.md). The separately evolving **Job
application template** and workspace PDFs are described in
[job-workspaces.md](../docs/job-workspaces.md); they are not the template practiced
here and their pending feature/operational checks remain separate.

## Explore and refine — assistant chat

Prerequisites and acceptance checks below define this lesson's scope. Copy this
whole block, including the wrapper. Discuss what already works and agree on one
bounded improvement or verification task before proposing. Use the corresponding
installed invocation for other assistants from [Lesson 0](openspec-workflow.md).

```text
$openspec-explore
Explore only Lesson 9 — Contact form and resume email templates in exercises/contact-and-email-templates.md.
The original prompt below is a feature brief: its implementation verbs describe
our desired outcome. Inspect supplied behavior, discuss unknowns and tradeoffs,
and refine the acceptance checks with me. Do not edit implementation files or
create planning artifacts yet. Preserve satisfied behavior and unrelated work.

Inspect src/components/ContactForm.tsx, src/server/routes/contact.ts,
src/server/mail/contact-delivery.ts, src/lib/mail-templates.ts,
src/lib/resume-document.ts and src/components/MailComposer.tsx.
Keep the public contact form separate from owner-only mail reads and replies.
POST /api/contact accepts exactly name, email, message, website:'', and attempt.
Validate size, addresses, control characters, honeypot, origin and allowed fields
before calling the provider; bind sender/recipient routing on the server.
Retain failed form values and the same unchanged attempt after an uncertain result.
Create the fixture contact conversation and resolve native reply to the validated
visitor Reply-To; reconcile retries without a duplicate notification.
Explain 202 acceptance and localTest honestly; never claim confirmed delivery.
Do not create marketing contacts or subscriptions from a contact submission.
In HTML & templates, preview Send my résumé without mutating the draft.
Use template explicitly replaces subject, text and HTML while retaining recipients
and attachments. Keep both formats editable and autosaved; reopen the same draft.
Use only approved public profile content and the existing safe resume renderer.
The HTML résumé template does not automatically use a tailored résumé or attach
PDFs. Distinguish the separate job application template and pending workspace work.
Preserve inert preview/received HTML, remote-image controls and private attachments.
Send message remains an explicit owner action with stable uncertain-send recovery.
Use isolated mail/model fixtures with the configured Firebase Auth, Hosting, Functions, Firestore, and Cloud Storage emulators.
Do not provision mail, change DNS, publish, or send real external mail for this lesson.
Implement only the agreed bounded extension after proposal review.
```

## Propose, review, then Apply

After exploration is satisfactory, send this separate assistant instruction:

```text
$openspec-propose lesson-contact-templates
Use our agreed Lesson 9 discussion only. Preserve satisfied behavior.
Write planning artifacts; do not implement yet.
```

Review the proposal, design, applicable specs, and tasks. Confirm the named files,
role boundaries, evidence rules, failure cases, and this lesson's observable checks.
Correct the plan before proceeding. Then explicitly send:

```text
$openspec-apply-change lesson-contact-templates
Implement the reviewed lesson tasks and report actual verification results.
```

## Verify before continuing

Run the lesson checks below and record expected versus actual results. Inspect
supplied behavior instead of removing working features. An unchecked or failed
check keeps this lesson open. Resume the same `lesson-contact-templates` change after diagnosis;
see [same-change recovery](openspec-workflow.md#same-change-recovery). No automatic
sending, deployment, sync, or archive follows lesson completion.

## Public-to-private practice

| Step | Action | Expected result |
|---|---|---|
| 1 | As a signed-out visitor, submit valid fixture contact details | Form POSTs JSON to `/api/contact`; local confirmation describes fixture acceptance |
| 2 | Open the demo owner's Inbox and read that contact conversation | Fixture ingress creates an unread conversation with the supplied visitor content; no public read route |
| 3 | Click Reply and inspect To, then deliberately send a fixture response | Native reply resolves to the validated visitor Reply-To; the server's fixed notification sender is not mistaken for the visitor |
| 4 | Run invalid-address, control-character, honeypot, oversized, extra routing/header-field, and cross-origin checks | Request fails before provider invocation; entered form values remain available where submitted in the UI |
| 5 | Exercise rejected/uncertain submission and unchanged retry | Same attempt and form contents are retained; reconciliation produces one notification/conversation rather than duplicate mail |
| 6 | Inspect the public-only Pages form | Sending is disabled with an explanation that Firebase backend support is required |

Contract: name ≤100 characters, email ≤254, message ≤8,000, UTF-8 body ≤12 KiB,
`website` empty, stable `attempt`. Browser-provided sender, recipient, headers, or
inbox selectors are rejected. Editing after failure starts a new attempt; retrying
unchanged uncertain content preserves the original one. `202 {status:'accepted',
localTest:true}` proves local fixture acceptance. Even live acceptance is not
confirmed delivery. Contact submission creates no acknowledgement, contact-list
entry, or subscription. Test the five-valid-attempts/ten-minute local limiter in
the harness without treating a per-instance limiter as a global quota.

## Send my résumé template practice

1. Compose an email addressed only to an explicit fixture recipient. Add a small
   allowed manual attachment and editable text; wait for Saved.
2. Open **HTML & templates**, select **Send my résumé**, and preview it. Observe
   that browsing leaves the current subject/text/HTML, recipients, and files intact.
3. Click **Use template**. Subject, text, and HTML change to the approved public
   profile version; recipients and attachments remain. No tailored résumé is
   substituted and no PDF is created/attached by this action.
4. Edit both HTML and plain text, then switch between source and preview. If HTML
   was initially absent, Edit HTML seeds the selected template copy; subsequent
   editing preserves your existing or intentionally cleared HTML. Scripts/forms
   and external image requests remain blocked in the preview.
5. Wait for Saved, close, and reopen the same draft. Confirm both edited versions,
   recipients, and the manual attachment remain. Changes affect this draft only.
6. Inspect complete contact URLs, relevant public experience, and the text
   alternative. Local preview icons use bundled assets. External recipient images
   require deployed absolute portfolio URLs; text remains usable independently.
7. Review recipients, subject, both bodies, and files. Click **Send message** only
   for the fixture run. Observe local acceptance; inspect failure/uncertain retry
   behavior from Lesson 8 without claiming external delivery.

## Completion checks

- Public validation and same-origin/routing rejection occur before provider calls.
- Owner can find and reply to the fixture contact; guests cannot read it or files.
- Failed/uncertain input remains recoverable; unchanged retry preserves identity.
- Preview and explicit apply have distinct observable behavior.
- Customized HTML/text, recipients, and attachments survive autosave/reopening.
- The public-profile template contains no private evidence or job-search notes.
- No template selection sends mail; explicit fixture send records local acceptance.
- Real provider receipt, webhooks, receiving DNS and publication remain separate
  authorization and evidence gates.

Previous: [Lesson 8 — Inbox](inbox.md) · Next: [Lesson 10 — Verification and deployment](verification-and-deployment.md).
