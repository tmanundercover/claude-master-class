# Spec Delta

## Purpose

Let the portfolio owner approve guest identities and manage their sign-in methods and access directly in the application, while preserving Google-only owner access and effective revocation.

## ADDED Requirements

### Requirement: First-class owner account administration

Accounts SHALL be a top-level owner rail destination with searchable, paginated account selection in the sidebar and account details/actions in the main pane. The owner SHALL be able to add an approved email, manage its display name, recruiter/interviewer role and enabled sign-in methods, generate/reset its password, and remove its access without using the Firebase console.

#### Scenario: Approve a guest
- **WHEN** the owner adds a valid guest email and selects recruiter or interviewer access
- **THEN** the account is saved and appears in Accounts with its allowed login methods and access state
- **AND** ordinary account creation cannot grant owner, CMS, mailbox, or Accounts privileges

### Requirement: Managed email identity

An active approved email record SHALL be required for guest application access. Email comparisons MUST trim surrounding whitespace and compare case-insensitively without collapsing dots or plus aliases. Authentication MUST prove the identity associated with that record; an entered email, user-selected role, or client-supplied account ID MUST NOT grant access.

#### Scenario: Google email is not approved
- **WHEN** Google authenticates a user whose verified email has no active account record
- **THEN** no application session or protected content is issued
- **AND** existence of a Firebase Authentication user alone does not approve application access

#### Scenario: Similar addresses remain distinct
- **WHEN** an approved address differs from an authenticated address by dots or a plus suffix
- **THEN** the addresses are not treated as interchangeable approvals

### Requirement: One login with server-derived permissions

The login page SHALL offer Continue with Google and email/password without a role selector. The server SHALL derive the role and permitted destination from the authenticated account record, verify the allowed login method, and retain existing session protections and protected return navigation.

#### Scenario: Guest uses an allowed method
- **WHEN** an approved guest authenticates successfully with an enabled method
- **THEN** the server establishes the approved guest session and opens the interview library or an authorized return destination
- **AND** the guest cannot select owner access or return into an owner-only route

### Requirement: Google-only owner identity

Owner access MUST retain the existing owner UID, exact approved email, verified Google sign-in, and server-assigned owner role. The owner account MUST NOT offer password provisioning, password reset, guest-role editing, provider removal, or access removal through guest management. Other Google identities MUST NOT acquire owner access through account creation or custom client fields.

#### Scenario: Attempt owner password provisioning
- **WHEN** a request attempts to generate a password for the owner or authenticate that owner through a password token
- **THEN** it is rejected before provisioning or issuing an owner session
- **AND** the same restriction applies when verifying an existing cookie

#### Scenario: Owner signs in after migration
- **WHEN** the existing owner authenticates through the approved Google identity
- **THEN** the same UID accesses its existing saved jobs and private data
- **AND** no replacement owner account is created

### Requirement: Approved guest Google access

An approved guest with Google enabled SHALL be able to authenticate through Google using its verified approved email without the owner setting a password. The first approved login SHALL bind to the correct authentication identity. An identity conflict MUST require an explicit resolution rather than silently merging accounts or granting privileges.

#### Scenario: First approved Google visit
- **WHEN** a guest approved by email first uses Google sign-in
- **THEN** the matching approved account determines the guest role and binds the authenticated identity
- **AND** the guest needs no password from the owner

### Requirement: Individual generated passwords

The owner SHALL be able to generate or replace a strong unique password for an approved guest. The password SHALL be revealed only in that explicit action's response for copying, never stored as readable application content, included in logs, or retrievable later. Shared passwords and scheduled password rotation MUST NOT be used. Generating a password MUST NOT automatically send email.

#### Scenario: Provision a non-Google guest
- **WHEN** the owner generates a password for an approved guest
- **THEN** password login is provisioned for that guest and the resulting credential is shown for copying
- **AND** the owner can communicate it separately without automatic application mail

#### Scenario: Reset one guest password
- **WHEN** the owner replaces one guest's password
- **THEN** the old password stops authenticating that account and its prior sessions lose access
- **AND** other accounts' credentials and sessions remain usable

### Requirement: Multiple methods retain one identity

When both password and Google login are enabled for a guest, they SHALL resolve to one approved account and one authentication UID. Linking MUST verify control of the required credentials and MUST NOT trust a client-submitted email match alone. Method changes MUST NOT create duplicate guest identities or enable a disabled method indirectly.

#### Scenario: Existing password guest adds Google
- **WHEN** the approved guest completes the required authenticated linking for its enabled Google method
- **THEN** both methods resolve to the same guest account and permissions
- **AND** a linking conflict produces a recoverable error rather than a second application account

### Requirement: Removal revokes ongoing access

Removing an approved guest SHALL deny subsequent sign-ins and the next protected page, API, or media request from existing sessions, across application instances. Revocation MUST NOT wait for normal session expiry or rely on hiding navigation. Unavailable account authorization MUST fail closed rather than use stale approval or claims alone.

#### Scenario: Guest is already watching interview answers
- **WHEN** the owner removes that guest's email while the guest has a valid session
- **THEN** the next protected request, including a new media/range request, is denied
- **AND** Google reauthentication cannot regain access until the owner approves the email again

#### Scenario: Authentication cleanup fails
- **WHEN** removal is persisted but a provider session-cleanup operation fails
- **THEN** application access remains denied by the inactive approval record
- **AND** Accounts reports the cleanup issue separately without restoring approval

### Requirement: Reapproval cannot revive old sessions

Role changes, method changes, password resets, and removal/reapproval SHALL invalidate earlier application authorization for the affected account. Reapproving an email MUST require fresh authentication and MUST NOT reactivate a cookie issued under an earlier approval.

#### Scenario: Remove and reapprove the same email
- **WHEN** the owner removes a guest and later adds that email again
- **THEN** a cookie from before removal remains denied
- **AND** the guest must authenticate under the new approval and enabled methods

### Requirement: Safe retryable account provisioning

Account approval and credential operations MUST expose pending, completed, failed, or uncertain outcomes and support reconciliation without duplicate identities or unintended privilege changes. The application MUST NOT display a saved approval or usable generated credential until the required authorization state and provider operation are confirmed.

#### Scenario: Password provisioning response is lost
- **WHEN** an owner retries after an interrupted password-provisioning response
- **THEN** the operation reconciles the original identity without creating another account
- **AND** an unrecoverable plaintext credential requires an explicit new password generation instead of retrieving a saved plaintext copy

### Requirement: Existing guest migration

Existing explicitly assigned recruiter/interviewer accounts SHALL be imported into managed approval records with their UIDs, roles, and appropriate methods before the new gate is enabled. Unassigned authentication users MUST remain unapproved. Migration MUST preserve the owner identity and avoid resetting guest passwords or overwriting newer managed records.

#### Scenario: Migrate a current password guest
- **WHEN** an existing explicitly assigned guest is imported
- **THEN** its existing password and UID remain usable after a fresh login through the unified page
- **AND** unrelated authentication users receive no access by being present in the provider

### Requirement: Private server-enforced management

Accounts data and mutations SHALL require the owner session, same-origin mutation checks, bounded validation, and server-held administrative credentials. Guests MUST NOT list approvals or change roles, methods, or access. Direct client database access MUST remain denied; public exports MUST exclude accounts, credentials, and authorization records.

#### Scenario: Guest attempts to approve itself
- **WHEN** an unapproved user or approved guest calls account-management endpoints or writes account records directly
- **THEN** the operation is denied before administrative user mutation
- **AND** no account list, generated password, or privileged role is disclosed
