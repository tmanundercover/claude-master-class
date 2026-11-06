# Spec Delta

## Purpose

Make reusable portfolio and résumé content editable through the owner application and consistently available from one durable source to public pages, evidence views, documents, and career workflows.

## ADDED Requirements

### Requirement: Complete reusable content editing

CMS SHALL support creating, editing, ordering, and removing reusable content: profile/contact details, introductions and site copy, experiences and bullets, projects and links, skills and categories, dated evidence and relationships, education, and profile media. Singleton profile fields SHALL be editable without creating another profile. Account access and job-specific documents MUST remain in their own destinations.

#### Scenario: Edit résumé contacts
- **WHEN** the owner changes supported contact fields and saves
- **THEN** those values are durably stored and used by applicable public contact links and new résumé representations
- **AND** the login identity, configured mailbox sender, and provider credentials are not changed by that edit

#### Scenario: Manage a project and its relationships
- **WHEN** the owner creates or edits a project, its skill links, and related experiences
- **THEN** the project and links are retrievable through CMS and reflected consistently in the relevant site and evidence views
- **AND** the owner can order the project without creating another copy

### Requirement: Immediate durable saves

A successful CMS Save SHALL make the accepted content current immediately without draft or Publish steps, model calls, or application deployment. Save failures MUST retain entered values and the previously saved content. Stale concurrent edits MUST produce a visible conflict instead of silently overwriting newer content.

#### Scenario: Save and reopen on another device
- **WHEN** a content save succeeds and the owner opens that section on another device or after an application restart
- **THEN** the accepted values and order are restored from persisted storage
- **AND** subsequent dynamic requests use the new current content

#### Scenario: Another editor saves first
- **WHEN** an edit is submitted against an outdated revision
- **THEN** the save fails visibly with a reload/review path
- **AND** both the attempted values and the newer saved content are preserved

### Requirement: Unified starter-data migration

The system SHALL migrate approved consolidated profile data and useful historical starter data into one linked persisted content set before runtime cutover. Migration MUST preserve existing factual content and relationships, reconcile only justified duplicates, and be repeatable without duplicating records or overwriting later CMS edits. Starter files MUST cease to be runtime authorities after cutover.

#### Scenario: Historical data contains additional evidence
- **WHEN** migration encounters dated roles, projects, versions, or ratings absent from the consolidated profile
- **THEN** those useful facts remain editable in persisted records with accurately described origins
- **AND** uncertain matches remain distinct or require owner resolution rather than being silently merged

#### Scenario: Migration is retried after CMS use
- **WHEN** an interrupted migration is retried after an imported record has been edited
- **THEN** the retry resumes or reports a conflict without duplicating the record or replacing the owner's edit
- **AND** there is no continuing archive-editing or archive-sync requirement

### Requirement: Stable linked content identities

Content records and evidence relationships MUST retain stable identities when reordered or edited. Removing a referenced record MUST expose its dependencies and require explicit relationship cleanup or fail visibly. Current views MUST NOT show dangling relationships or silently attach evidence to a different record.

#### Scenario: Reorder experiences
- **WHEN** an experience is moved ahead of another experience
- **THEN** project links, skill relationships, evidence references, and recorded-answer experience links still identify the same records
- **AND** existing saved documents are not reinterpreted using the new list positions

#### Scenario: Delete a linked skill
- **WHEN** the owner removes a skill used by projects or experiences
- **THEN** the CMS explains the dependencies and applies explicitly accepted cleanup together or rejects the removal
- **AND** unrelated records and saved artifacts remain intact

### Requirement: Derived evidence follows current records

Résumé search, evidence categories, skill longevity, summaries, and counts SHALL derive from the current persisted records and their dated relationships. The historical starter archive MUST NOT remain a parallel truth. Self-ratings and incomplete dates MUST retain accurate meanings and MUST NOT become invented certifications or employment dates.

#### Scenario: Correct a dated experience
- **WHEN** the owner corrects dates or skill relationships for an experience and saves
- **THEN** affected longevity calculations and evidence search reflect that correction
- **AND** the system does not continue showing conflicting values from the former archive

### Requirement: Coherent content across consumers

Each public page, new standard résumé, newly applied résumé email template, and AI generation SHALL use a coherent saved content revision. Consumers MUST distinguish public presentation from private evidence. Generation MUST load the revision's actual readable facts on the server and record the content/evidence revision used.

#### Scenario: Edit during a generation request
- **WHEN** CMS content changes while an AI request is in progress
- **THEN** that request uses one consistent captured revision
- **AND** its saved result identifies that revision while a later request uses the updated content

#### Scenario: Private project support text
- **WHEN** a project has owner-only supporting evidence and public presentation fields
- **THEN** authorized generation can use approved evidence while public pages and assets expose only the public fields
- **AND** CMS validation cannot accidentally publish internal evidence by spreading whole records

### Requirement: Current public standard résumé

The dynamic application's public standard résumé download and new standard-résumé application attachments SHALL use the current saved public content without requiring a rebuild. A pending or failed refresh MUST be visible and MUST NOT label an older PDF as current. The system MUST preserve the established document design and public download location.

#### Scenario: Contact edit followed by PDF download
- **WHEN** a contact change is saved and a visitor requests the standard résumé
- **THEN** the PDF represents the current saved public content or reports that current rendering is unavailable
- **AND** an old build-time PDF does not mask the new version

### Requirement: Existing document snapshots remain stable

CMS changes MUST NOT silently rewrite saved job artifacts, their Current/Previous pairs, PDFs, personal notes, or draft/sent attachment snapshots. Existing documents SHALL remain readable with their recorded source revision even when live source records change or are removed. Updating a job document or attached copy SHALL remain an explicit owner action.

#### Scenario: Edit a project used in a sent résumé
- **WHEN** the owner changes or removes that project's live CMS record
- **THEN** the already saved résumé and sent attachment retain their original content and bytes
- **AND** a new generation can use current content without rewriting the old document

### Requirement: Public-only static snapshots

The optional static export SHALL consume an explicit public content snapshot and remain public-only. It MUST identify its snapshot revision, exclude private administration and evidence, and contain a matching standard résumé. Runtime CMS saves SHALL update the dynamic application immediately; an existing static export SHALL change only through an explicit rebuild/export.

#### Scenario: Build without cloud access
- **WHEN** the public export is built from its selected public snapshot
- **THEN** it requires no live account listing, private content fetch, or model/provider call
- **AND** the rendered pages and PDF agree on the public revision

### Requirement: Owner-authorized content operations

CMS reads and mutations SHALL require the existing owner identity and server authorization; mutations SHALL enforce same-origin checks and bounded validated input. Direct client access to persisted content and media MUST remain denied. Public access MUST use explicit projections or approved media/download endpoints without disclosing private fields.

#### Scenario: Guest attempts a content update
- **WHEN** an unauthenticated user or approved guest attempts to read CMS data or change public content
- **THEN** the operation is denied before private data loading or mutation
- **AND** direct database/object-store requests are denied independently of server authorization

### Requirement: Existing media editing is integrated

CMS SHALL provide the existing profile-photo upload, preview, validation, save status, and avatar refresh behavior within its profile/media section. Existing media access restrictions MUST remain effective; integration MUST NOT publish private recorded interview media.

#### Scenario: Update the profile photo
- **WHEN** the owner saves a supported photo through CMS
- **THEN** the saved portrait appears on the public portfolio and account avatars through the existing approved delivery path
- **AND** upload failures preserve the selected image and report the failure
