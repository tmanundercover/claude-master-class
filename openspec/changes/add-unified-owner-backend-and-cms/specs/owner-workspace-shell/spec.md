# Spec Delta

## Purpose

Provide one compact owner application with persistent area navigation, contextual sidebars, and coherent working screens for correspondence, career preparation, content, and account administration.

## ADDED Requirements

### Requirement: Shared left navigation rail

The owner application SHALL display a left icon rail, a contextual sidebar, and a main pane. The rail SHALL list Mail, Saved Jobs, Résumé Intelligence, Workflows, Recorded Answers, CMS, Accounts, and Settings in that order. Selecting a destination MUST update its selected state, sidebar, main content, and applicable toolbar together.

#### Scenario: Switch from mail to another area
- **WHEN** the owner selects CMS from the inbox rail
- **THEN** CMS sections replace mail folders in the sidebar and CMS content occupies the main pane
- **AND** the rail remains available with CMS identified as selected

#### Scenario: Recorded answer destination
- **WHEN** the owner inspects the rail
- **THEN** Recorded Answers has a YouTube-style play icon with an accessible Recorded Answers label
- **AND** Accounts has its own people/accounts icon rather than appearing only inside Settings

### Requirement: Account and mailbox navigation placement

The shell SHALL keep an avatar and account dropdown above the left rail. Account actions SHALL remain available across owner areas. Mail-specific Contacts, Manage labels, and Mailbox settings SHALL appear below a horizontal divider in the Mail sidebar, preserving existing provider-backed behavior.

#### Scenario: Open mailbox tools
- **WHEN** the owner selects Contacts below the Mail sidebar divider
- **THEN** the main pane displays existing contact management while Mail remains the selected rail area
- **AND** the account dropdown still provides sign-out and access to the existing workspace and public portfolio

### Requirement: Existing mail behavior remains available

Mail SHALL retain existing folders, labels, search/filtering, pagination, conversation actions, draft composition, attachment handling, explicit sending, and visible loading/error states. Re-entering Mail MUST restore its selected folder, search, and conversation during the same application visit without discarding a composition.

#### Scenario: Return to a filtered inbox
- **WHEN** the owner opens a conversation from filtered mail, visits Saved Jobs, and returns to Mail
- **THEN** the folder, filters, and conversation are restored
- **AND** any open composition and its save status remain available

### Requirement: Saved jobs share application context

Saved Jobs SHALL present job selection in the sidebar and the selected job's materials in the main pane. Workflows and Saved Jobs MUST use the same job and saved artifacts, preserving Current/Previous comparison, revision, undo, notes, download status, and the application-email return flow.

#### Scenario: Resume the same job in a workflow
- **WHEN** the owner selects a saved job and opens Resume Tailor under Workflows
- **THEN** that job and its saved résumé are available without creating another workspace
- **AND** returning to Saved Jobs opens the same job and matching saved documents

### Requirement: Workflow sidebar and working screens

Workflows SHALL expose Job Fit, Resume Tailor, Cover Letter, Interview Prep, and Study Plan as separate sidebar entries. Each selected workflow SHALL show its explanation, applicable inputs/settings, and existing result interface in the main pane. Every workflow MUST remain independently accessible without a fit score or required sequence.

#### Scenario: Start a study plan directly
- **WHEN** the owner selects Study Plan without running Job Fit
- **THEN** the main pane explains the workflow and offers the job-description or saved-job input and weekly time budget
- **AND** generated output is saved as that job's Study Plan artifact

#### Scenario: Selected workflow remains identifiable after generation
- **WHEN** generation saves a document and opens its job workspace
- **THEN** the workflow and selected job remain identifiable in the shell and URL
- **AND** its result is the same artifact available through Saved Jobs

### Requirement: Résumé intelligence uses unified content

Résumé Intelligence SHALL put evidence search and category selection in its sidebar and matching records/details in its main pane. It MUST reflect the current persisted content and relationships without requiring a separate historical archive or presenting seed-file timestamps as the authority for live data.

#### Scenario: CMS correction reaches evidence search
- **WHEN** a skill relationship or experience is saved in CMS and the owner searches Résumé Intelligence
- **THEN** the corrected record and derived evidence are shown without maintaining a second copy
- **AND** any retained self-rating is described accurately rather than presented as a certification

### Requirement: Recorded answers preserve role access

Recorded Answers SHALL present question/category navigation in the sidebar and the selected recording and supporting content in the main pane for the owner. Existing recruiter/interviewer access to interview answers MUST remain usable without exposing the owner rail, private tools, CMS, Accounts, or mailbox resources.

#### Scenario: Guest follows an interview link
- **WHEN** an approved recruiter or interviewer opens an existing interview-answer URL
- **THEN** the authorized answer library remains accessible with its existing media protection
- **AND** owner administration and private application data are unavailable

### Requirement: Stable routes and deferred landing replacement

Existing private deep links and browser Back/Forward SHALL remain functional. `/dashboard` and the owner's post-login landing destination SHALL remain the current workspace overview in this change. URLs MUST identify selected destination, item, and workflow where applicable without exposing sensitive content.

#### Scenario: Reload a saved document link
- **WHEN** the owner reloads an existing job/document URL or opens it in a new tab
- **THEN** the matching job and document open inside the shell with an appropriate selected area
- **AND** application-email return references continue to reopen the intended draft

#### Scenario: Owner signs in during the transition
- **WHEN** the owner signs in without a protected return destination
- **THEN** `/dashboard` opens the existing overview with working links into the new shell
- **AND** this change does not replace that overview with an automatic inbox redirect

### Requirement: Safe navigation of unsaved work

Area or item navigation MUST preserve unsaved compositions, job descriptions, revision requests, CMS edits, and account edits, or explicitly offer staying, saving, or discarding before losing them. A failed save MUST keep entered values and MUST NOT display a saved state or proceed with a dependent handoff.

#### Scenario: Leave a failed CMS edit
- **WHEN** a CMS save fails and the owner selects another rail icon
- **THEN** the unsaved values remain available or navigation requires an explicit discard decision
- **AND** the failed values are not represented as persisted content

### Requirement: Compact accessible responsive presentation

All shell screens SHALL use consistent compact sidebars, toolbars, spacing, and content surfaces based on the current inbox. Icons MUST have accessible names, focus visibility, and selected-state indicators. Narrow layouts MUST retain all destinations and readable content without horizontal page overflow or inaccessible sidebar controls.

#### Scenario: Use the owner application on a phone
- **WHEN** the owner navigates all destinations at a 375-pixel viewport
- **THEN** the sidebar can collapse and every destination remains reachable by keyboard and touch
- **AND** the composer, document preview, comparison controls, and settings forms remain usable

#### Scenario: Read workflow help
- **WHEN** the owner opens a workflow in the compact layout
- **THEN** its short explanation appears in the main pane and detailed guidance is available on demand
- **AND** résumé previews preserve their document typography and export content
