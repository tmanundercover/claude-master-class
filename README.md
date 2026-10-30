# Student Portfolio Starter

Build and personalize a portfolio while completing the class exercises in order.

## Start Here

New students should complete the [pre-class setup guide](docs/pre-class.md). It covers the required
accounts, tools, API key, Node.js version, cloning, and initial checks.

If setup is already complete, open this repository in VS Code and run:

```text
npm ci
npm run preflight
npm run dev
```

Open the local URL printed in the terminal, usually `http://localhost:3000`. Stop the server with
Ctrl+C.

The public homepage works without an API key and includes a floating résumé search over current and
approved historical evidence. Login uses a signed, four-hour role session. The job-fit, cover-letter,
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
- [Vercel deployment guide](docs/deploy-vercel.html)

Download the HTML files before opening them in a browser from GitHub.

## Repository Map

| Path | Purpose |
|---|---|
| `src/` | Next.js application code |
| `data/` | Current public profile plus normalized, approved historical résumé evidence |
| `exercises/` | Step-by-step class work |
| `tests/` | Automated checks used by `npm run preflight` |
| `docs/` | Setup, slides, and deployment guidance |
| `private-inputs/` | Local resumes and source documents that Git ignores |

Do not commit `node_modules/`, `.next/`, secrets, or raw resumes. The existing `.gitignore` already
excludes generated files, environment files, and private inputs.

## Classroom Authentication Limits

Set unique `SITE_PASSWORD` and `INTERVIEW_PASSWORD` values (at least 12 non-trivial characters
each) and a random `SESSION_SECRET` (at least 32 characters) in `.env.local`, then restart the
server. Recruiter and Interviewer share the interview password for this classroom build; Terrell
uses the owner password. Never put real values in `.env.example` or Git.

This single-owner login is intentionally limited to the classroom. Its ten-attempts-per-minute
limit is process-local, resets when the server restarts, and is not shared across instances.
Logout clears the browser cookie but cannot revoke a copied signed token before its four-hour
expiry; rotating `SESSION_SECRET` invalidates every session. Before broader public use, replace
this with managed identity and distributed abuse controls, require HTTPS, add host-level body
limits, and complete a security review.
