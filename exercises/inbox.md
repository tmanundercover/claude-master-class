# Lesson 8 — Inbox

## Purpose, current state, and prerequisites

Practice private state, recoverable drafts, and reliable asynchronous actions.
Complete Lessons 2 and 7 and verify owner access. The Inbox, dashboard summary,
mail adapters and composer are supplied implementations. Your task is to inspect,
verify local behavior, and propose one bounded improvement if needed; rebuilding
the whole mailbox is not an exercise requirement.

Read [Owner inbox](../docs/owner-inbox.md) for exact contracts. `/dashboard/inbox`
and every `/api/inbox/**` operation are owner-only. The repository's configured
identity is James Terrell Singleton; use only the demo owner's local emulator
account. Use your own approved identity for student content. Generalizing the
fixed mailbox configuration needs a separate application change. This lesson
never grants access to the maintainer's live mailbox.

## Local fixture prerequisites

Install dependencies and pass [setup](../docs/pre-class.md). Use
`npm run test:mail:browser` for the isolated fixture acceptance walkthrough; the
existing harness makes a temporary Functions package with synthetic configuration
and seeds demo users. For interactive instructor practice, reuse the isolated
fixture harness and its printed Hosting URL, with an instructor-controlled pause;
do not silently run a live mailbox in `npm run dev`.
`RESEND_MODE=fixture` is explicit and emulator-only. The mail fixtures are in-process
and reset on Functions restart. Preserve all existing credentials; never overwrite
`.env.*` to select a fixture. Stop if the UI does not identify fixture mode.

## Explore and refine — assistant chat

Prerequisites and acceptance checks below define this lesson's scope. Copy this
whole block, including the wrapper. Discuss what already works and agree on one
bounded improvement or verification task before proposing. Use the corresponding
installed invocation for other assistants from [Lesson 0](openspec-workflow.md).

```text
$openspec-explore
Explore only Lesson 8 — Inbox in exercises/inbox.md.
The original prompt below is a feature brief: its implementation verbs describe
our desired outcome. Inspect supplied behavior, discuss unknowns and tradeoffs,
and refine the acceptance checks with me. Do not edit implementation files or
create planning artifacts yet. Preserve satisfied behavior and unrelated work.

Inspect docs/owner-inbox.md, src/pages/Inbox.tsx, src/components/MailComposer.tsx,
src/lib/mail-client.ts, src/server/routes/inbox.ts and src/server/mail/.
Keep the supplied owner-only /dashboard/inbox and /api/inbox/** boundaries.
Verify sessions before reads, mutations and attachment downloads; guests get 403,
absent sessions 401. Keep same-origin mutations and private no-store responses.
Use explicit fixture mode under Firebase Auth, Hosting and Functions emulators.
Never infer live mode from a key or access/provision the maintainer's live mailbox.
Inspect supplied dashboard counts, folders, conversations, cursors, filters,
compose, native reply/reply-all/forward, labels, contacts and settings.
Preserve serialized native draft autosave, save/error states and explicit discard.
Reopen saved drafts with recipients, both text/HTML and attachments intact.
Send only after explicit owner action; freeze the snapshot and preserve stable
attempt identity on uncertain sends. Retry unchanged; reconcile before a new send.
Keep failures visible, edits recoverable, and acceptance distinct from delivery.
Validate recipients, content and attachment limits server-side. Downloads must
check the inbox/thread/message/attachment relationship; never accept arbitrary URLs.
Sanitize received HTML into an inert sandbox; block remote images until requested.
Refresh on focus/mutation and while visible; cancel stale reads and honor backoff.
Receiving mail never creates contacts/subscriptions; contact changes are explicit.
Verify supplied controls, then implement only the agreed bounded lesson extension.
Keep provider provisioning, deployed callbacks, DNS and real delivery outside scope.
```

## Propose, review, then Apply

After exploration is satisfactory, send this separate assistant instruction:

```text
$openspec-propose lesson-inbox
Use our agreed Lesson 8 discussion only. Preserve satisfied behavior.
Write planning artifacts; do not implement yet.
```

