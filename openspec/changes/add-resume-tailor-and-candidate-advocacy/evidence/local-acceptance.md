# Local acceptance

Implemented the owner-only Resume Tailor, server evidence/result contracts,
source-owned display assembly, shared email/standalone renderer, HTML/text exports,
and revised candidate advocacy and candid fit guidance. The original consolidated
profile is unchanged. Existing dirty inbox components, types, provider/fixture
files, tests, and browser script were checked against their starting SHA-256
hashes and preserved; the inbox documentation receives only the shared-renderer note.

## Deterministic checks

- `npm run preflight`: passed. 79 unit tests; lint; TypeScript; public export;
  6 Pages build checks; Firebase packaging; 4 Firebase build checks; HTTP suite
  (14 passed, one controlled-fixture-only test skipped).
- `node scripts/test-firebase-emulator.mjs --model-fixtures`: passed all 15
  HTTP tests, including guest 401, both non-owner roles 403, direct owner page
  access, input bounds, wrong origin, owner success for all four tools and both
  career-plan modes, configuration failure, malformed output, provider failure,
  and rate-limit retry headers.
- Public artifact assertions check every private project-evidence string and
  server-only model-context/prompt markers. The strengthened Pages/Firebase
  artifact suite passed all 10 tests.
- `git diff --check` and `openspec validate
  add-resume-tailor-and-candidate-advocacy --strict`: passed.

## Controlled browser acceptance

`node scripts/test-firebase-emulator.mjs --model-fixtures --browser-script
scripts/test-resume-tailor-browser.mjs` passed at 375px and 1440px.
[Machine-readable results](browser-results.json) record independent navigation,
real owner authorization and route/assembly execution, selected roles/projects,
identity/contact/education retention, no horizontal overflow, exact HTML preview
and download parity, plain-text parity, review-note separation, bundled PNGs,
empty sandbox/CSP, clipboard and download errors, pending-result clearing, and
provider failures without fallback output. Export actions made no delivery calls.
Screenshots and exported HTML are in `/tmp/resume-tailor-browser/`.

The final controlled harness copies the built Functions runtime into an isolated
temporary Functions package and writes a synthetic test environment only there.
It does not read or rewrite the real `.env.*` files. Model fixtures are injected
only into that temporary bundle; the generated guard requires the Functions
emulator. Cleanup removes the temporary package instead of restoring credential
files. Inherited credentials are omitted from the Firebase child environment.
The real environment files and consolidated profile were checked against their
pre-run SHA-256 hashes and remained unchanged. Ordinary requests still exercise
the missing-provider path, while fixture markers exercise controlled success and
failure paths. The real packaged bundle retains no fixture import.

Existing inbox template customization is checked separately through the existing
mail browser suite. Its first run passed template customization at both widths,
then timed out on a later desktop label checkbox while another build ran. The
isolated rerun passed at both 375px and 1440px, including editing HTML without
applying the template first, preserving custom content, autosaving/reopening the
draft, keeping the base template unchanged, and fixture delivery. See
[inbox results](inbox-browser-results.json). This does not constitute live
mail-provider or external-delivery evidence.

## Real-provider quality acceptance

Task 6.3 passed after the user rotated the expired key. The explicit five-case
provider-evaluation approval remains recorded in this conversation. The final run
used OpenAI / `gpt-5.6-sol` with `functions/.env.local`, without changing either
real environment file or copying keys between files. The earlier `expired_secret_key`
blocker was resolved by the user's rotation.

Real output was reviewed for frontend, automation, synthetic React 18 versus React
19, ambiguous-posting, and weak-fit cases, against both delta specs and the supplied
candidate evidence. See [sanitized provider results](provider-evaluation-results.json)
for exact fictional job descriptions, contract outcomes, measured checks, and
case-by-case manual observations. Raw writing stays under
`/tmp/resume-tailor-provider/` and is not copied into public assets or source data.

| Case | Observed Job Fit score | Reviewed behavior |
| --- | ---: | --- |
| Frontend | 89 | React/TypeScript, workflow, testing, Firebase, and CMS emphasis; candid absence of accessibility evidence. |
| Automation | 96 | Zapier/DocuSign, training, reporting, and booking emphasis; no invented credential gaps. |
| React 18 → React 19 | 52 | Relevant React 18 retained without claiming React 19 or inserting résumé disclaimers; candid accessibility/testing uncertainty. |
| Ambiguous posting | 52 | Clarifies junior title versus enterprise architecture and 20-person management expectations without inventing leadership scope. |
| Weak clinical fit | 0 | No clinical credentials invented; résumé remains factual while fit identifies consequential missing medical qualifications. |

These are observed evidence-fit scores, not fixed expected scores or hiring probabilities.
The frontend technical letter had 238 words, two distinct supported examples, and
empty verification notes. Interview output retained five practice questions,
three STAR stories, three questions to ask, and assumed process stages. Study
output retained three priorities, four ordered five-hour weeks, deliverables,
measurable checks, and its self-assessment qualifier.

The first successful-provider pass exposed two writing issues, which were fixed
and re-evaluated: unnecessary metric/feedback requests after complete qualitative
STAR outcomes, and invented unstated credential/scale gaps in fit output. The
final prompts explicitly prevent those patterns. Focused rechecks covered all
five fit cases and the frontend interview output. The initial frontend fit call
had one connection failure; the explicit recheck succeeded. There were 19 calls
including focused rechecks, yielding 13 final validated and manually reviewed
results. None of these retries happened automatically in the application runtime.

Mechanical checks on all five real résumés confirmed source-owned identity,
contacts, education, employers, role titles and dates, renderable HTML/text,
review-note exclusion, and the React-version boundary. Prose was manually reviewed
against the selected source roles/projects. Valid references and finite-case
review do not guarantee semantic correctness of future writing; owner review
remains necessary.

Reproduce all cases, or run selected rechecks after a full run:

```sh
node --env-file=functions/.env.local --experimental-strip-types scripts/evaluate-career-writing.mjs
node --env-file=functions/.env.local --experimental-strip-types scripts/evaluate-career-writing.mjs --only frontend:fit,frontend:interview,automation:fit,adjacent-version:fit,ambiguous-posting:fit,weak-fit:fit
```

Final `npm run preflight` passed again after the prompt and isolated-harness
changes: 79 unit tests, lint, TypeScript, 6 Pages checks, 4 Firebase packaging
checks, and default HTTP acceptance (14 passed, one fixture-only test skipped).
No deployment was performed.

## Job-description input follow-up

The shared form and all four protected career endpoints now accept nonblank job
descriptions up to 15,000 characters and reject 15,001. Tool JSON parsing allows
encoding overhead without changing the authentication request limit. The form
shows a 0.75rem, right-aligned character counter with no confidentiality warning.
Preflight passed again (79 unit tests, lint, TypeScript, 6 Pages checks, 4 Firebase
checks, and 14 HTTP checks with one fixture-only skip). HTTP acceptance covered
15,000-character plain and escaped descriptions on every tool. Controlled browser
acceptance passed at 375px and 1440px with a full 15,000-character submission, the
expected counter text, smaller font size, right alignment, and absent warning.
