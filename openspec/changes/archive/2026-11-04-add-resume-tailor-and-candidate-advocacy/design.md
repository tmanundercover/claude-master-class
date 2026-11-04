# Design

## Context

See `proposal.md` for motivation and the two delta specs for behavior. This design is necessary because the change spans model prompts, evidence handling, server routing, result contracts, a shared HTML template, and public build isolation.

The current Vite/React application has three registered AI tools. `src/lib/tools.ts` owns their IDs and common input validation; `src/entry-server.tsx` dispatches their pages and APIs. `src/components/ToolWorkbench.tsx` handles submission, loading/errors, typed results, and explicit copying. The existing API routes load `data/profile.json` server-side, check owner sessions through `requireApiSession`, call `generateJson`, and normalize errors through `modelFailureResponse`.

The consolidated profile currently has 16 employment roles, 13 projects, and 61 strong skills. It includes summaries and detailed bullets, with additional approved project evidence excluded by the public profile projection. `data/sanity-resume-snapshot.json` is a separate historical self-reported archive with overlapping records; it is not currently supplied to the AI tools.

`src/lib/mail-templates.ts` produces the existing Send my résumé document from the public profile. It currently prints every role summary, has no selected-project section or detailed role bullets, and includes an email introduction. Its escaping, HTTPS contact links, bundled icon preview support, and sandbox/CSP preview are useful foundations. The active inbox change owns unrelated mail delivery, drafts, and operational tasks; its unfinished work does not gate this feature.

## Goals / Non-Goals

**Goals:**
- Separate immutable candidate facts, model-rewritten content, and template presentation so professional writing is flexible without letting the model replace employer/date/contact records.
- Give the model substantive evidence and let it choose relevance semantically across roles, projects, and related technology terms.
- Keep the existing provider adapter, role checks, common failures, and existing tool result shapes compatible.
- Make generated résumé HTML and text agree, with source and verification information outside both exports.

**Non-Goals:**
- No vector database, external retrieval service, new provider adapter, or requirement for another tool's results.
- No PDF parsing, new uploads, archive merge, profile-data editing, automatic inbox draft creation, or automatic publication/delivery.
- No new persistence layer, document history, PDF generation, or fixed one-page/two-page truncation.
- Source references establish traceability; they are not a claim that arbitrary rewritten prose can be mechanically proven true.

## Decisions

### 1. Use the consolidated profile and semantic selection within one generation request

Add a server-only evidence projection, provisionally `src/lib/resume-tailor-evidence.ts`, which loads the approved consolidated profile and assigns request-scoped source IDs to roles, individual bullets, role summaries, projects, project evidence, and skills. Send their readable content, parent associations, and labels in the model request. Keep identity, contact data, actual job titles, organizations, periods, and education available for server-side document assembly rather than asking the model to reproduce them.

For this bounded initial corpus, send the complete relevant candidate catalog in one structured-output request and have the model select and rewrite. This implements relevance querying through the supplied evidence without a preliminary lexical filter that could discard React 18 for a React 19 posting. The request contains system instructions, a `verifiedCandidateEvidence` object, and an `untrustedJobDescription` string. Identifiers alone are never sufficient context. Approved project evidence can inform writing on the server; raw internal notes are not serialized into page payloads or returned as debug context.

Default assumption: the consolidated profile is the initial approved source, as proposed in exploration. The historical archive stays out of generation until a separate change defines conflict resolution and historical-status handling.

Alternatives considered: exact source-text assembly was rejected during exploration because it cannot provide the desired rewriting. A vector index or two model calls add infrastructure or selection cost without a current corpus-size need. Aggressive keyword filtering loses transferable experience.

### 2. Model output contains rewritten prose plus references, not raw HTML

Add `resume-tailor-analysis.ts` and `resume-tailor-result.ts` following the existing request-builder, injected generator, JSON schema, and runtime parser pattern. The model result contains:

- A supported professional headline and summary, each with source references.
- An ordered selection of documented skills by source ID; display labels come from the evidence catalog, with established aliases normalized where supported.
- Selected experience records by source ID, with rewritten summaries and bullets carrying their supporting source references.
- Selected projects by source ID, with rewritten descriptions and references.
- A separate `factsToVerify` array, allowed to be empty.

