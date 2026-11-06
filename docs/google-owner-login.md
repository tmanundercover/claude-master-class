# Google owner login

Released 2026-11-05 to `my-automated-resume`, at
<https://resume.terrellsingleton.com/login>.

Select **Terrell Singleton**, then **Continue with Google**. The owner form has no
email/password inputs. The client prepares Firebase before the click, opens the
Google account picker, exchanges a recent Firebase ID token for the existing
four-hour server cookie, and signs out of browser Firebase state. Closing or
blocking the popup leaves an explicit recoverable error.

Owner access requires all three verified Firebase claims: the exact email
`terrell.singleton@gmail.com` (case insensitive), `email_verified: true`, and
`firebase.sign_in_provider: google.com`, together with the server-assigned
`portfolioRole: terrell`. These checks run both at session exchange and on every
owner session-cookie verification. Client fields, aliases, other Google accounts,
password tokens, and old password-based owner cookies cannot grant owner access.
Guest roles retain their existing password flow and interview-room boundaries.

The production Google provider was already enabled with its OAuth settings.
Added `resume.terrellsingleton.com` to authorized domains while preserving the
existing domains and provider credentials. Retained the existing owner account,
UID, and custom claim; no replacement account or new owner role was provisioned.
The first real Google sign-in/linking remains an owner-operated step. Firebase's
[Google sign-in documentation](https://firebase.google.com/docs/auth/web/google-signin)
describes its trusted Google/Gmail account-linking behavior.

## Evidence

- Isolated release preflight passed: 123 unit tests, lint, TypeScript, eight Pages
  checks, six Functions/privacy checks, four storage SDK/rules emulator tests,
  and 19 passing HTTP checks (two optional model checks skipped).
- Emulator HTTP checks exercised correctly signed Google owner tokens, rejected
  owner password tokens and another Google account with an owner claim, and
  rejected an old password-based owner cookie on private pages and APIs.
- The Firebase SDK popup flow passed in Chrome at 375px and 1440px: correct-owner
  access, wrong-Google-account denial without a session, guest password login,
  owner inbox access, and guest inbox denial. No page errors were recorded.
- Production Google account selection reached `accounts.google.com` on its sign-in
  identifier page with the approved email hint. Closing the popup created no
  application session, and the login page reported cancellation correctly.
- Firebase rejected the saved legacy production password before issuing an ID
  token. Therefore a fresh production password-token exchange was not exercised;
  the HTTP emulator checks separately prove that the application rejects it.
- Real Google credentials, consent, MFA, and successful live account linking were
  not exercised by the agent. The owner must complete that first sign-in.

The release was built in an isolated directory from the committed application,
these authentication changes, and the previously deployed profile-card animation.
The unrelated contact-email edits in the worktree were preserved locally. No AI,
Resend, or OAuth credential was printed, replaced, or copied between environment
files. Tests used isolated demo projects, ports, and private temporary directories.
