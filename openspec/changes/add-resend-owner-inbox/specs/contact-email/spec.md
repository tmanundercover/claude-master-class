# Spec Delta

## Purpose

Let portfolio visitors send a contact message to the owner's configured email inbox and continue the resulting conversation through normal email replies with clear submission feedback.

## ADDED Requirements

### Requirement: Public message submission
The public contact form SHALL submit the visitor's name, email address, and message for delivery through Resend to `terrell.singleton@thehandsomestnerd.com`. Submission MUST NOT require a recruiter, interviewer, or owner account.

#### Scenario: Visitor submits a valid message
- **WHEN** a visitor submits a valid name, email address, and message
- **THEN** the backend requests delivery to the configured owner inbox
- **AND** the visitor receives feedback about that submission attempt without needing to sign in

### Requirement: Fixed delivery identity and reply address
The system MUST control the recipient and verified sender on the backend and use the validated visitor email as the reply address. Visitor input MUST NOT select arbitrary delivery recipients, impersonate a sender, inject mail headers, or change the configured inbox.

#### Scenario: Visitor includes routing fields
- **WHEN** a submission includes arbitrary recipient, sender, inbox, or header fields
- **THEN** those unsupported fields are rejected
- **AND** no email is sent using the supplied routing values

#### Scenario: Contact message reaches the inbox
- **WHEN** a valid contact message is received in the owner inbox
- **THEN** the visitor's name and message are readable and the visitor's validated email is available as the reply address
- **AND** the sender identity belongs to the site's configured verified domain

### Requirement: Bounded validation
The backend SHALL validate required fields, email syntax, input types, maximum lengths, request size, and same-origin submission rules before contacting the provider. Validation failures MUST explain what can be corrected and preserve the visitor's editable form values.

#### Scenario: Invalid or oversized input
- **WHEN** a submission is malformed, contains an invalid email, omits a required field, or exceeds a published limit
- **THEN** the request is rejected without a provider send
- **AND** the form retains the visitor's input and displays an appropriate error

### Requirement: Abuse resistance and duplicate prevention
Public submissions MUST apply bounded abuse controls and provider idempotency. Retrying the same submission attempt MUST preserve its identity and payload; changing the message MUST begin a new attempt. Abuse-control rejection MUST be explicit and MUST NOT cause a real email to be sent.

#### Scenario: Visitor retries an uncertain submission
- **WHEN** the provider accepted a message but the response was lost and the visitor retries the unchanged attempt
- **THEN** the backend uses the same idempotency identity and no duplicate email is produced

#### Scenario: Submission exceeds the public limit
- **WHEN** a sender exceeds the allowed submission rate or trips a form abuse check
- **THEN** the backend refuses delivery with an appropriate retry or validation response

### Requirement: Accurate submission feedback
The form SHALL distinguish sending, accepted, invalid, rate-limited, unavailable, and failed or uncertain attempts. Provider acceptance MUST NOT be described as confirmed inbox delivery. Success MUST NOT be displayed before acceptance, and errors MUST NOT clear unsent form content.

#### Scenario: Resend accepts the submission
- **WHEN** the provider returns a successful acceptance result
- **THEN** the form tells the visitor that the message was submitted for delivery
- **AND** that attempt's form state is reset only after acceptance

#### Scenario: Provider or configuration failure
- **WHEN** credentials, inbox setup, or sender configuration is missing, or the provider times out or rejects the request
- **THEN** the form reports the actionable failure or uncertainty and retains the message for retry
- **AND** it does not claim that email was delivered

### Requirement: Contact conversation continuity
Contact-form messages SHALL be readable in the owner inbox. A reply sent from that conversation MUST reach the visitor's reply address, and the visitor's subsequent reply MUST remain part of the same correspondence. Any separately generated delivery notice MUST NOT replace the visitor as the reply recipient.

#### Scenario: Visitor and owner exchange replies
- **WHEN** a visitor submits the form, Terrell replies from the inbox, and the visitor replies by email
- **THEN** the visitor receives Terrell's reply and the follow-up is available within the existing conversation
- **AND** the conversation does not become a self-addressed loop or an unrelated new exchange

### Requirement: Private correspondence and contact preferences
Public submission responses, public artifacts, public search, and application logs MUST NOT expose inbox contents, provider credentials, or unrelated visitor correspondence. Submitting the contact form MUST NOT implicitly enroll the visitor in marketing or modify contact subscriptions.

#### Scenario: Visitor receives a submission response
- **WHEN** the submission succeeds or fails
- **THEN** the response contains only the attempt's appropriate status and correction information
- **AND** it contains no private mail history, provider key, or subscription side effect

### Requirement: Explicit local and static behavior
Local fixture submissions SHALL be identifiable as local tests and MUST NOT send real email. A public-only static export without a configured delivery backend MUST describe the form's unavailability and MUST NOT imply successful delivery.

#### Scenario: Form is used with emulator fixtures
- **WHEN** a visitor submits the form in the explicit local fixture mode
- **THEN** a local contact conversation is available to the fixture owner inbox
- **AND** the form identifies the local result without claiming live delivery

#### Scenario: Static site has no delivery backend
- **WHEN** the form is displayed in the public-only static export without a configured backend
- **THEN** it explains that delivery is unavailable and prevents a misleading send-success flow
