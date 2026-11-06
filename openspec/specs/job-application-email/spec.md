# job-application-email Specification

## Purpose

Prepare editable application emails from a selected job workspace and its saved documents while retaining explicit document choices, recoverable drafts, and owner-controlled sending.

## Requirements

### Requirement: Workspace-selected application template

The composer SHALL offer a job-application template whose only template-specific input is job workspace selection. Applying it SHALL populate an editable subject referencing the candidate name, company, and role from that workspace, plus matching HTML and plain-text messages. Normal recipient fields SHALL remain available, without inferred or fabricated recipient addresses.

#### Scenario: Select a complete workspace
- **WHEN** the owner selects Acme / Senior Frontend Engineer and applies the application template
- **THEN** the subject identifies the candidate, Acme, and Senior Frontend Engineer
- **AND** the message refers to that opportunity while existing recipient choices are retained

#### Scenario: Incomplete identifying details
- **WHEN** the selected workspace lacks a company or role title
- **THEN** the composer exposes the missing detail for correction and uses honest neutral wording
- **AND** it does not fabricate company, role, or recipient information

### Requirement: Attachment-aware message generation

Applying the template SHALL attach the selected workspace's available current résumé and cover-letter PDFs and describe only the documents actually attached. Missing cover letters SHALL remain visible without requiring a cover letter to compose. Pending or failed PDF files MUST NOT be silently replaced with older revisions or described as attached.

#### Scenario: Both application documents are ready
- **WHEN** the selected workspace has a current résumé PDF and cover-letter PDF
- **THEN** both are attached and identified in the message
- **AND** each attachment matches the current revision selected when the template is applied

#### Scenario: Cover letter is unavailable
- **WHEN** a résumé PDF is available but no cover letter exists
- **THEN** the composer indicates the missing cover letter and prepares résumé-only copy
- **AND** the owner can continue without a fabricated cover letter or attachment claim

#### Scenario: Current PDF has failed
- **WHEN** a current document exists but its PDF is pending or failed
- **THEN** the composer displays that status and supports retry or an explicit decision to proceed without it
- **AND** an earlier revision's PDF is not attached as though it were current

### Requirement: Explicit missing-tailored-résumé choice

If a selected workspace has no tailored résumé, the composer MUST warn and offer Use standard résumé or Create tailored résumé. It MUST NOT silently substitute a standard résumé or create a new workspace for tailoring. Selecting the standard résumé SHALL use the same standard document offered on the public profile.

#### Scenario: Owner chooses the standard résumé
- **WHEN** the warning is shown and the owner selects Use standard résumé
- **THEN** the standard résumé PDF is attached and identified as the standard version
- **AND** the message accurately describes the resulting attachment set

#### Scenario: Owner chooses tailoring
- **WHEN** the owner selects Create tailored résumé
- **THEN** the owner is taken to résumé tailoring in the selected workspace dashboard with its job description loaded
- **AND** the email draft and a way to return are preserved

### Requirement: Durable tailoring round trip

Before navigating from the composer to tailoring, the system MUST save the draft and its workspace association. A failed save MUST retain the composer and report the failure. Returning SHALL reopen that draft and allow the newly available résumé to be attached without losing recipients, manual copy edits, or unrelated attachments.

#### Scenario: Tailor and return
- **WHEN** the owner saves a tailored résumé and returns to the application email
- **THEN** the same draft reopens with its recipients and edits intact
- **AND** the owner can add the completed PDF without regenerating or replacing the whole message

#### Scenario: Draft save fails before navigation
- **WHEN** the provider cannot save the email draft
- **THEN** automatic navigation to tailoring does not occur
- **AND** the unsaved composition remains available for retry or copying

#### Scenario: Tailoring starts from a new composer
- **WHEN** the owner chooses Create tailored résumé before entering message content
- **THEN** the application saves a useful draft identified by the selected opportunity before navigating
- **AND** its initial copy does not claim that an unavailable document is attached

### Requirement: Stable document snapshots in drafts

Each prepared application draft SHALL retain its selected workspace, attachment snapshots, and source content identities. Revise, Start over, undo, or retirement of a workspace's older versions MUST NOT change saved draft or sent-message attachments or copy. The owner SHALL explicitly refresh draft documents, with managed and manually attached files distinguishable.

#### Scenario: Résumé regenerated after drafting
- **WHEN** a new résumé revision becomes current after an application draft was prepared
- **THEN** reopening the draft retains the original attached résumé and identifies its revision
- **AND** the owner can explicitly replace it with the newer PDF

#### Scenario: Attached source leaves the undo pair
- **WHEN** an attached résumé version leaves its workspace's Current/Previous pair
- **THEN** saved draft and sent-message attachment bytes remain available through the mail record
- **AND** reopening the email does not require resurrecting that version into the workspace or retaining full artifact history

#### Scenario: Refresh a prepared application
- **WHEN** the owner explicitly refreshes workspace attachments
- **THEN** only the managed workspace documents are replaced
- **AND** manually attached files and edited message text are preserved unless the owner explicitly reapplies the template

### Requirement: Native drafts and explicit sending

Workspace-based composition MUST preserve existing native draft autosave, editing, attachment limits, failure reporting, and send idempotency. Template selection, PDF generation, and return from tailoring MUST NOT send mail. Unsupported or oversized attachment sets MUST fail visibly without losing the draft.

#### Scenario: Preview and prepare without sending
- **WHEN** the owner selects a workspace, applies the template, or returns from tailoring
- **THEN** the message remains an editable draft until Send message is explicitly activated

#### Scenario: Attachment set exceeds limits
- **WHEN** generated PDFs plus manually attached files exceed the supported attachment limits
- **THEN** the composer explains the problem and retains the existing draft and files
- **AND** it does not silently omit documents or send a partial message

### Requirement: Private server-resolved document attachment

The server MUST authorize the selected workspace and revision before loading document bytes or preparing attachments. The application template MUST NOT accept arbitrary storage paths or remote URLs as document selectors. Private application records and document associations MUST remain outside public exports and logs.

#### Scenario: Forged attachment selection
- **WHEN** a request supplies another workspace's revision, a storage path, or a remote URL instead of an authorized document selection
- **THEN** attachment preparation is rejected before fetching the requested file or changing a draft
