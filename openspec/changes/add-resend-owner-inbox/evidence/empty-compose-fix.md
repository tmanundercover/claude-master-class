# Empty composer autosave correction

Verified locally on 2026-11-03 through Firebase Auth, Hosting, and Functions emulators with fixture mail. No live mail or provider writes were performed.

Opening Compose previously scheduled a blank draft create after 900 ms. Resend requires at least one nonempty recipient/content/attachment field and rejects an empty subject string. The fixture had allowed completely empty draft creation, so earlier browser acceptance did not expose the live rejection.

New composers now start with a clean local baseline and no automatic provider write. An untouched or cleared unsaved composer remains closable; Save draft is disabled while empty. Explicit empty sends show local validation without creating a draft. Edits still autosave through the existing serialized writer and immutable retry identity. Authentication recovery links are shown for authentication failures.

The live adapter omits empty optional content fields on creation and uses null to clear those fields on update. Both adapters reject blank creates before provider work, while allowing recipient-only, subject-only, body-only, and attachment drafts. Send requirements remain separate from draft requirements.

Verification:

- `npm test`: 71/71 passed. New adapter contract checks reject blank creation without network writes, exercise partial drafts through the pinned SDK, and verify explicit optional-field clearing.
- Lint, TypeScript, Firebase build, 4 Firebase packaging/privacy checks, and `git diff --check` passed.
- Full emulator Chrome acceptance passed at 375px and 1440px. New checks wait beyond the autosave delay with no draft POST or alert, clear an edited unsaved subject without a write, close the empty composer, reject an empty send locally without a sign-in link, and autosave/discard a body-only draft. Existing send/reply/draft/template/attachment/recovery and role-boundary checks also passed.

Browser results: [empty-compose-browser-results.json](empty-compose-browser-results.json). Temporary logs: `/tmp/compose-empty-unit.log`, `/tmp/compose-empty-build.log`, `/tmp/compose-empty-packaging.log`, and `/tmp/compose-empty-browser.log`.

Provider contract checked: [Create Draft](https://resend.com/docs/api-reference/inboxes/create-draft). This is fixture and SDK-contract verification, without claiming a new live provider round trip.
