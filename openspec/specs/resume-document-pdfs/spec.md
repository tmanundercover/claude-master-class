# resume-document-pdfs Specification

## Purpose

Provide consistent résumé presentation and reliable PDF documents for saved career artifacts, including a public standard résumé and private tailored versions.

## Requirements

### Requirement: Consistent résumé document design

The standard résumé PDF, tailored résumé PDFs, and existing résumé email template SHALL share the established document design: typography, portfolio colors, contact presentation, skills column, and experience layout. Standalone PDFs MUST omit email introduction and sign-off text. Changes in selected content MUST preserve the shared visual identity.

#### Scenario: Compare standard PDF with email résumé
- **WHEN** the owner previews the existing résumé email and downloads the standard résumé PDF
- **THEN** both use the same approved résumé content and recognizable document styling
- **AND** pagination and print margins remain appropriate for the PDF format

#### Scenario: Tailored PDF
- **WHEN** a workspace résumé selects different supported experience and rewritten bullets
- **THEN** its PDF presents that content using the shared résumé design
- **AND** verification notes and source-reference metadata remain outside the application document

### Requirement: Automatic application-document PDFs

Saving a résumé or cover-letter revision SHALL automatically initiate PDF generation for that revision. The interface MUST distinguish a saved document from PDF readiness and expose download only for a completed matching PDF. A standard résumé PDF SHALL be produced from the approved public profile during public builds without a model request.

#### Scenario: Cover letter saved
- **WHEN** a new cover-letter revision is saved
- **THEN** PDF generation starts without requiring a separate owner action
- **AND** its PDF becomes downloadable when completed and saved

### Requirement: Optional PDFs for other artifacts

Job Fit, Interview Prep, and Study Plan SHALL offer an explicit Generate PDF action after their structured content and Markdown are saved. These artifacts MUST NOT automatically generate PDFs on creation or regeneration. Exported content MUST exclude private personal notes and internal review metadata.

#### Scenario: Export a study plan
- **WHEN** a study plan is generated
- **THEN** its Markdown is saved and PDF generation remains optional
- **WHEN** the owner chooses Generate PDF
- **THEN** a PDF of the selected saved revision is created and can be downloaded

### Requirement: Revision-bound PDF integrity

Every PDF MUST identify the exact content version it represents. Revise, Start over, and undo MUST select the matching version's PDF rather than relabeling an older file. Workspace PDFs SHALL follow Current/Previous retention; documents copied into saved email drafts or sent messages SHALL remain independent attachment snapshots.

#### Scenario: Replacement PDF is pending
- **WHEN** a new résumé revision becomes current while its PDF is pending
- **THEN** an older PDF is not offered as the new revision's PDF
- **AND** only the retained Previous version and its matching documents remain accessible for comparison and undo

#### Scenario: Undo a document replacement
- **WHEN** the owner swaps Current and Previous for a cover letter
- **THEN** its existing matching PDF is used if available without regenerating the text

#### Scenario: Older workspace PDF retires
- **WHEN** another successful replacement displaces the older Previous version
- **THEN** that older PDF retires with its workspace artifact rather than remaining in a PDF history browser
- **AND** existing email attachment snapshots remain unchanged

### Requirement: Recoverable PDF failures

A PDF generation or storage failure MUST preserve saved structured content and Markdown, show the PDF failure separately, and allow PDF retry without rerunning the model. A failed PDF MUST NOT be attached to email or presented as a complete download.

#### Scenario: PDF rendering fails
- **WHEN** a résumé revision saves successfully but PDF generation fails
- **THEN** the résumé remains retrievable and the PDF state reports failure
- **AND** retrying PDF creation uses that saved revision without another model call

### Requirement: Public standard résumé download

The public profile SHALL provide a subtle text link labeled Download résumé (PDF), accompanied by a download icon directly beneath the profile card. It MUST be keyboard accessible and download the standard résumé without signing in. The link and file SHALL work in Firebase Hosting and base-path-configured public static exports.

#### Scenario: Public visitor downloads the résumé
- **WHEN** an unauthenticated visitor activates the link beneath the profile card
- **THEN** a valid standard résumé PDF is downloaded with an appropriate filename
- **AND** the control has visible focus and remains usable on narrow screens

#### Scenario: Public build refresh
- **WHEN** the approved public profile changes and either supported public build runs
- **THEN** the build produces its standard PDF from the updated profile
- **AND** a missing or failed PDF build cannot silently publish a broken download

### Requirement: Public and private document separation

Only the standard résumé built from approved public profile data SHALL be intentionally published. Workspace PDFs and Markdown MUST retain owner authorization and remain outside public assets and exports. PDF generation MUST treat supplied text as content and MUST NOT load arbitrary job- or model-provided resources.

#### Scenario: Private tailored document requested
- **WHEN** an unauthorized visitor requests a workspace PDF or Markdown file
- **THEN** the file is not disclosed even if its workspace or revision ID is known

#### Scenario: Untrusted link or private sentinel
- **WHEN** generated content contains an arbitrary resource URL or private source notes are present in server evidence
- **THEN** PDF rendering does not fetch the arbitrary resource
- **AND** the public standard PDF contains no workspace data, private source notes, or provider configuration

### Requirement: Descriptive download and attachment names

PDF, Markdown and tailored HTML downloads and managed application attachments SHALL use lowercase descriptive filenames in candidate-position-company-document-type-year order, omitting unknown position/company labels. Public standard downloads SHALL use candidate-resume-year. Filenames MUST NOT include workspace or revision IDs, path characters or header-injection characters. The year for a saved artifact SHALL come from its creation date.

#### Scenario: Clover résumé
- **WHEN** James Terrell Singleton downloads a 2026 résumé for Fullstack Developer at Clover
- **THEN** the file is named `james-terrell-singleton-fullstack-developer-clover-resume-2026.pdf`
- **AND** equivalent Markdown, HTML and managed attachment names use the same descriptive labels

### Requirement: Tailored résumé supplementary sections

Tailored résumés SHALL retain their selected experience and main selected skills. When other public experience is omitted, the document SHALL include a Previous experience section stating that previous experience is available upon request. A separate Additional skills cloud SHALL contain the remaining approved skills not selected in the tailored résumé, without duplicates or invented skills. The shared HTML, plain-text, Markdown and PDF adapters SHALL preserve these sections.

#### Scenario: Focused résumé selects a subset
- **WHEN** tailoring selects fewer roles and skills than the approved catalog
- **THEN** selected roles remain the detailed experience
- **AND** the document includes the previous-experience availability statement and the unselected skills cloud

### Requirement: Full public résumé

The profile-card download SHALL include every approved public experience role and all its public bullets. Public projects SHALL use compact entries with links. Tailored résumés SHALL retain selected experience instead of inheriting the full public experience list.

#### Scenario: Download complete public experience
- **WHEN** a visitor downloads the standard résumé beneath the public profile card
- **THEN** all public experience summaries, dates, titles, organizations and bullets are present
- **AND** projects are compact entries with their approved links
