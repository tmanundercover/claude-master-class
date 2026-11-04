# Spec Delta

## Purpose

Reconcile saved résumé replacement behavior with the résumé-tailoring capability that archived before this change was applied. The evidence, writing, authorization, and document-rendering contracts remain in that capability.

## MODIFIED Requirements

### Requirement: Input and model failures remain explicit

The endpoint MUST reject blank job descriptions and descriptions longer than 15,000 characters before generation. It MUST validate structured model output and surface configuration, provider, rate-limit, and malformed-output failures without fabricated fallback documents. Within a saved job workspace, a pending or failed replacement SHALL retain the saved Current/Previous pair and personal notes, identifying them as saved content rather than a new result. Successful replacement or version selection SHALL reset export feedback for the newly selected document. First-generation failure SHALL leave the saved workspace accessible without claiming a saved résumé.

#### Scenario: Invalid input
- **WHEN** the owner submits a blank or oversized job description
- **THEN** the endpoint returns 400 without calling the provider

#### Scenario: Provider or contract failure
- **WHEN** configuration is missing, the provider fails, or model output violates the result contract
- **THEN** the workspace shows a non-success error and no replacement résumé
- **AND** rate-limit retry information is retained when available
- **AND** any already saved Current/Previous pair remains available

#### Scenario: Replacement is pending
- **WHEN** the owner requests Revise or Start over for a saved résumé
- **THEN** its saved Current document and available Previous remain readable while generation is pending
- **AND** a failed request preserves them without fabricating a fallback or losing personal notes

#### Scenario: Saved document selection changes
- **WHEN** durable replacement or Undo/Switch back changes the selected saved résumé
- **THEN** the preview and exports represent that version
- **AND** previous copy/download feedback is cleared for the newly selected document
