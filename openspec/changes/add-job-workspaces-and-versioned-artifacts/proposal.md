# Proposal

## Why

Career-tool results currently disappear when the page is left or refreshed. The owner needs each job description to organize retrievable application materials, reversible revisions, and the exact documents used in an application email.

## What Changes

- Create one private workspace per job when any job-description-based tool first runs; identify it with extracted, editable company/role details and retain the original description. Reuse the workspace for the same job; blank creation, duplication, and parallel-variant workflows are outside scope.
- Save Job Fit, tailored résumé, Cover Letter, Interview Prep, and Study Plan as distinct artifacts with structured content, Markdown, generation context, and at most two saved versions: Current and one Previous for undo. Save interview notes separately from model input.
- Offer Revise using the current artifact plus a change message, and Start over using the job description, approved evidence, and current tool instructions without the existing artifact. Both keep the same workspace and replace Current only after durable saving, moving the former Current to Previous. Compare the pair side by side with optional synchronized scrolling; undo swaps the pair. Full history and arbitrary older-version restoration are outside scope.
- Automatically create résumé and cover-letter PDFs; offer explicit PDF generation for other artifacts. Bind every PDF to its source revision and retain Markdown if PDF generation fails.
- Share résumé content contracts, formatting helpers, and design values across the existing email HTML and PDF renderers, preserving the established document design.
- Add a job-application email template with one template-specific input: job workspace. Populate the company/role/candidate subject and attachment-aware message, attach available résumé/cover-letter PDFs, and preserve native draft editing and explicit sending. Existing drafts and sent messages retain their attached PDF snapshots independently of workspace version cleanup.
- When no tailored résumé exists, warn and offer the standard résumé or navigation to tailoring in the current workspace, preserving the email draft for return.
- Add a subtle download-icon/text link beneath the public profile card for the standard résumé PDF, built from the approved public profile and shared with the email fallback.

## Capabilities

### New Capabilities

- `job-workspaces`: Job-description-led workspace creation, identification, retrieval, description provenance, and private ownership.
- `career-artifact-history`: Durable tool results and notes, bounded Current/Previous versions, Revise, Start over, comparison, and one-step undo.
- `resume-document-pdfs`: Shared résumé presentation, revision-bound document PDFs, and public standard résumé distribution.
- `job-application-email`: Workspace selection, document-aware application drafts, missing-résumé choices, and preserved draft/document snapshots.

### Modified Capabilities

None in the canonical inventory. The pending `resume-tailoring` and `owner-inbox` capabilities remain owned by their existing changes; this proposal adds coordinated behavior rather than duplicating their underlying generation or mail transport requirements.

## Impact

- Adds Firestore workspace/revision metadata and private Cloud Storage documents behind owner-authorized Functions; extends routing, tool requests/results, dashboard navigation, and inbox composition.
- Adds `@react-pdf/renderer` to relevant build/runtime packages, PDF layouts, public build allowlists, and a base-path-aware public download link.
- Coordinates with `add-resume-tailor-and-candidate-advocacy` for tailored document contracts/shared HTML presentation and `add-resend-owner-inbox` for native drafts/attachments. This change supersedes page-state-only result handling when integrated; it does not block either change's narrower implementation.
- Includes unit, persistence/failure, Auth/Hosting/Functions emulator, responsive browser, PDF, and public-export acceptance. Real storage/provider/deployed acceptance is recorded separately. Deployment, DNS changes, new storage emulators, historical result recovery, and automatic sending are outside implementation authorization for this proposal.
