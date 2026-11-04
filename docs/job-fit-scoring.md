# Job Fit scoring

The model extracts job criteria and judges their support in approved profile evidence. The application calculates the score. This replaces the previous model-assigned score, matches, and gaps contract; the other career tools retain their contracts.

| Category | Base weight |
| --- | ---: |
| Required technical qualifications | 70% |
| Relevant responsibilities and seniority | 20% |
| Preferred qualifications | 10% |

Each distinct, independently assessable criterion receives one classification:

| Classification | Credit | Evidence |
| --- | ---: | --- |
| Supported | 1 | Relevant approved profile reference required |
| Partially supported | 0.5 | Relevant reference and explanation of the remaining uncertainty required |
| Unsupported evidence | 0 | No support found; this does not establish a missing skill |

Criteria carry equal weight within their category. Repeated criteria must be deduplicated rather than counted again. Optional criteria belong only to the preferred category. Mandatory technical practices, domain qualifications, and credentials belong to required technical qualifications; duties, scope, and experience or seniority expectations belong to responsibilities and seniority.

For each populated category, calculate `credit = sum(requirement credits) / requirement count`. The total is `round(100 × sum(base weight × category credit) / sum(populated base weights))`. Category figures and contributions display two decimals; the final total rounds once from the unrounded weighted sum. Repeating the same validated classifications produces the same score.

A category with no stated criteria is marked **Not stated**, has zero applied weight, and receives no free points. Remaining weights are normalized. For example, required technical criteria with full support and preferred criteria with no support produce `70 / (70 + 10) × 100 = 87.5`, displayed as **88**. With no scored criteria, `score` is `null` and the UI explains that no technical score is available.

Location, geographic eligibility, relocation, travel, and remote/hybrid/on-site arrangements are assessed separately and never change the numerical score. Logistics use **Compatible**, **Conflict**, **Needs confirmation**, or **Not stated**. A current city alone does not establish unwillingness to relocate. Missing preferences or eligibility evidence require confirmation rather than an assumed conflict.

The model receives readable summaries, bullets, skills, tags, education, location, and the profile summary with source IDs. Internal project notes are excluded. Supported and partial requirements must cite existing IDs; the server resolves those IDs to approved labels and source text. Every requirement includes an exact posting excerpt, validated after whitespace normalization. Unknown references, unsupported positive claims without references, duplicate requirement labels, invented posting quotes, unexpected fields, and provider-supplied scores fail validation. Source-ID and quote checks establish traceability; semantic relevance and extraction completeness remain model judgments for the user to review.

The response includes `version: 2`, `score`, `summary`, `requirements`, `breakdown`, `location`, `workArrangement`, and exactly three `nextActions`. The client validates this envelope and recalculates the score and breakdown before display. Provider errors, invalid output, or mismatched arithmetic show an error without a fabricated score. A new submission clears the previous analysis while pending.

The UI shows category weights, applied weights, requirement counts, category fit, score contributions, all requirement classifications, posting excerpts, and expandable profile sources. Location and work-arrangement assessments appear separately. Scores do not restrict access to the other tools.

Validation uses unit tests for arithmetic and evidence rules, the normal preflight suite, and `node scripts/test-firebase-emulator.mjs --model-fixtures --browser-script scripts/test-fit-analyzer-browser.mjs` for authenticated desktop/mobile flows. These controlled fixtures do not call a provider; they do not establish live model output quality.
