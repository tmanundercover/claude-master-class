# Student Portfolio Starter

Build and personalize a portfolio while completing the class exercises in order.

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
public projects show descriptions, technologies, and links. Experience bullets open with More. Login uses a signed, four-hour role session. The job-fit, cover-letter,
interview-prep/study-plan, and résumé-evidence tools are implemented in the owner workspace; the
interview room gives approved guests access to evidence-linked STAR responses.

## Class Path

1. [Personalize the portfolio](exercises/00-personalize.md).
2. [Add authentication](exercises/00-authentication.md).
3. [Build the job-fit analyzer](exercises/01-job-fit.md).
4. [Build the cover-letter tool](exercises/02-cover-letter.md).
5. [Build the career-plan tool](exercises/03-career-plan.md).
6. [Build STAR interview responses](exercises/04-star-interview-responses.md).

Start by replacing the sample facts in [data/profile.json](data/profile.json) with verified
information that you are comfortable publishing.

## Course Materials

- [Class slides (PDF)](docs/slides/portfolio-career-workspace.pdf)
- [Interactive class slides (HTML)](docs/slides/portfolio-career-workspace.html)
- [Firebase deployment guide](docs/deploy-firebase.md)

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

`npm run dev` builds with Vite and starts Firebase Auth, Hosting, and Functions
emulators using `demo-portfolio-local`. Open `http://127.0.0.1:5500`.
There is no standalone web server. After source edits, run `npm run build:firebase`
in another terminal and refresh; Functions reloads its generated backend.

The startup script seeds three Auth accounts with server-managed `portfolioRole`
claims. Local passwords are generated and saved privately in
`.firebase/auth-users.local.json`. Emulator Auth data exports to
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
HTTP suite uses isolated demo users and restores existing backend environment
files after testing. No AI provider call is made by the automated suite.

Firebase Hosting serves the public portfolio and assets; Functions serves
private routes, protected recordings, and AI endpoints on the same Hosting origin.
See [the Firebase guide](docs/deploy-firebase.md) before a future live deployment.
The repository currently uses demo projects; no live users or resources are created.

`npm run build:pages` remains available for a public-only export in `dist/pages`.
For a project site, set `BASE_PATH=/YOUR_REPOSITORY/`; use `/` for a root site.
Private URLs in that export explain that Firebase Functions is required.
