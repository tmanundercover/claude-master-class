# Firebase development and deployment

Vite builds the React frontend. Firebase Hosting serves `dist/hosting`; requests
for login, private pages, recordings, and APIs rewrite to the `portfolioApp`
Function in `us-central1`. Firebase Authentication owns accounts and session signing.
The app does not use site passwords, session secrets, or a standalone development server.

## Local development

```text
npm ci
npm ci --prefix functions
npm run dev
```

This starts only the Auth, Hosting, and Functions emulators under
`demo-portfolio-local`. Open `http://127.0.0.1:5500`. Auth uses port 9099 and
Functions uses 5501; the configured ports are in `firebase.json`.
After source edits, run `npm run build:firebase` in another terminal and refresh.
Hosting reads the rebuilt files; Functions reloads the backend bundle.

Startup seeds these Firebase Auth users with `portfolioRole` custom claims:

| Email | Role | Access |
|---|---|---|
| `Terrell.singleton@gmail.com` | `terrell` | Owner workspace and interview room |
| `Terrell.singleton+interviewer@gmail.com` | `interviewer` | Interview room |
| `Terrell.singleton+recruiter@gmail.com` | `recruiter` | Interview room |

Generated passwords are in `.firebase/auth-users.local.json`, with private file
permissions and Git exclusion. They are local emulator credentials. The startup
script exports Auth data to `.firebase/emulator-data` on shutdown and imports it
on the next run. Reseeding is idempotent and preserves existing account passwords:

```text
npm run firebase:seed-auth
```

Seeding refuses live project IDs and non-loopback endpoints. No live users are
created, and no email is sent. Interviewer and Recruiter have equivalent access.

## Backend environment

The existing root `.env.local` settings were copied, without removing their source:

- AI provider, model, base URL, and reasoning effort: `functions/.env.local`.
- Provider API key: `functions/.secret.local`.
- Legacy site passwords and session secret: retained in the same backend secret
  file for verification, but no longer read by the application or bound to Functions.

The root file remains unchanged until you verify the backend copies. Both backend
files are Git-ignored. Frontend builds need no credentials. Do not use `VITE_`
variables for API keys or passwords.

The demo Auth configuration is provided automatically by Functions at
`/api/auth/config`. The endpoint returns only public Firebase web settings. The
client uses the Auth emulator locally and Firebase's email/password provider when
deployed. No credentials are embedded in the frontend build.

## Authentication boundaries

The browser signs in to Firebase Auth using email and password with memory-only
persistence. It exchanges a recent ID token for a four-hour `__session` cookie,
then clears client Auth state. The Function verifies ID tokens and session cookies
with the Admin SDK, including revocation checks, and authorizes the server-assigned
`portfolioRole`. Selecting a role cannot grant access. Unassigned accounts are denied.

Cookies are `Secure`, `HttpOnly`, and `SameSite=Strict`. Private responses use
`Cache-Control: private, no-store`. Logout clears the browser cookie; to revoke
copied sessions, revoke the user's refresh tokens using the Admin SDK.
There is no public registration route. Provisioning a live user and assigning its
claim is an administrator operation. Firebase Auth owns password verification;
the session-exchange endpoint also retains its process-local classroom rate limiter.

## Verification

```text
npm run preflight
npm run test:http
```

Preflight runs unit tests, lint, types, build/export checks, and HTTP acceptance
checks through all three emulators. The HTTP suite seeds isolated demo accounts,
disables provider calls, and restores the original backend environment files after
completion. It tests guest/owner access, unassigned users, escalation rejection,
revoked sessions, cookies, origin checks, and tool validation. It never launches a
standalone server. Tests choose unused emulator ports to avoid disturbing a running
project. No live deployment or paid provider request is part of these checks.

## Future live deployment

Use a Firebase project with the Blaze plan enabled for Functions. The repository
currently selects no live project. When ready:

1. Enable Firebase Authentication's Email/Password provider in the target project.
2. Provision approved users and set their `portfolioRole` claims through the Admin
   SDK. Use `terrell` for the owner and `interviewer` or `recruiter` for guests.
   The local seed command intentionally cannot modify the live database.
3. Copy `functions/.env.example` to `functions/.env.YOUR_PROJECT_ID` and fill in
   the AI settings and the public `FIREBASE_WEB_API_KEY` from the project's web app.
4. Set the only application secret, `AI_API_KEY`, with Secret Manager:

```text
npx firebase login
npx firebase functions:secrets:set AI_API_KEY --project YOUR_PROJECT_ID
npm run firebase:deploy -- --project YOUR_PROJECT_ID
```

Functions and Hosting deploy together. The Hosting rewrite pins its Function
revision; even a Hosting-only deploy can deploy the pinned Function. Both deploy
hooks rebuild the package. Static files take precedence over rewrites, so private
pages and recordings are excluded from `dist/hosting`.

The provider deadline is 50 seconds to fit inside Hosting's 60-second limit.
Functions caps instances at three. The Functions runtime audit currently reports
four moderate transitive advisories in the Firebase Admin dependency tree; the
compatible auto-fix did not resolve them. Review upstream updates before release.

References: [Firebase session cookies](https://firebase.google.com/docs/auth/admin/manage-cookies),
[Auth emulator](https://firebase.google.com/docs/emulator-suite/connect_auth),
[custom claims](https://firebase.google.com/docs/auth/admin/custom-claims), and
[Hosting with Functions](https://firebase.google.com/docs/hosting/functions).
