# Folder loading and account menu

Verified locally on 2026-11-03 using Firebase Auth, Hosting, and Functions emulators with fixture mail.

## Behavior

- Inbox, Sent, Drafts, Archive, Spam, and Trash use the active sidebar icon as the loader. Loading announcements remain available to assistive technology without inserting visible text into the layout. Reduced-motion CSS disables rotation.
- Folder/filter/cursor data is bound to its request path during rendering, before effects run. A new resource cannot render the previous resource's rows or errors. Refreshing the same resource preserves its current rows. Aborted responses are ignored, and error backoff applies to the failed resource. Drafts load when their view is active.
- The avatar disclosure contains Mail, Contacts, Settings, Labels, summary refresh, Workspace, and Sign out. Escape dismisses it and restores avatar focus; outside clicks dismiss it too.
- The HTML reader remains mounted while an explicitly requested remote-image version loads; new resources elsewhere still clear immediately.

## Verification

- `npm test`: 70/70 passed.
- `npm run lint`, `npm run typecheck`, and `npm run build:firebase`: passed.
- Emulator Chrome acceptance passed at 375px and 1440px. Each folder request was deliberately stalled: only its active icon loaded, other folders' icons stayed unchanged, previous-folder rows and premature empty states stayed hidden, and the list heading did not shift. A DOM mutation record found no wrong-folder rows under a new heading. Same-folder refresh retained its rows.
- Avatar-menu controls, Escape/outside dismissal, actual owner Sign out and guest login/denial passed. The existing compose/draft/reply/forward, attachment, contact, label, settings, HTML/remote-image, retry, polling, and stale-response checks also passed with no horizontal overflow or captured page/hydration errors.
- `git diff --check`: passed.

Browser results: [folder-loading-browser-results.json](folder-loading-browser-results.json). Local logs: `/tmp/mail-folder-unit.log`, `/tmp/mail-folder-build.log`, and `/tmp/mail-folder-browser.log`. Avatar screenshots: `/tmp/owner-inbox-browser-evidence/account-menu-375.png` and `account-menu-1440.png`.

The first browser run caught an HTML-reader remount regression during remote-image loading; the reader was corrected and the entire browser suite passed on rerun. No external email, provider configuration, deployment, or DNS changes were made. Existing environment files were restored by the fixture runner.
