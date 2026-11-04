# One-time template customization

Verified locally on 2026-11-03 with Firebase Auth, Hosting, and Functions emulators and fixture mail.

Previously Edit HTML switched from the selected-template preview to the empty current-message HTML. It now copies the selected template into the draft on first edit when needed, retaining recipients and attachments. Subsequent source/preview switches preserve the edited draft, including intentionally cleared HTML. Browsing the reusable template does not modify the message copy, and customizing that copy does not modify the reusable template. Use template remains the explicit replacement action.

- Lint, TypeScript, Firebase build, and `git diff --check` passed.
- Full Chrome acceptance passed at 375px and 1440px, including selecting a template and editing without first clicking Use template, adding recruiter-specific HTML, preview/source round trips, verifying the original template lacks the added text, preserving deliberately cleared HTML, reopening the saved customized draft, and reading the customized HTML after a fixture send.
- Existing sandbox/remote-image, compose, recovery, folder loading, account-menu, and role-boundary checks also passed. No captured page/hydration errors or horizontal overflow.

Browser results: [template-customization-browser-results.json](template-customization-browser-results.json). Temporary logs: `/tmp/template-edit-build.log` and `/tmp/template-edit-browser.log`.

No live external mail, reusable template source changes, provider configuration, deployment, or DNS changes were made. The fixture runner restored the local environment files.
