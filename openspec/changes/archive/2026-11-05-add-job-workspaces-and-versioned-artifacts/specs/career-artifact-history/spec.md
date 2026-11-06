# Spec Delta

## Purpose

Preserve career-tool work as retrievable Current and Previous documents, with contextual revision, fresh generation, comparison, and one-step undo in the same job workspace.

## ADDED Requirements

### Requirement: Durable typed artifacts

The system SHALL save each validated Job Fit, tailored résumé, Cover Letter, Interview Prep, and Study Plan result as structured content and Markdown in its job workspace. Each artifact SHALL retain Current and at most one Previous version. Review notes and evidence labels MUST remain separate from application-document content.

#### Scenario: Tool result survives navigation
- **WHEN** the owner generates an artifact and the system reports it saved
- **THEN** reloading or reopening retrieves the same structured content and Markdown
- **AND** its revision, creation time, and source job description remain identifiable

#### Scenario: Distinct preparation modes
- **WHEN** the owner generates Interview Prep followed by Study Plan for one workspace
- **THEN** both artifacts remain independently retrievable with their own Current/Previous pair

#### Scenario: Replace an artifact repeatedly
- **WHEN** V1 is replaced successfully by V2 and then V3
- **THEN** Current is V3 and Previous is V2
- **AND** V1 is outside the workspace's retrievable artifact versions and there is no full-history browser

### Requirement: Durable generation provenance

Each retained version MUST identify its generation mode, job-description version, base artifact reference when applicable, change message when present, generation settings, tool-prompt version, candidate-evidence version, and provider/model. The owner SHALL be able to inspect its request context without exposing credentials or raw private source notes.

#### Scenario: Inspect a revised cover letter
- **WHEN** the owner opens a cover-letter revision generated with a conversational tone and a change request
- **THEN** its request context and description version can be retrieved alongside its content
- **AND** secrets and the raw private evidence catalog are not returned as provenance

### Requirement: Revise using the current artifact

Revise SHALL require a requested-change message and use the current saved artifact, the workspace's current job description, approved candidate evidence, current tool instructions, and applicable settings. These inputs MUST remain distinguished from system instructions. Successful revision MUST replace the artifact within the same workspace.

#### Scenario: Request a focused revision
- **WHEN** the owner asks to shorten the current cover letter and emphasize a documented project
- **THEN** the generation request includes the current letter, change message, job description, and supporting evidence
- **AND** the saved result retains the tool's content and factual validation rules

### Requirement: Start over without the current artifact

Start over SHALL generate from the workspace's current job description, approved candidate evidence, current tool instructions, and applicable settings. It MUST exclude existing artifact content and previous change messages from model input. Success SHALL replace Current in the same workspace, retaining the former Current as Previous without creating another workspace.

#### Scenario: Existing output is poor
- **WHEN** the owner selects Start over on an existing cover letter
- **THEN** the model receives the job description, approved evidence, current tool instructions, and settings without the existing letter or its old change messages
- **AND** a successfully saved replacement stays in that job workspace with the former letter available for undo

#### Scenario: Tool instructions changed
- **WHEN** the configured tool prompt has changed since the saved artifact was generated and the owner selects Start over
- **THEN** generation uses the current prompt and records its version
- **AND** initial generation remains accessible without any previous artifact or fit assessment

#### Scenario: Injected instructions
- **WHEN** an input to Revise or Start over includes commands to expose credentials or invent qualifications
- **THEN** those inputs cannot override system factual or private-data boundaries

### Requirement: Safe replacement and concurrency

A generated version SHALL replace Current and move the former Current to Previous only after validated content and Markdown are durably saved. Generation, validation, saving, or session failures MUST preserve both retained versions. Stale concurrent requests MUST NOT overwrite a newer artifact or description, or create additional retained versions.

#### Scenario: Failed replacement
- **WHEN** Revise, Start over, or document saving fails
- **THEN** the existing Current and Previous artifacts remain available and unchanged
- **AND** the interface reports the actual failure without claiming the replacement was saved

#### Scenario: Concurrent revisions
- **WHEN** two requests begin from the same current revision and the first finishes saving
- **THEN** the second receives an explicit conflict without replacing either retained version
- **AND** it does not become a third saved artifact or a hidden history entry

#### Scenario: Lost success response
- **WHEN** the owner retries a completed attempt whose saved response was lost
- **THEN** the system returns its version if still retained, or an explicit no-longer-retained outcome if it has left the pair
- **AND** it does not create another version, resurrect an older document, or rerun the completed generation

### Requirement: Side-by-side evaluation

The owner SHALL be able to compare only Current and Previous side by side with clear labels, change highlighting, and an optional synchronized-scrolling control. A narrow viewport SHALL provide accessible version switching without horizontal page overflow. Comparison MUST remain usable when the documents differ in length or sections.

#### Scenario: Review a replacement
- **WHEN** a replacement produced by Revise or Start over becomes Current
- **THEN** the owner can read Previous and Current versions and inspect their changes
- **AND** synchronized scrolling can be toggled without trapping independent navigation

#### Scenario: Compare on a phone
- **WHEN** the viewport cannot accommodate two readable columns
- **THEN** the owner can switch between the same two revisions with clear labels and preserved reading context

### Requirement: Undo swaps the retained pair

Undo SHALL durably swap Current and Previous without generating content, creating another version, or changing existing email attachments. The same pair SHALL remain available for switching back, with matching PDFs, across reloads. When Previous does not exist, undo and comparison MUST be unavailable. Arbitrary older-version restoration SHALL NOT be offered.

#### Scenario: Reject the latest wording
- **WHEN** the owner selects Undo replacement after regeneration
- **THEN** Previous becomes Current with its matching available PDF and the replaced document becomes Previous
- **AND** the same pair remains available after reloading and can be swapped back without another model call

### Requirement: Bounded artifact retention preserves email snapshots

When replacement displaces an older Previous version, the system SHALL retire its workspace content and associated files rather than retain full artifact history. Retiring workspace versions MUST NOT alter documents already attached to saved email drafts or sent messages. Temporary generation files MUST NOT become additional browsable versions.

#### Scenario: Retire an attached older version
- **WHEN** V1 leaves the Current/Previous pair after V3 is saved, and V1's PDF was attached to an application email
- **THEN** V1 is unavailable as a workspace artifact but the email retains its exact attachment snapshot
- **AND** refreshing that email's documents remains an explicit owner action

### Requirement: Saved personal interview notes

Interview notes entered by the owner SHALL be durably saved in the workspace with visible saving, saved, and failed states. The system MUST preserve notes across artifact regeneration and MUST NOT send them to the model or include them in exported documents or email attachments unless a later explicitly authorized feature provides that behavior.

#### Scenario: Return to practice notes
- **WHEN** the owner writes interview notes, waits for Saved, and returns later
- **THEN** the notes are restored separately from generated talking points

#### Scenario: Notes save or regeneration fails
- **WHEN** saving notes fails or Interview Prep is regenerated
- **THEN** entered notes remain available without being cleared by generation
- **AND** failures are visible and saved notes are not silently overwritten by an older client