Rewriting can combine supported facts and align terminology. It cannot change the actual title, organization, period, technology usage, or accomplishment scope. References for an experience bullet must belong to that role; project descriptions reference their project evidence. The headline/summary can synthesize across roles and projects. Do not attribute a project to an employer merely because its technologies overlap; projects remain a separate section unless the source establishes the association.

The parser checks exact structure and types, non-empty strings, bounded arrays/text, valid selections, duplicate IDs, reference existence, and parent relationships. Concrete output limits should be selected from the existing corpus and provider output budget during implementation; they must fail visibly rather than silently truncate content. These checks do not require prose equality or impose universal gap disclaimers. Do not implement a blanket keyword or number ban: legitimate evidence contains technology versions, dates, and metrics.

After validation, the server hydrates a display document from authoritative identity/contact/education and role/project metadata plus model-rewritten prose. Return only the normalized document, concise owner-facing evidence labels, and verification notes. Exclude the full source catalog and raw private notes. Do not pass the raw profile to a client renderer or spread it into the result.

Alternatives considered: free-form model HTML weakens consistency and escaping. ID-only selection blocks rewriting. Asking the model to reproduce dates and employers adds avoidable opportunities for factual drift. A second LLM verifier is not included; traceability and focused evaluation must not be advertised as a guarantee of semantic correctness.

### 3. Give each tool a clear purpose and retain compatible contracts

Revise the three existing analysis modules explicitly rather than imposing one large global prompt. A short shared concept can be reused where useful, but tool-specific instructions remain easy to inspect:

- **Resume Tailor:** professional résumé consultant representing the candidate; prioritize a compelling, cohesive document written for the target job. Treat requirements as signals for targeting, permit accurate semantic matching and supported professional framing, and keep review notes out of the résumé.
- **Cover Letter:** confident candidate advocate; retain selected tone, 200-300 words, two distinct supporting examples, and separate `evidenceUsed` / `factsToVerify`. Permit paraphrasing, synthesis, and aligned terminology. Do not manufacture a verification item when none exists.
- **Interview Prep:** build usable, persuasive STAR talking points from documented contributions and qualitative or quantitative outcomes. Retain current result fields/counts and mark only genuinely missing story facts with the existing `needs my input` mechanism. Possible process stages remain assumptions to confirm.
- **Study Plan:** prioritize meaningful preparation and build on existing skills; retain three priorities, four weeks, weekly budgets, deliverables, measurable checks, and the existing readiness-check shape.
- **Job Fit:** candid advisor to the candidate. Recognize transferable and adjacent-version experience without inventing exact usage. Preserve required/preferred and absent-evidence/known-gap distinctions and existing result labels. Explain consequential uncertainty and ask what actual work the employer expects when the posting is unclear. Do not assume the employer's posting describes verified workplace reality or infer deceptive intent.

Each prompt retains a concise boundary against invented material facts and treats the pasted JD as untrusted data. Remove sweeping prohibitions against all inference or embellishment that suppress supported synthesis. Do not promise a high score or write warnings into application documents as a substitute for tailoring.

Update dashboard/tool notices and exercise documentation to match these stances; remove stale three-tool counts and language suggesting verbatim-only writing. Preserve existing contract parsers unless schema descriptions themselves conflict with the revised stance. Existing structural requirements are compatible and are not silently removed by prompt edits.

Alternatives considered: using the promotional writing stance for Job Fit would undermine the owner's decision data. Keeping the current blanket wording would contradict professional rewriting. Redesigning every result schema is unnecessary for the agreed behavior.

### 4. Extract a shared document renderer and keep the inbox adapter intact

Introduce an explicit résumé display-document type and pure renderer, provisionally `src/lib/resume-document.ts`. It accepts only whitelisted render data and returns matching HTML and plain text. Extract the established palette, typography, skills-column structure, and contact styling from `resumeMailTemplate` so the new feature visibly uses the same template rather than a lookalike copy.

The renderer supports selected role summaries, role bullets, optional projects, education, identity, and contact details. Escape every text value. Resolve contact/project URLs from server-approved records and supported schemes, never arbitrary model HTML or URLs. Skills with no bundled icon use a text-only fallback rather than a broken icon URL.

