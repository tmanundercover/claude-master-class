# Lesson 2 — Firebase authentication

The portfolio is public; dashboard pages, the interview room, recordings, and AI
APIs require server authorization. Local development uses Firebase Auth, Hosting,
and Functions emulators with a demo project. Do not start a standalone server.

## Purpose, supplied behavior, and prerequisites

Lesson 1's approved facts and [student setup](../docs/pre-class.md) come first.
Firebase login/session verification already exists. Inspect it, verify each role,
and agree on a bounded extension rather than replacing it. This complete feature
brief is newly authored from the supplied implementation.

## Explore and refine — assistant chat

Prerequisites and acceptance checks below define this lesson's scope. Copy this
whole block, including the wrapper. Discuss what already works and agree on one
bounded improvement or verification task before proposing. Use the corresponding
installed invocation for other assistants from [Lesson 0](openspec-workflow.md).

```text
$openspec-explore
Explore only Lesson 2 — Firebase authentication in exercises/00-authentication.md.
The original prompt below is a feature brief: its implementation verbs describe
our desired outcome. Inspect supplied behavior, discuss unknowns and tradeoffs,
and refine the acceptance checks with me. Do not edit implementation files or
create planning artifacts yet. Preserve satisfied behavior and unrelated work.

Inspect src/lib/auth.ts, src/lib/session.ts, src/lib/firebase-client.ts,
src/server/routes/auth.ts, src/entry-server.tsx, and functions/app.mjs.
Keep the public portfolio public and authorize private routes before loading data.
Use Firebase email/password Auth with memory-only client persistence.
Exchange a recent ID token for a four-hour __session cookie and clear client Auth.
Verify tokens and cookies with Admin, including revocation. Authorize the signed
portfolioRole claim: terrell owns tools; interviewer/recruiter share guest access.
Never authorize a role dropdown, localStorage value, or unassigned account.
Keep HttpOnly, Secure, SameSite=Strict, Path=/, expiry, JSON and same-origin checks.
Return API 401 for absent/invalid sessions and 403 for guest access to owner tools.
Logout clears the cookie; Admin revocation invalidates copied sessions.
Use demo-only emulator seeding and ignored local account manifests.
Keep provider keys, private evidence, and all credential values on the server.
Preserve working tool contracts. Add focused denial, tampering, expiry, origin,
revocation, unassigned-user and logout checks; run npm run preflight.
Use Firebase Auth, Hosting, Functions, Firestore, and Cloud Storage emulators; no standalone server.
```

## Propose, review, then Apply

After exploration is satisfactory, send this separate assistant instruction:

```text
$openspec-propose lesson-firebase-authentication
Use our agreed Lesson 2 discussion only. Preserve satisfied behavior.
Write planning artifacts; do not implement yet.
```

Review the proposal, design, applicable specs, and tasks. Confirm the named files,
role boundaries, evidence rules, failure cases, and this lesson's observable checks.
Correct the plan before proceeding. Then explicitly send:

```text
$openspec-apply-change lesson-firebase-authentication
Implement the reviewed lesson tasks and report actual verification results.
```

## Verify before continuing

Run the lesson checks below and record expected versus actual results. Inspect
supplied behavior instead of removing working features. An unchecked or failed
check keeps this lesson open. Resume the same `lesson-firebase-authentication` change after diagnosis;
see [same-change recovery](openspec-workflow.md#same-change-recovery). No automatic
sending, deployment, sync, or archive follows lesson completion.

## Work

1. Inspect `src/lib/auth.ts`, `src/lib/session.ts`, `src/lib/firebase-client.ts`,
   `src/server/routes/auth.ts`, `src/entry-server.tsx`, and the auth UI components.
2. Use Firebase's email/password provider. Keep client Auth persistence in memory,
   exchange a recently authenticated ID token for a four-hour Firebase session
   cookie, and clear client Auth state after exchange. Do not build custom tokens.
3. Verify tokens and session cookies with the Admin SDK, including revocation.
   Authorize the signed `portfolioRole` claim: `terrell` owns the dashboard and
   tools; `interviewer` and `recruiter` have equivalent interview-room access.
   Never grant access from the role dropdown or an unassigned account.
4. Keep `__session`, HttpOnly, Secure, SameSite=Strict, Path=/, and four-hour expiry.
   Preserve JSON validation, same-origin mutation checks, and explicit failures.
5. Guard each private route before loading or serializing its data. Return API
   401 for absent/invalid sessions and 403 for guest access to owner-only tools.
6. Clear the cookie on logout; use Firebase revocation to invalidate copied cookies.
7. Seed demo users through `scripts/seed-auth-emulator.mjs`. Keep passwords in the
   ignored local manifest, and refuse seeding non-demo projects.

Site passwords and session secrets are no longer part of the authentication flow.
Do not delete the user's retained environment copies before they verify the backend.
The frontend contains only public Firebase configuration; provider keys stay in
Functions. Production account provisioning is separate from local seeding.

## Verification

Run `npm run preflight`. Test all three seeded roles through Hosting, direct private
URLs, unassigned users, attempted role escalation, revoked sessions, origin rejection,
logout, and all four career tool APIs. Never replace a failed check with a client-only guard.

For local accounts, run `npm run dev` and inspect `.firebase/auth-users.local.json`.
See [Firebase development and deployment](../docs/deploy-firebase.md).

### Observable completion checks

- `/` stays public. Logged-out `/dashboard` redirects without private serialized data.
- Direct calls to `/api/fit-analyzer`, `/api/cover-letter`, `/api/career-plan`, and
  `/api/resume-tailor` return 401 without a session, 403 for either guest role.
- Both guests can open `/interview`; only the owner opens tools and Inbox.
- Tampered/expired/revoked cookies and unassigned accounts grant no access.
- Cross-origin mutation fails; cookie flags and four-hour expiry match the server.
- Logout removes the cookie; a copied revoked session fails server verification.
- Preflight passes through the emulators; record failures without bypassing guards.

Previous: [Lesson 1 — Personalize your portfolio](00-personalize.md) · Next: [Lesson 3 — Job Fit](01-job-fit.md).
