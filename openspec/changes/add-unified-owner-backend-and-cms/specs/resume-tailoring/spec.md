# Spec Delta

## MODIFIED Requirements

### Requirement: Actual candidate evidence reaches the model

The system MUST supply documented candidate experience, bullets, projects, and skills as readable model context alongside the target job description. The evidence source SHALL be a coherent saved CMS content revision loaded on the server. Evidence selection MUST retain stable source identity, supporting details, and the content revision needed to rewrite relevant material.

#### Scenario: Relevant projects support an application
- **WHEN** a job description emphasizes work supported by a documented project and an employment role
- **THEN** the model receives the actual supporting details from both sources
- **AND** references alone or generic instructions do not substitute for candidate evidence

#### Scenario: CMS content changes before a new request
- **WHEN** the owner saves revised experience, skills, projects, or contact information and then requests a tailored résumé
- **THEN** the new request and assembled document use that saved revision's approved evidence and identity/contact fields
- **AND** the result records its content/evidence revision without loading a parallel starter archive

#### Scenario: Reorder during generation
- **WHEN** the owner reorders or edits a live source record while a tailoring request is in progress
- **THEN** generation and validation resolve references against the same captured content revision
- **AND** saved source references do not become references to another record because its list position changed
