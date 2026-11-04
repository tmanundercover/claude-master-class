# Proposal

## Why

The class path and 51-slide deck do not cover the current portfolio series consistently: Resume Tailor is unlinked, the interview room lacks slides, and Inbox has no exercise. Existing prompts send students straight into implementation, while the intended teaching sequence is to explore and refine each lesson, review its proposal, then apply and verify it before starting the next lesson.

## What Changes

- Introduce OpenSpec setup and the per-lesson Explore -> Propose -> Apply -> Verify sequence, with an explicit review between planning and implementation. Students finish one lesson before beginning the next; they do not propose the entire series up front.
- Preserve the existing exercise prompt bodies and learning outcomes. Add an exploration wrapper that treats implementation wording inside those prompts as the desired outcome and prevents edits during exploration; use the approved discussion to propose a named lesson change, then explicitly apply it.
- Publish one ordered path: OpenSpec workflow, portfolio personalization, Firebase authentication, Job Fit, Cover Letter, Interview Prep / Study Plan, Resume Tailor, interview room, Inbox, contact form and resume email templates, verification and deployment.
- Expand Resume Tailor, add Inbox and contact/template exercises, and add a matching slide lesson for each topic. Teach local email with deterministic emulator fixtures and explicit sends; distinguish it from live provider, deployment, and DNS activation.
- Reconcile README links, displayed lesson numbering, pre-class readiness guidance, HTML slide navigation and speaker notes, and the matching PDF. Preserve existing exercise paths so saved links and original prompts remain usable.
- Replace stale custom-auth, three-tool, and unfinished-starter guidance with verified current behavior. Explain how to inspect and extend supplied implementations without deleting working features to recreate a blank starter.

## Capabilities

### New Capabilities

None. These changes affect instructional materials, not application behavior.

### Modified Capabilities

None. Existing application specifications remain authoritative and unchanged. This change deliberately declares `skip_specs: true`, as directed by the spec-driven instructions for documentation-only work; curriculum acceptance is captured in the design and tasks rather than inventing a runtime capability.

## Impact

- Future implementation edits are limited to `README.md`, `exercises/`, setup/deployment course documentation, and `docs/slides/`, including a maintainable slide source and its HTML/PDF exports if needed.
- No application, route, authentication, provider, credential, data, or deployment changes are included. Existing APIs and role boundaries are teaching references, not implementation targets of this curriculum change.
- Review covers prompt preservation, all lesson links and ordering, workflow gates, current feature status, slide readability, speaker navigation/thumbnails, and HTML/PDF equivalence. Local HTTP/browser demonstrations use only Firebase Auth, Hosting, and Functions emulators.
- Saved job workspaces, versioned artifacts, and PDF application attachments remain owned by `add-job-workspaces-and-versioned-artifacts`; they are not course prerequisites or delivered features of this change.
