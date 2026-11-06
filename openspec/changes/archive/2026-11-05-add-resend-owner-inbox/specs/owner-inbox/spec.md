# Spec Delta

## Purpose

Give the portfolio owner a private email workspace for managing correspondence through a dedicated Resend inbox, with reliable dashboard statistics and existing role boundaries.

## ADDED Requirements

### Requirement: Owner-only mailbox access
The system SHALL restrict inbox pages, statistics, messages, contacts, settings, drafts, and attachments to authenticated sessions with the `terrell` role. Every private mail response MUST prevent shared caching and disclose no mailbox data when access is denied.

#### Scenario: Owner opens the inbox
- **WHEN** Terrell opens `/dashboard/inbox` with a valid owner session
- **THEN** the private email workspace is available for the configured inbox

#### Scenario: Guest or invalid session requests mail
- **WHEN** a recruiter, interviewer, unauthenticated user, or revoked session requests an inbox page, API resource, or attachment
- **THEN** the request is denied through the appropriate page redirect or API authorization response
- **AND** no mailbox content, credentials, or attachment bytes are returned

### Requirement: Dashboard entry and existing tools
The owner dashboard SHALL provide a full-width inbox entry card and remove exercise-number badges and exercise-oriented action labels. Existing career tools, résumé evidence, and interview-answer links MUST remain accessible.

#### Scenario: Terrell enters the owner workspace
- **WHEN** the owner dashboard is displayed
- **THEN** the inbox card spans the dashboard content width and opens the email workspace
- **AND** existing tools retain functional links without `Exercise 1–4` badges

### Requirement: Provider-backed summary
The inbox entry SHALL show unread threads, unsent drafts, last received time, and recent conversations from the configured provider inbox. Loading, empty, unavailable, and stale states MUST be distinguishable; a provider failure MUST NOT become fabricated zero counts or successful delivery.

#### Scenario: Summary is available
- **WHEN** the provider returns the inbox summary and recent threads
- **THEN** the card shows the returned unread and draft counts, latest receipt time, and conversation previews
- **AND** absent receipt history is described as an empty state

#### Scenario: Provider is unavailable
- **WHEN** configuration is incomplete or the provider request fails
- **THEN** the card reports an actionable unavailable state while the remaining owner dashboard remains usable

### Requirement: Configured mailbox identity
The workspace SHALL send and receive using `terrell.singleton@thehandsomestnerd.com`. The backend MUST bind requests to its configured inbox and sender identity, independently of client-supplied inbox identifiers. Existing Firebase login identities MUST remain unchanged.

#### Scenario: Client attempts to select another inbox
- **WHEN** a request supplies an inbox or sender identity outside the configured mailbox
- **THEN** the request is rejected without accessing or sending from that other identity

### Requirement: Conversation reading and organization
The owner SHALL be able to list conversations in Inbox, Sent, Archive, Spam, and Trash; read their ordered messages; mark threads read or unread; and move or restore threads using supported folder actions. These changes MUST persist in the provider and refresh relevant summaries.

#### Scenario: Owner reads and archives a conversation
- **WHEN** the owner opens a thread, marks it read, and archives it
- **THEN** its messages are readable in conversation order, its read state persists, and it appears in Archive
- **AND** the unread summary reflects the provider's resulting state

#### Scenario: Owner restores a trashed conversation
- **WHEN** the owner restores a thread from Trash to Inbox
- **THEN** the thread is available in Inbox and is no longer pending trash deletion

### Requirement: Compose and reliable sending
The owner SHALL be able to compose and explicitly send email with recipients, subject, text or rich content, CC, and BCC. A retry of the same send attempt MUST NOT create a second outbound message. Failed or uncertain attempts MUST retain recoverable content and disclose their status.

#### Scenario: Owner sends a message
- **WHEN** the owner submits a valid composition using Send
- **THEN** the provider accepts one outbound message from the configured mailbox
- **AND** its conversation is accessible through the mailbox's sent/conversation views

#### Scenario: A send response is interrupted
- **WHEN** the same send attempt is retried after a timeout or lost response
- **THEN** the attempt retains its idempotency identity and does not send a duplicate
- **AND** a genuinely new send requires a new attempt identity

### Requirement: Persistent drafts
The owner SHALL be able to create, autosave, reopen, edit, discard, and send drafts stored by the provider. The UI MUST distinguish unsaved, saving, saved, and failed states and preserve unsaved work across failed saves or expired sessions.

#### Scenario: Owner resumes a draft
- **WHEN** the owner saves a draft, leaves the composer, and later reopens it
- **THEN** the saved recipients, subject, message content, and supported attachments are restored

#### Scenario: Draft autosave fails
- **WHEN** the provider rejects or cannot complete an autosave
- **THEN** the composer retains the unsaved text and reports that it has not been saved
- **AND** no success indicator or automatic send is produced

### Requirement: Threaded replies and forwarding
The owner SHALL be able to reply, reply-all, and forward messages with editable content and supported CC/BCC and attachments. Replies MUST preserve the original conversation's relationship and correct recipient semantics; forwarding MUST use the owner-selected recipients.

