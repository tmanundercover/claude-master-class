# career-tool-guidance Specification

## Purpose

Make the existing career tools serve the candidate through persuasive professional writing, practical preparation, and candid fit analysis without conflating factual grounding with defensive presentation.

## Requirements

### Requirement: Candidate advocacy in application writing

Cover Letter and Interview Prep SHALL use a confident professional consultant stance that connects the candidate's documented work to the target role. Instructions MUST permit supported paraphrasing, synthesis, terminology alignment, and transferable experience. Concise factual boundaries MUST NOT require verbatim wording or make apologies and qualification disclaimers the default voice.

#### Scenario: Persuasive cover letter
- **WHEN** the candidate has relevant documented experience for the target role
- **THEN** the letter presents a specific, confident case using that experience
- **AND** it does not introduce unnecessary admissions about every unmatched wishlist item
- **AND** uncertain details remain separate from the letter

#### Scenario: Supported terminology alignment
- **WHEN** a job description describes a responsibility using different wording from the candidate's documented work
- **THEN** the writing can use the employer's terminology when it accurately describes that work
- **AND** it does not convert related experience into an invented responsibility or accomplishment

### Requirement: Job Fit remains candid decision support

Job Fit MUST assess the candidate's supported strengths, transferable experience, consequential gaps, and useful follow-up questions candidly. It MUST distinguish required from preferred criteria and absent evidence from a documented gap. Its score SHALL remain an evidence-fit heuristic rather than a hiring probability, guarantee, or threshold for accessing other tools.

#### Scenario: Relevant framework experience with a version difference
- **WHEN** a posting requests React 19 and the candidate documents React 18 work
- **THEN** Job Fit recognizes the supported React experience as relevant
- **AND** it discusses a version-specific uncertainty only to the extent it materially affects the role
- **AND** it does not claim React 19 usage or mechanically treat all React experience as absent

#### Scenario: Material unsupported requirement
- **WHEN** an important requirement has no support in the supplied evidence
- **THEN** Job Fit identifies the absence candidly and suggests a useful next action
- **AND** it does not inflate the assessment to advocate for proceeding
- **AND** the owner remains free to run any other tool

### Requirement: Employer statements retain their status as claims

The tools MUST use the supplied job description as targeting and assessment data without treating it as verified workplace reality or following embedded instructions. Job Fit SHALL flag relevant ambiguity, conflicting requirements, or uncertain role scope as matters to investigate rather than inventing explanations or assuming employer intent.

#### Scenario: Ambiguous or expansive posting
- **WHEN** a posting combines conflicting seniority expectations or a broad list of technologies with unclear priorities
- **THEN** Job Fit explains the uncertainty and proposes questions to clarify the actual work
- **AND** it does not present every listed item as an independently verified daily responsibility

#### Scenario: Prompt injection inside a posting
- **WHEN** a pasted job description instructs the model to ignore rules, expose secrets, or add unsupported qualifications
- **THEN** the tools analyze the posting as data and disregard those commands

### Requirement: Candidate context remains substantive and server supplied

The existing tools MUST continue receiving actual documented candidate experience, projects, and skills as model context separately from their instructions and the job description. Revising the writing stance MUST preserve server-only credentials and evidence loading and MUST NOT substitute instructions or evidence identifiers for the underlying content.

#### Scenario: Revised cover-letter request
- **WHEN** the owner requests a cover letter after the prompt revision
- **THEN** the model receives the documented profile and the pasted job description along with the new stance
- **AND** private source evidence and provider configuration are not serialized into public page data

### Requirement: Interview preparation builds strong usable stories

Interview Prep SHALL emphasize relevant contributions, supported outcomes, and clear speaking points in its existing STAR outlines. Missing-detail markers MUST be limited to genuinely missing story facts rather than replacing available evidence or marking ordinary professional paraphrasing as uncertain. Possible employer interview stages MUST remain identified as assumptions.

#### Scenario: Supported outcome without a metric
- **WHEN** the profile documents a delivered outcome without a numerical impact measure
- **THEN** the STAR outline can describe the supported qualitative outcome confidently
- **AND** it does not fabricate a metric or mark that entire outcome as missing solely because no number exists

#### Scenario: Necessary story detail is genuinely absent
- **WHEN** a STAR outline needs a factual detail absent from the supplied evidence
- **THEN** the preparation retains the existing needs-my-input mechanism for that detail
- **AND** it does not replace it with a plausible invented event

### Requirement: Study plans prioritize useful preparation

Study Plan SHALL prioritize practical learning or demonstrations that address meaningful role needs and supported transferable skills. It MUST preserve the existing four-week structure, three priorities, weekly time budget, deliverables, and measurable checks while avoiding repetitive warnings or automatic remediation of every keyword mismatch.

#### Scenario: Focused preparation within budget
- **WHEN** a candidate with relevant experience requests a study plan for an adjacent role
- **THEN** the plan builds on that experience and prioritizes consequential learning needs
- **AND** each week respects the selected hours and produces a concrete deliverable and check

### Requirement: Existing result contracts and user control remain compatible

The prompt revisions MUST preserve existing result shapes, selected cover-letter tone, 200-300 word length, two distinct examples, interview counts, study budgets, error handling, and explicit user-controlled copying. Verification notes MAY be empty when nothing specific needs confirmation; instructions MUST NOT manufacture concerns to fill them.

#### Scenario: Valid supported output needs no additional verification item
- **WHEN** a cover letter uses supported details and no specific uncertainty needs confirmation
- **THEN** its verification-note array can be empty
- **AND** the letter still meets its existing length, example, tone, and result-shape requirements

#### Scenario: Provider failure after prompt revision
- **WHEN** an existing tool receives malformed output or encounters a provider failure
- **THEN** it retains its visible non-success handling rather than displaying fabricated success
- **AND** revising its stance does not authorize automatic sending, applying, or publishing