Keep `resumeMailTemplate(profile: PublicProfile)` as a compatible adapter that creates the existing public-profile document and adds its email introduction/sign-off and subject. The standalone tailor omits email-specific framing. Preserve full contact URLs, icon behavior, public/private projection boundaries, and editable/autosaved inbox drafts. Do not touch mail transport or operational gates from the other change.

Use the existing `previewEmailDocument` CSP and empty iframe sandbox with `previewEmailIcons` for local bundled images. HTML download uses the same approved document and bundled icon data so the exported file works without fetching arbitrary external resources. Copy plain text from the same normalized document; neither representation contains review metadata. No PDF attachment is implied.

Alternatives considered: duplicating the HTML would allow visual drift. Using the mail template without an explicit document model cannot represent selected projects and rewritten bullets cleanly. Replacing the mail workflow with the tailor would expand scope and interfere with existing work.

### 5. Integrate into existing owner routes and workbench

Register `resume-tailor` in `src/lib/tools.ts` and `/api/resume-tailor` in `src/entry-server.tsx`, with a new protected route using the current session/origin/JSON validation and the 15,000-character JD limit. Use `generateJson` and `modelFailureResponse`, not a new SDK. There is no fit-result parameter, score threshold, or stored assessment dependency.

Extend `ToolWorkbench` with a typed tailor result state and result presentation, optionally extracting a focused résumé-result component to keep the current workbench manageable. Show the document preview first, HTML download and plain-text copy actions, then concise optional source/verification details outside the résumé. Reuse loading/error behavior; clear stale results and action feedback on new submission. Retain the result in page state without introducing server persistence or implicit mail drafts.

Add the static-unavailable `/dashboard/resume-tailor` route in `scripts/export-pages.mjs` and its tests. Build artifact checks must verify the new server evidence projection does not enter public assets or page data. Generated content is not written into `data/profile.json`, public files, or build output.

Alternatives considered: a separate application shell duplicates routing/authentication. Gating tailoring behind Job Fit conflicts with the user's explicit independent-flow requirement.

## Risks / Trade-offs

- [Valid references can accompany an overstated sentence] -> Keep material-fact instructions concise but explicit, preserve identity/role metadata server-side, test adversarial and realistic examples, and present optional source review. State the limits of runtime validation honestly.
- [Prompt changes remove overly defensive wording but accidentally weaken candid assessment] -> Evaluate Job Fit separately from promotional writing; retain weak-fit and consequential-gap cases alongside semantic-match cases.
- [A technology version difference is either over-penalized or falsely erased] -> Include the React 18/React 19 case in prompt and example evaluation, retaining relevant React experience without claiming an unsupported exact version.
- [The consolidated evidence catalog consumes more tokens than a shortlist] -> Use one bounded request and explicit output sizing; revisit retrieval only if actual corpus/context measurements require it. Do not silently cut relevant older experience.
- [Template extraction regresses active inbox customization] -> Preserve its public adapter signature and run existing mail-template and emulator browser coverage after integration; leave unrelated dirty mail files and external-delivery tasks alone.
- [HTML presentation or preview leaks private source context or active markup] -> Build a whitelisted display document, escape text, use approved links, retain sandbox/CSP, and check public artifacts with sentinels.
- [Mocked model output looks successful while writing quality is unproven] -> Separate deterministic contract/browser proof from a controlled real-provider quality evaluation, with independently recorded outcomes.

## Migration Plan

1. Implement evidence/result contracts and renderer extraction with regression coverage before wiring the new endpoint and workbench.
2. Revise existing prompts and supporting copy while preserving contract compatibility. Add the tailor independently to owner routes and the static availability export.
3. Validate unit/rendering behavior, Auth/Hosting/Functions emulator authorization and HTTP behavior, and browser output at 375px and 1440px. Run `npm run preflight` because routing and public export change.
4. Evaluate real generated writing for frontend, automation, adjacent-version, and weak-fit examples through the configured server provider. Record provider/model, sanitized inputs, observed results, and any failures; do not claim model quality from request-string tests or mocked results.
5. Deployment follows a separately requested release. Rollback removes the new registration/route and restores prior prompts while preserving profile data and inbox drafts; no data migration is required.
