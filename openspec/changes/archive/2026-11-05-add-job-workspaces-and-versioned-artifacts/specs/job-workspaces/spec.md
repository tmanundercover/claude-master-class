# Spec Delta

## Purpose

Organize the owner's job preparation around durable job-description workspaces that identify each opportunity and retrieve its saved documents.

## ADDED Requirements

### Requirement: Job-description-led creation

The system SHALL create and durably save one workspace for a new job before first generating an artifact from its valid job description. Existing jobs SHALL reuse their workspace. The system MUST NOT require blank-workspace creation, a workspace name, a fit assessment, or a tool sequence. Every job-description-based tool SHALL support this entry flow.

#### Scenario: Cover letter is the first action
- **WHEN** the owner submits a valid new job description through Cover Letter
- **THEN** the description and workspace are saved before the generation request
- **AND** the generated cover letter belongs to that workspace without requiring Job Fit first

#### Scenario: Validation or service failure
- **WHEN** a description is blank or exceeds the supported input limit
- **THEN** the system rejects it before creating a workspace or calling the model
- **WHEN** workspace saving fails
- **THEN** the system reports the failure and does not start artifact generation

#### Scenario: Generation fails after creation
- **WHEN** initial artifact generation fails after the workspace is saved
- **THEN** the owner can reopen the workspace with its job description intact and retry

### Requirement: Workspace identification

The workspace SHALL display company and role title extracted from the supplied description when supported, with optional location and requisition ID. The owner SHALL be able to correct identifying details. Missing or failed extraction MUST remain explicit and MUST NOT invent details or erase the saved description.

#### Scenario: Posting identifies a company and role
- **WHEN** the description names Acme and Senior Frontend Engineer
- **THEN** those details identify the workspace in its dashboard, lists, and email selection
- **AND** correcting a display detail preserves the workspace and artifact relationships

#### Scenario: Extraction is incomplete
- **WHEN** the posting omits the company or metadata extraction fails
- **THEN** the workspace remains accessible with an explicit unknown detail and an editable label
- **AND** metadata failure does not discard otherwise valid artifacts

### Requirement: Reuse without accidental merging

The system SHALL reuse the owner's existing job workspace for an identical saved description, without offering duplication or parallel artifact-variant workspaces. It MUST NOT merge distinct opportunities solely because company or role titles match. Retrying the same creation attempt MUST NOT create duplicate workspaces.

#### Scenario: Repeated posting
- **WHEN** the owner pastes a description already associated with a workspace
- **THEN** the system opens or offers to reopen that workspace instead of creating another
- **AND** Revise and Start over remain available there for improving poor output or using updated instructions

#### Scenario: Two similar opportunities
- **WHEN** two distinct job opportunities share a company and role title
- **THEN** each can retain its own workspace and Current/Previous artifact pairs
- **AND** a changed prompt or desired wording is handled inside the existing job workspace rather than treated as another job

#### Scenario: Creation response is lost
- **WHEN** the owner retries the same creation attempt after a response interruption
- **THEN** the original saved workspace is returned without creating another workspace

### Requirement: Durable workspace dashboard

The owner SHALL be able to list, open, and retrieve saved workspaces across page reloads, sign-ins, devices, and application restarts. Each workspace dashboard SHALL expose its saved description, identifying details, distinct artifacts, Current/Previous versions, and available document downloads.

#### Scenario: Return on another device
- **WHEN** the owner signs in on another device and opens a saved workspace
- **THEN** the saved job description and current artifacts are retrieved from durable storage
- **AND** Interview Prep and Study Plan appear as separate artifacts

### Requirement: Job-description provenance

The system MUST retain the description version used to generate each artifact. Editing a description SHALL preserve earlier versions and identify artifacts based on an earlier description. Description edits MUST NOT silently rewrite existing artifacts or alter previously prepared email attachments.

#### Scenario: Posting is updated
- **WHEN** the owner saves a changed job description in an existing workspace
- **THEN** a new description version becomes current
- **AND** older artifacts remain viewable with their earlier-description association and can be explicitly regenerated

### Requirement: Owner-authorized private access

Workspace descriptions, artifacts, notes, revisions, and private downloads MUST require the existing owner role and verified ownership. Private mutations MUST require same-origin authorization. These records MUST remain absent from public pages, public search, public assets, logs, and static exports.

#### Scenario: Unauthorized or unrelated identifier
- **WHEN** an unauthenticated caller, a non-owner role, or an owner requesting an unrelated workspace attempts private access
- **THEN** access is denied before loading documents or invoking a model
- **AND** guessing a workspace or revision identifier does not grant file access

#### Scenario: Public export
- **WHEN** the public portfolio or static export is built
- **THEN** no job workspace, private document, note, or revision is included
- **AND** the intentionally public standard résumé remains available independently

#### Scenario: Direct storage client access
- **WHEN** an unauthenticated or authenticated client attempts to read or write workspace records or private objects directly
- **THEN** the checked-in Firestore and Storage rules deny access
- **AND** owner access continues through the authorized server API, whose Admin SDK bypasses client rules

### Requirement: Local storage emulator acceptance

Local development and HTTP/browser acceptance SHALL use Auth, Hosting, Functions, Firestore, and Cloud Storage emulators. Storage emulator mode MUST explicitly require local endpoints and a demo project without falling back to cloud resources. Local acceptance SHALL exercise the real server SDK adapters and MUST NOT require cloud IAM provisioning. Deployed runtime access SHALL be verified separately during release.

#### Scenario: Restart and retrieve locally
- **WHEN** an application process restarts while the configured storage emulators retain synthetic workspace data
- **THEN** the server retrieves the same descriptions, Current/Previous versions, notes, and verified document bytes through the SDK adapters

#### Scenario: Incomplete local configuration
- **WHEN** emulator mode lacks either storage endpoint or specifies a nonlocal endpoint or non-demo project
- **THEN** workspace storage fails before invoking a model or contacting cloud resources