Review the proposal, design, applicable specs, and tasks. Confirm the named files,
role boundaries, evidence rules, failure cases, and this lesson's observable checks.
Correct the plan before proceeding. Then explicitly send:

```text
$openspec-apply-change lesson-inbox
Implement the reviewed lesson tasks and report actual verification results.
```

## Verify before continuing

Run the lesson checks below and record expected versus actual results. Inspect
supplied behavior instead of removing working features. An unchecked or failed
check keeps this lesson open. Resume the same `lesson-inbox` change after diagnosis;
see [same-change recovery](openspec-workflow.md#same-change-recovery). No automatic
sending, deployment, sync, or archive follows lesson completion.

## Core local practice — ordered observable checks

| Order | Action | Expected result |
|---|---|---|
| 1 | Request `/api/inbox/summary` signed out, then as either guest | 401 then 403; no counts, messages, or files leak |
| 2 | Sign in as demo owner and open the dashboard | Fixture mode, native unread/draft counts and recent threads; refresh errors retain labeled last-known state |
| 3 | Open Inbox, Sent, Archive, Spam, Trash, Drafts | Correct active folder; old folder results disappear during switches; no fabricated empty success on errors |
| 4 | Open a fixture conversation and read messages | Participants, plain text/inert HTML, timestamps, and cursor paging remain in the selected thread |
| 5 | Reply, inspect resolved To, edit text, then explicitly Send | Reply-To recipient is fixed for native reply; local acceptance is shown; no external mail is delivered |
| 6 | Compose to a fixture-only address, add subject/text/HTML | Local edits start autosave; visible Unsaved → Saving → Saved or explicit failure |
| 7 | Wait for Saved, close, then reopen from Drafts | Same native draft, recipients and editable content remain; no new blank draft |
| 8 | Search and combine participant/date/read/label/attachment filters; page forward | Matching cursor page and explicit empty state; a page is never described as the whole mailbox |
| 9 | Use the harness's rejected-send and lost-response scenarios | Failed edits remain; uncertain content freezes; unchanged retry reuses the same attempt and avoids another accepted message |
| 10 | Expire the session during work | Visible denial; preserve/copy editable text, sign in in another tab, then retry; copy failure is visible |

Use the existing failure fixtures from `scripts/test-mail-browser.mjs`; an arbitrary
network outage is not proof that provider acceptance did or did not occur.
Record each actual result. Fixtures prove local state transitions, never external
receipt. Do not create a new compose message to retry an uncertain send. If native
reply acceptance succeeds but draft cleanup fails, report acceptance without a
second Send. Keep the active composer open during recovery.

## Instructor demonstrations and additional practice

| Control | Local action and observable check |
|---|---|
| CC/BCC and reply-all | Add explicit fixture recipients; inspect the full recipient set; no guessed addresses or automatic sends |
| Forward | Select a fixture message, enter recipients, inspect native forward content, explicitly send; recipients are deliberate |
| Labels | Create/edit a local label and assign it to a thread; selection/filter survives authoritative refresh |
| Contacts | Add/edit/delete a fixture contact; account scope is disclosed, new contact is unsubscribed; receiving/deleting mail never changes contacts |
| Attachments | Save/reopen an allowed small file; private download works only for the owner and matching resource relationship; invalid/oversized uploads fail visibly |
| Safe HTML | Open a fixture with active markup; scripts/forms/embeds stay inert, plain text remains readable; remote images load only after explicit opt-in |
| Refresh | Change folders rapidly, focus/blur the tab and wait for refresh; obsolete requests cancel, hidden polling stops, 429 honors Retry-After |
| Settings | Explicitly save supported display/agent settings; autonomous actions are not enabled implicitly; partial errors require refresh |

Limits to inspect in server validation: 10 files / 10 MiB decoded total, 50 combined
recipients, 512 KiB text+HTML, 15 MiB JSON envelope. Never supply paths, remote URLs,
arbitrary From identities, or inbox selectors. Private downloads authenticate before
reading and use bounded, verified relationships. Instructor demonstrations count
only when their outcomes are observed and recorded.

Previous: [Lesson 7 — Interview room](04-star-interview-responses.md) · Next: [Lesson 9 — Contact form and resume email templates](contact-and-email-templates.md).
