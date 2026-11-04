# resume-tailoring Specification

## Purpose

Help the portfolio owner create a persuasive, job-specific résumé from documented candidate experience and export it in the workspace's established HTML résumé style.

## Requirements

### Requirement: Independent owner access

The system SHALL provide Resume Tailor alongside the existing career tools and SHALL allow the owner to run it without completing Job Fit or meeting a score threshold. Access to the page and generation endpoint MUST retain the existing owner role boundary.

#### Scenario: Tailoring without an assessment
- **WHEN** the owner opens `/dashboard/resume-tailor` without previously running another tool
- **THEN** the owner can submit a job description and generate a tailored résumé
- **AND** the system does not request an assessment identifier or score

#### Scenario: Unauthorized generation
- **WHEN** a guest or signed-in non-owner calls `/api/resume-tailor`
- **THEN** the endpoint returns 401 for the guest or 403 for the non-owner before any model call

### Requirement: Actual candidate evidence reaches the model

The system MUST supply documented candidate experience, bullets, projects, and skills as readable model context alongside the target job description. The initial evidence source SHALL be the consolidated candidate profile. Evidence selection MUST retain the source identity and supporting details needed to rewrite relevant material.

#### Scenario: Relevant projects support an application
- **WHEN** a job description emphasizes work supported by a documented project and an employment role
- **THEN** the model receives the actual supporting details from both sources
- **AND** references alone or generic instructions do not substitute for candidate evidence

### Requirement: Professional rewriting for the target job

The system SHALL select relevant experience and rewrite résumé summaries, bullets, and project descriptions to emphasize the target job's priorities. It MUST allow supported terminology, transferable experience, and changes in emphasis rather than requiring source wording to be copied verbatim.

#### Scenario: Different jobs emphasize different work
- **WHEN** the same candidate requests résumés for a frontend role and an automation role
- **THEN** each résumé emphasizes the corresponding documented work through its selection and prose
- **AND** each result reads as one cohesive professional résumé rather than an evidence inventory

#### Scenario: Technology versions share relevant experience
- **WHEN** a posting requests React 19 and the candidate documents React 18 development
- **THEN** the résumé can emphasize supported React development and related engineering work
- **AND** it does not omit that experience merely because the version differs
- **AND** it neither claims React 19 usage nor inserts a version-gap disclaimer

### Requirement: Material facts remain grounded

The system MUST preserve employers, actual role titles, dates, credentials, technology usage, and the scope of accomplishments when rewriting. It MUST associate generated claims with supplied source references and reject invalid references. It SHALL keep uncertainty or review notes separate from the finished résumé.

#### Scenario: Rewritten accomplishment retains its basis
- **WHEN** the system rewrites a documented accomplishment to emphasize a relevant skill
- **THEN** its supporting references resolve to supplied evidence
- **AND** rewriting does not add an unsupported metric, leadership scope, credential, or technology version

#### Scenario: Invalid evidence reference
- **WHEN** model output references an unknown source or associates a role with another role's bullet
- **THEN** the system rejects the result with a visible generation failure rather than rendering it

#### Scenario: Review notes are outside application content
- **WHEN** generation returns a detail for the owner to verify
- **THEN** the workspace displays it separately from the résumé
- **AND** HTML download and plain-text copy exclude review notes, internal references, and gap-analysis commentary

### Requirement: Established HTML résumé presentation

The system SHALL render validated résumé content using the existing résumé template's document styling, including its typography, portfolio colors, contact links, and skills-column layout. It SHALL support selected experience bullets and projects, and present a standalone résumé without the email introduction or sign-off.

#### Scenario: Complete document preview
- **WHEN** the owner generates a résumé with selected experience, skills, and projects
- **THEN** the preview contains the rewritten document in the established template style
- **AND** identity, contact links, education, selected bullets, and selected projects are rendered coherently
- **AND** the content is not silently truncated to a fixed page count

#### Scenario: Existing inbox template remains compatible
- **WHEN** the owner uses the existing Send my résumé inbox template
- **THEN** its public-profile content, email introduction, contact links, icons, and editable draft behavior remain supported
- **AND** a tailored result does not overwrite that template or the source profile

### Requirement: User-controlled exports

The system SHALL offer HTML download and plain-text copy for the tailored résumé with accurate success or failure feedback. Generating, previewing, copying, or downloading MUST NOT send mail, submit an application, or publish the result.

#### Scenario: Export a completed résumé
- **WHEN** the owner downloads HTML or copies plain text
- **THEN** the chosen representation contains the same résumé content shown in the preview
- **AND** the action produces no external delivery or public publication

#### Scenario: Clipboard unavailable
- **WHEN** the browser denies clipboard access
- **THEN** the workspace reports the copy failure and retains the generated document

### Requirement: Input and model failures remain explicit

The endpoint MUST reject blank job descriptions and descriptions longer than 15,000 characters before generation. It MUST validate structured model output and surface configuration, provider, rate-limit, and malformed-output failures without fabricated fallback documents. A new submission SHALL clear stale results and feedback.

#### Scenario: Invalid input
- **WHEN** the owner submits a blank or oversized job description
- **THEN** the endpoint returns 400 without calling the provider

#### Scenario: Provider or contract failure
- **WHEN** configuration is missing, the provider fails, or model output violates the result contract
- **THEN** the workspace shows a non-success error and no replacement résumé
- **AND** rate-limit retry information is retained when available

### Requirement: Private and inert document handling

Candidate evidence loading and provider calls MUST occur on the server. Public page exports MUST exclude tailored results, private evidence, and model configuration. HTML rendering MUST escape generated text, restrict links to supported contact/project schemes, and prevent executable content or uncontrolled external loads in previews.

#### Scenario: Untrusted markup in generated content
- **WHEN** generated prose contains markup or a job description contains script instructions
- **THEN** the renderer treats prose as text and the preview does not execute scripts, submit forms, or load arbitrary external resources

#### Scenario: Public build isolation
- **WHEN** the public-only site export is generated
- **THEN** it contains no tailored result, private evidence payload, provider credentials, or server bundle
