# 00A - Firebase Authentication for the Private Workspace

The portfolio is public; dashboard pages, the interview room, recordings, and AI
APIs require server authorization. Local development uses Firebase Auth, Hosting,
and Functions emulators with a demo project. Do not start a standalone server.

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
logout, and all three APIs. Never replace a failed check with a client-only guard.

For local accounts, run `npm run dev` and inspect `.firebase/auth-users.local.json`.
See [Firebase development and deployment](../docs/deploy-firebase.md).
