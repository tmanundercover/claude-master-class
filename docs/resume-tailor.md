# Resume Tailor

Sign in as the owner, open **Resume Tailor** from the workspace (or go directly to
`/dashboard/resume-tailor`), paste a job description up to 15,000 characters, and
choose **Run tool**. No Job Fit result, score, or prior tool use is required.
The page shows a complete, scrollable résumé preview, **Download HTML**, and
**Copy plain text**. Sources and optional review notes appear below the preview
and are excluded from both exports. A new submission clears the previous result
and action feedback; failure produces an error without a fallback document.

## Evidence and contracts

The server projects only the approved consolidated `data/profile.json` roles,
individual bullets, projects (including approved project evidence), and strong
skills into readable sources with request-scoped IDs and parent associations.
All roles, including older work, reach the model. The separate Sanity historical
archive, arbitrary added fields, uploads, and new private inputs are not included.
Provider credentials and calls stay on the server.

The model receives `verifiedCandidateEvidence` and `untrustedJobDescription`
separately. It selects relevant work and rewrites headline, summary, role summaries,
bullets, and project descriptions. Supported paraphrasing, synthesis, aligned
terminology, and transferable experience are encouraged. React 18 evidence can
support React engineering for a React 19 posting without claiming React 19 use
or inserting a version-gap disclaimer into application content.

The following model fields illustrate the same contract as the parser fixtures:

```json
{
  "headline": { "text": "Software Engineer for business automation", "references": ["role-1-summary"] },
  "summary": { "text": "Builds applications and workflows that help teams manage operations.", "references": ["role-1-summary"] },
  "skills": ["skill-1"],
  "experience": [{
    "id": "role-1",
    "summary": { "text": "Develops business applications and enables staff through automation consulting.", "references": ["role-1-summary"] },
    "bullets": [{ "text": "Built allocation workflows for employees, managers, and finance administrators.", "references": ["role-1-bullet-2"] }]
  }],
  "projects": [{ "id": "project-1", "description": { "text": "Built a client website with property listings and integrated contact delivery.", "references": ["project-1-summary"] } }],
  "factsToVerify": []
}
```

Runtime validation rejects unexpected fields, empty/oversized strings, duplicate
selections/references, unknown IDs, and cross-role or cross-project references.
Headline: 180 characters; summary: 1,600; role summary: 1,200; bullet: 900;
project description: 1,400. Selection bounds are 1–40 skills, 1–16 roles,
0–8 bullets per role, 0–13 projects, 1–12 references per prose item, and
0–10 verification notes of at most 500 characters. Total model JSON is limited
to 100,000 characters. Oversized output fails visibly; it is never truncated.

The server assembles `{ document, evidenceUsed, factsToVerify }` by whitelisting
source identity, contact details, education, employers, actual titles, periods,
and project links, then adding validated rewritten prose. It returns concise
source labels rather than the raw catalog or private project notes. References
prove traceability and parent association, not semantic truth of arbitrary prose;
the owner must review claims. The parser does not require verbatim copying or
ban legitimate numbers, versions, dates, or metrics.

## Rendering and exports

`resume-document.ts` owns the shared portfolio palette, typography, skills column,
contact presentation, and HTML/text content. It escapes text and permits only
HTTPS project/web links and mailto contact links. Missing skill icons fall back
to text. Standalone preview and download use identical HTML with embedded PNGs,
the existing preview CSP, and an empty iframe sandbox. They need no remote image
loads. Plain text comes from the same document and preserves complete contact URLs.
Long documents scroll in the preview and export in full.

The inbox **Send my résumé** template remains a public-profile adapter with its
subject, email introduction, sign-off, full contact URLs, and editable/autosaved
draft behavior. Its sent icons retain portfolio URLs. Tailored results stay in
page memory and never modify the profile, inbox template, or mail drafts.
Exports are HTML and text; there is no PDF attachment, automatic send, application
submission, or publication. Copy/download errors are shown while keeping the result.

## Verification

Unit tests cover evidence, contracts, assembly, rendering, and prompt boundaries.
The Firebase Auth/Hosting/Functions harness covers authorization and HTTP errors.
Controlled browser fixtures and real-provider writing evaluation are recorded
separately in the change's `evidence/` directory. Fixture output is deterministic
acceptance evidence, not proof of real model writing quality.
