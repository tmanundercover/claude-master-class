# Proposal

## Why

The workspace can assess job fit and draft letters, but cannot produce a cohesive résumé written for a particular job in its existing HTML résumé style. Its current AI instructions also discourage useful professional reframing: the tools should help the candidate make a persuasive, supported case while keeping Job Fit candid for the candidate's own decisions.

## What Changes

- Add an owner-only Resume Tailor beside Job Fit, Cover Letter, and Interview Prep / Study Plan, accepting a pasted job description and producing a polished, job-specific résumé.
- Supply actual documented experience, bullets, projects, and skills to the LLM. Let it select relevant material and rewrite summaries and bullets to emphasize the target job; source references support review rather than enforcing verbatim copying.
- Preserve material facts while allowing supported terminology and transferable experience. React 18 experience remains relevant to a React 19 posting without inventing React 19 usage or adding a version-gap disclaimer to application materials.
- Render validated structured content through a shared résumé document renderer derived from the existing inbox HTML template, preserving its visual style and providing preview, HTML download, and plain-text copy.
- Revise Cover Letter and Interview Prep toward confident candidate advocacy, and Study Plan toward useful preparation. Keep concise factual boundaries and existing result contracts rather than making defensive qualification language the writing style.
- Keep Job Fit a candid assessment of strengths, transferable experience, meaningful gaps, and questions about the employer's stated requirements. Treat the job description as employer-supplied claims, not established workplace reality.
- Keep every tool independently accessible; Resume Tailor requires no prior assessment, score, or enforced sequence.

## Capabilities

### New Capabilities

- `resume-tailoring`: Independent, owner-only résumé generation from supplied candidate evidence, professional rewriting, traceability, HTML presentation, and user-controlled exports.
- `career-tool-guidance`: Candidate-oriented writing and preparation across existing AI tools, with candid decision support in Job Fit and supported semantic matching across tools.

### Modified Capabilities

None. The project currently has no canonical capability specs; existing tool behavior is established by source and tests.

## Impact

- New `/dashboard/resume-tailor` page integration and `/api/resume-tailor` endpoint; existing owner authorization, provider abstraction, failure handling, and input limits remain applicable.
- Affects `src/lib/tools.ts`, analysis/result modules, `src/components/ToolWorkbench.tsx`, dashboard/tool copy, `src/entry-server.tsx`, and résumé HTML rendering in `src/lib/mail-templates.ts`.
- Uses `data/profile.json` as the initial consolidated candidate source, including existing approved project evidence server-side. Historical archive ingestion and new résumé uploads are outside this change.
- Includes focused prompt/contract/rendering tests, Firebase emulator and responsive browser checks, public-export isolation, and `npm run preflight` during implementation. No new provider SDK or service is required.
- Coordinates the shared template boundary with the active `add-resend-owner-inbox` change without taking over its unfinished mail work. Automatic sending, new inbox integration, PDF generation, public publishing, and profile-data edits are outside scope.
