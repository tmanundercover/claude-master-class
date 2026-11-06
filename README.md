# Student Portfolio Starter

Inspect and personalize the supplied portfolio through one reviewed OpenSpec lesson change at a time.

## Start Here

New students should complete the [pre-class setup guide](docs/pre-class.md). It covers the required
accounts, tools, API key, Node.js version, cloning, and initial checks.

If setup is already complete, open this repository in VS Code and run:

```text
npm ci
npm ci --prefix functions
npm run preflight
npm run dev
```

Open the local URL printed in the terminal, usually `http://127.0.0.1:5500`. Stop the emulators with
Ctrl+C.

The public homepage works without an API key and includes a floating résumé search over current and
approved historical evidence. Project source notes stay in the owner-only résumé explorer;
public projects show descriptions, technologies, and links. Experience bullets open with More.
Firebase Auth verifies accounts and four-hour sessions on the server. Four career tool
entries are supplied: Job Fit, Cover Letter, Interview Prep / Study Plan (two modes of
one entry), and Resume Tailor. The owner also has résumé evidence tools and Inbox.
Approved guests can use the interview room; absent recordings show honest placeholders.

## Class Path

Explore and refine one lesson, propose its named change, review its artifacts, then
explicitly Apply and Verify before beginning the next. Inspect and extend existing
satisfied behavior instead of removing supplied features to rebuild a blank starter.
Filename prefixes are legacy identifiers; the displayed sequence below is authoritative.

| Lesson | Topic |
|---|---|
| 0 | [OpenSpec workflow](exercises/openspec-workflow.md) |
| 1 | [Personalize your portfolio](exercises/00-personalize.md) |
| 2 | [Firebase authentication](exercises/00-authentication.md) |
| 3 | [Job Fit](exercises/01-job-fit.md) |
| 4 | [Cover Letter](exercises/02-cover-letter.md) |
| 5 | [Interview Prep / Study Plan](exercises/03-career-plan.md) |
| 6 | [Resume Tailor](exercises/04-resume-tailor.md) |
| 7 | [Interview room](exercises/04-star-interview-responses.md) |
| 8 | [Inbox](exercises/inbox.md) |
| 9 | [Contact form and resume email templates](exercises/contact-and-email-templates.md) |
| 10 | [Verification and deployment](exercises/verification-and-deployment.md) |

An introductory session can stop after Lesson 5 when its checks pass. Lessons 6–10
are continuation material; the expanded series has no one-session duration promise.
The teaching order does not impose tool dependencies: all four owner career tools
open independently without a Job Fit score or preceding result.

For personalization, extract and approve your own public facts first, review the
proposal, then apply portfolio edits. Preserve current approved records in
[data/profile.json](data/profile.json); never publish raw résumé sources or private
job-search output. Local mail practice uses explicit isolated fixtures and no real mail.

Saved jobs, versioned artifacts, application PDFs and document email integration are
owned by the separate [job-workspace change](openspec/changes/archive/2026-11-05-add-job-workspaces-and-versioned-artifacts/tasks.md).
Its [documentation](docs/job-workspaces.md) describes the concurrent implementation;
remaining acceptance and live operations are not completed by this curriculum.
Check its current status before using branch-specific controls in class.

## Course Materials

- [Class slides (PDF)](docs/slides/portfolio-career-workspace.pdf)
- [Interactive class slides (HTML)](docs/slides/portfolio-career-workspace.html)
- [Firebase deployment guide](docs/deploy-firebase.md)
- [Slide authoring and export](docs/slides/README.md)
- [Curriculum review and prompt preservation](docs/curriculum-review.md)

Download the HTML files before opening them in a browser from GitHub.

## Repository Map

| Path | Purpose |
|---|---|
| `src/` | Vite React pages, shared components, and server-only API modules |
| `functions/` | Firebase Functions entry point and runtime dependencies |
| `data/` | Current public profile plus normalized, approved historical résumé evidence |
| `exercises/` | Step-by-step class work |
| `tests/` | Automated checks used by `npm run preflight` |
| `docs/` | Setup, slides, and deployment guidance |
| `private-inputs/` | Local resumes and source documents that Git ignores |

Do not commit `node_modules/`, `dist/`, secrets, or raw resumes. The existing `.gitignore` already
excludes generated files, environment files, and private inputs.

## Development and Deployment

The private dashboard supports [profile photo uploads](docs/profile-photo.md) to
Cloud Storage. The saved portrait replaces the owner's initials on the portfolio
and account avatars.

`npm run dev` builds with Vite and starts Firebase Auth, Hosting, Functions, Firestore, and Cloud Storage
emulators using `demo-portfolio-local`. Open `http://127.0.0.1:5500`.
There is no standalone web server. After source edits, run `npm run build:firebase`
in another terminal and refresh; Functions reloads its generated backend.

The startup script seeds three Auth accounts with server-managed `portfolioRole`
claims. Local passwords are generated and saved privately in
`.firebase/auth-users.local.json`. Emulator Auth, Firestore, and Storage data exports to
`.firebase/emulator-data` on shutdown and imports on the next start.

| Account | Role | Access |
|---|---|---|
| `Terrell.singleton@gmail.com` | `terrell` | Owner dashboard, tools, and interview room |
| `Terrell.singleton+interviewer@gmail.com` | `interviewer` | Interview room |
| `Terrell.singleton+recruiter@gmail.com` | `recruiter` | Interview room |

`npm run firebase:seed-auth` restores these role assignments in a running local
Auth emulator without duplicating accounts. The seed command refuses live projects.

Login uses Firebase email/password authentication, exchanges a recent ID token
for a four-hour Firebase session cookie, and verifies the cookie and revocation
on the backend. The role dropdown cannot grant permissions. There is no public
registration flow; unassigned accounts have no private access.

Use `functions/.env.local` for all backend AI settings, including `AI_API_KEY`. Site passwords and session
secrets are no longer used. Existing root `.env.local` values and their backend
copies are retained for verification; do not delete them until confirmed.
Frontend builds need no credentials or `VITE_` secrets.

`npm run preflight` runs unit, lint, type, build, and emulator HTTP checks. The
HTTP suite uses isolated demo users and a temporary Functions package with
synthetic settings; it does not read or rewrite existing credential files. No AI provider call is made by the automated suite.

Firebase Hosting serves the public portfolio and assets; Functions serves
private routes, protected recordings, and AI endpoints on the same Hosting origin.
See [the Firebase guide](docs/deploy-firebase.md) before a future live deployment.
The repository currently uses demo projects; no live users or resources are created.

`npm run build:pages` remains available for a public-only export in `dist/pages`.
For a project site, set `BASE_PATH=/YOUR_REPOSITORY/`; use `/` for a root site.
Private URLs in that export explain that Firebase Functions is required.

## Owner email

See [Owner inbox](docs/owner-inbox.md) for backend modes, the private API, contact delivery, local emulator acceptance, and separate live-activation gates.