#### Scenario: Owner replies to incoming mail
- **WHEN** the owner sends a reply or reply-all from a conversation
- **THEN** the reply uses the message's applicable reply address and reply-all recipients
- **AND** subsequent correspondence remains associated with the conversation

#### Scenario: Owner forwards a message
- **WHEN** the owner forwards a message to explicitly selected recipients
- **THEN** the provider sends the forwarded content to those recipients without silently adding unrelated recipients

### Requirement: Attachment handling and safe message rendering
The owner SHALL be able to attach permitted files and download received attachments. The UI MUST explain attachment limits and errors. Reading a message MUST NOT execute its scripts, submit its forms, or automatically load tracking images; private attachment access MUST require owner authorization.

#### Scenario: Owner handles an attachment
- **WHEN** a permitted attachment is sent or an authorized received attachment is downloaded
- **THEN** the file is handled with its name and size and without publishing it as a public site asset

#### Scenario: Message includes active content or an oversized file
- **WHEN** a message includes active HTML, remote tracking images, or a file exceeds the application's published limits
- **THEN** active content remains inert, remote images require an explicit load action, and oversized uploads fail visibly without losing the composition

### Requirement: Search and filtering with pagination
The owner SHALL be able to search message text and filter conversations by participants, date range, attachment presence, folder, labels, and read state. Results MUST preserve supported filter combinations, pagination, and visible loading/error states without implying that a partial page is the entire result set.

#### Scenario: Owner searches correspondence
- **WHEN** the owner searches a phrase and filters by sender, unread state, and date range
- **THEN** the workspace displays provider results matching those criteria and makes additional pages available

#### Scenario: Owner changes filters during a request
- **WHEN** filters change while an older search is pending
- **THEN** the final displayed results correspond to the current filters rather than the older request

### Requirement: Labels
The owner SHALL be able to create, rename, recolor, and delete inbox labels and add or remove them from threads. Label changes MUST persist in the configured inbox and be reflected in its filters and conversation views.

#### Scenario: Owner tags a conversation
- **WHEN** the owner creates a label and applies it to a thread
- **THEN** the label appears on the thread and selecting its filter finds that conversation

### Requirement: Contacts and recipient selection
The workspace SHALL provide provider-backed contacts with names and email addresses, explicit add/edit/delete actions, pagination, and recipient suggestions. Contact deletion MUST be separate from deleting a conversation. Receiving contact-form mail MUST NOT silently subscribe its sender to marketing or create contact records.

#### Scenario: Owner composes to a saved contact
- **WHEN** the owner selects a stored contact in the recipient picker
- **THEN** the contact's email address populates the chosen recipient field
- **AND** editing that contact remains a distinct action from sending email

#### Scenario: Owner removes a conversation
- **WHEN** a conversation is moved to Trash or removed by the provider
- **THEN** its participants' contact records and subscription preferences are not automatically deleted or changed

### Requirement: Inbox and agent settings
The owner SHALL be able to view and edit supported inbox display/from-name settings and provider agent instructions, tone, and allowed actions. Autonomous actions MUST start disabled; changing or enabling them MUST require an explicit owner save. Unsupported controls MUST disclose their unavailability.

#### Scenario: Inbox is first configured
- **WHEN** the workspace is provisioned for the owner mailbox
- **THEN** no autonomous reply or other autonomous mailbox action is enabled by the application
- **AND** the settings screen accurately reflects the provider's saved configuration

### Requirement: Refresh and signed inbox events
The workspace SHALL refresh provider state after mutations, when it regains focus, and periodically while visible. Inbox event callbacks MUST verify the provider signature against the original request body, accept only the configured mailbox, and tolerate retries without producing duplicate messages or contacts.

#### Scenario: Mail arrives while the workspace is open
- **WHEN** the provider receives new mail during an active inbox session
- **THEN** a subsequent automatic refresh displays the conversation and updates the unread summary without a full-page reload

#### Scenario: An event is forged or repeated
- **WHEN** a callback has an invalid signature, targets another mailbox, or repeats a prior valid event
- **THEN** invalid events are rejected and repeated valid events cause no additional email, draft, or contact creation

### Requirement: Private state and explicit service modes
Mailbox content and credentials MUST remain outside public pages, public search data, static exports, assets, and logs. Local emulator fixtures MUST be identified as local data and send no real mail. A production service MUST fail visibly rather than silently switching to fixtures.

#### Scenario: Public or static output is built
- **WHEN** the portfolio or GitHub Pages export is generated
- **THEN** it contains no private mailbox records, bodies, attachments, or Resend credentials
- **AND** the static inbox route explains its availability through the dynamic application

#### Scenario: Local mail is exercised
- **WHEN** the application runs with its explicit fixture adapter in the Firebase emulators
- **THEN** email operations use deterministic local records and perform no live provider sends
- **AND** fixture acceptance is not reported as verified live delivery
