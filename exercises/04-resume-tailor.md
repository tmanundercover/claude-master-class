# 04 — Resume Tailor

Open `/dashboard/resume-tailor` directly as the owner. Submit a job description;
no previous assessment is required. The server supplies readable consolidated
profile roles, bullets, project evidence, and skills separately from the untrusted
posting. The model selects relevant material and rewrites it professionally.

Use `generateJson`, `TAILOR_RESULT_SCHEMA`, and `parseTailorModelResult`. Preserve
immutable identity, employer, title, dates, education, contacts, and approved links
through server assembly. References establish traceability without requiring
copied wording. Keep optional review notes outside the finished document.

Verify owner access, input limits, unknown/cross-parent references, provider
failure, and public build isolation. Preview the shared template, download the
self-contained HTML, and copy matching text. Check failure feedback and stale
result clearing at 375px and 1440px. Run only the Firebase emulators for HTTP and
browser checks. Exports must not send, submit, publish, or overwrite the profile.

See [the contract and user flow](../docs/resume-tailor.md) for bounds and examples.
