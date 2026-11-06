# Proposal

## Why

The owner backend is split between a compact inbox and disconnected workspace pages, while résumé content still depends on bundled starter data and guest accounts require Firebase-console administration. A shared application shell, persisted content CMS, and first-class Accounts area will make daily correspondence, career preparation, site editing, and access management work together.

## What Changes

- Add an inbox-density shell with a left icon rail, contextual sidebar, and main pane. Destinations, in order, are Mail, Saved Jobs, Résumé Intelligence, Workflows, Recorded Answers, CMS, Accounts, and Settings. Accounts is a top-level destination; Recorded Answers uses a YouTube-style play icon. Keep the avatar/dropdown above the rail and put mailbox tools below a divider in the Mail sidebar.
- Reuse existing mail, saved-document, evidence, workflow, and recorded-answer behavior inside that shell. Give Job Fit, Resume Tailor, Cover Letter, Interview Prep, and Study Plan individual workflow entries with their explanations and working interfaces in the main pane. Preserve job context, unsaved work, deep links, and existing role boundaries.
- Retain `/dashboard` as the current landing page and post-login destination during this transition; replacing it is future work.
- Add immediate-save CMS editing for all reusable résumé/portfolio content: identity, contact information, introduction/site copy, experiences and bullets, projects, skills and evidence relationships, education, and profile media. Use one persisted content source for the public site, evidence views, standard résumé, email résumé templates, and future AI generations.
- Migrate the consolidated profile and useful historical starter data into stable, linked persisted records. Phase out the archive and both JSON files as runtime authorities; do not add archive maintenance or a draft/publish workflow.
- **BREAKING**: replace role-selected guest login with one login screen offering Google and email/password, deriving permissions from managed account records. Preserve the existing owner identity/UID and Google-only owner policy, with no owner password management.
- Add owner-only Accounts management: approve an email and guest role, allow Google sign-in and/or generate a unique password for that guest, reset individual passwords, and remove access. Removing an account denies new and existing sessions on the next protected request. Do not use shared rotating passwords or automatically send credentials.

## Capabilities

### New Capabilities

- `owner-workspace-shell`: Shared rail/sidebar/main-pane navigation, compact screen composition, contextual workflows, and preserved navigation state.
- `portfolio-content-cms`: Immediate-save persisted content management, starter-data migration, linked evidence views, and consistent public/document projections.
- `account-access-management`: Owner-managed email allowlist, guest login methods and roles, Google-only owner identity, individual password provisioning, and session access removal.

### Modified Capabilities

- `resume-tailoring`: Load readable candidate evidence from a coherent persisted CMS revision with stable source identities rather than the bundled consolidated profile.

## Impact

- Changes page selection, private routing, login/session authorization, shared layouts, and responsive styles in the existing React/Vite/Firebase Functions application.
- Adds server-authorized Firestore content/account repositories and CMS/Accounts APIs; reuses Cloud Storage, Auth, profile-photo handling, existing mail adapters, and career-document storage.
- Updates profile/evidence loaders, AI context projection, document generation, dynamic standard-PDF delivery, and explicit public-only static export snapshots. Account records, private evidence, recordings, and job documents stay outside public exports.
- Coordinates with the still-active inbox and job-workspace changes without modifying their artifacts or claiming their operational gates complete. New contracts preserve Current/Previous documents, explicit sending, and saved attachment snapshots.
- Requires migration, failure/retry, authorization/rules, emulator HTTP/browser, public-export, and preflight acceptance. No deployment, live account provisioning, credential email, DNS change, external CMS, or general workflow-automation engine is authorized by this planning change.
