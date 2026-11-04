# Firebase development and deployment

Vite builds the React frontend. Firebase Hosting serves `dist/hosting`; requests
for login, private pages, recordings, and APIs rewrite to the `portfolioApp`
Function in `us-central1`. Firebase Authentication owns accounts and session signing.
The app does not use site passwords, session secrets, or a standalone development server.

## Local development

Install Node.js 22.18+ and Java JDK 21+ before starting the suite. Firestore and
Storage rules use Java; [Firebase recommends Java 21 for Firestore](https://firebase.google.com/docs/emulator-suite/connect_firestore).

```text
npm ci
npm ci --prefix functions
npm run dev
```

This starts the Auth, Hosting, Functions, Firestore, and Cloud Storage emulators under
`demo-portfolio-local`. Open `http://127.0.0.1:5500`. Auth uses port 9099 and
Functions uses 5501, Firestore 8080, and Storage 9199; the configured ports are in `firebase.json`.
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
script exports Auth, Firestore, and Storage data to `.firebase/emulator-data` on shutdown and imports it
on the next run. Reseeding is idempotent and preserves existing account passwords:

```text
npm run firebase:seed-auth
```

Seeding refuses live project IDs and non-loopback endpoints. No live users are
created, and no email is sent. Interviewer and Recruiter have equivalent access.

## Backend environment

All backend settings, including `AI_API_KEY`, use ordinary environment variables
from `functions/.env.local`. The application has no Secret Manager bindings or
runtime secret lookups. The previous local secrets file was consolidated into
this environment file and removed after verifying every copied value.

Legacy site passwords and the session secret remain in the backend environment
for verification, but Firebase Auth replaces them and the app does not read them.
The root `.env.local` remains unchanged until you verify the backend copies.
Environment files are Git-ignored. Frontend builds need no credentials. Do not
use `VITE_` variables for API keys or passwords.

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
checks through all five emulators, including real server SDK storage adapters and direct-client rules denial. The HTTP suite seeds isolated demo accounts,
disables provider calls, and builds an isolated temporary Functions package with
synthetic settings. Existing credential files are neither read nor rewritten. It tests guest/owner access, unassigned users, escalation rejection,
revoked sessions, cookies, origin checks, and tool validation. It never launches a
standalone server. Tests choose unused emulator ports to avoid disturbing a running
project. No live deployment or paid provider request is part of these checks.

## Future live deployment

Use a Firebase project with the Blaze plan enabled for Functions. The repository
currently selects no live project. Classroom completion prepares a review; it does
not authorize publication. Follow these steps only after target-specific review
and separate explicit authorization:

1. Enable Firebase Authentication's Email/Password provider in the target project.
2. Provision approved users and set their `portfolioRole` claims through the Admin
   SDK. Use `terrell` for the owner and `interviewer` or `recruiter` for guests.
   The local seed command intentionally cannot modify the live database.
3. With separate approval, create a missing `functions/.env.YOUR_PROJECT_ID` using
   the setting names in `functions/.env.example`. Preserve any existing file and
   every API key value; never copy a template over it or move keys between files.
   Privately enter only authorized AI settings and public `FIREBASE_WEB_API_KEY`
   from the target project's web app.
4. Set `AI_API_KEY` in that same project-specific backend environment file, then
   authenticate and deploy:

```text
npx firebase login
npm run firebase:deploy -- --project YOUR_PROJECT_ID
```

Functions, Hosting, and the checked-in Firestore/Storage rules deploy together. The rules deny direct client access; owner-authorized Functions serve private data using Firebase Admin. No custom IAM role setup is part of this feature. The Hosting rewrite pins its Function
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

## Course release review

Complete [Lesson 10](../exercises/verification-and-deployment.md) and record actual
checks first. The optional `npm run build:pages` export in `dist/pages` is public-only;
it cannot serve authenticated APIs, private interview recordings, or contact delivery.
Keep environment files, server bundles, raw sources and private workspace artifacts
out of public output. The separately developed standard public résumé PDF uses
only the approved public profile. Private tailored PDFs and notes remain server-owned.
No build/export check proves live provider readiness, real mail delivery, or DNS
cutover; those operations require their separate approvals and evidence.
