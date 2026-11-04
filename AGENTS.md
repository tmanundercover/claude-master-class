# Project guidance

This is a React and TypeScript application built with Vite.

- `src/pages/` contains universal React pages; `src/App.tsx` selects the page.
- `src/entry-server.tsx` authorizes routes and renders HTML. `functions/app.mjs` adapts requests inside Firebase Functions.
- Use the Auth, Hosting, Functions, Firestore, and Cloud Storage emulators for local development and HTTP checks; do not launch standalone servers. Maintain Firestore and Storage rules files, and test direct-client denial separately from server owner authorization because the Admin SDK bypasses rules.
- Give each test suite its own temporary directory as well as ports. The Storage emulator deletes its blob directory on shutdown; it must never share that directory with development or another test suite.
- Keep credentials, provider calls, session verification, and private evidence loading on the server.
- Preserve all existing API key values when rewriting `.env.*` files. Never replace, clear, rotate, or copy API keys between environment files without explicit user authorization. Prefer isolated test configuration over rewriting credential files; if temporary replacement is necessary, preserve the original securely and restore it only after confirming the file still contains the test-written content, so newer user edits are never overwritten. Never print API keys.
- Firebase Hosting serves `dist/hosting`; the Functions package owns authentication and dynamic requests.
- The optional GitHub Pages export is public-only. Never copy the server bundle, private interview media, or environment files into it.
- Preserve approved profile evidence and existing role boundaries.
- Run `npm run preflight` after changes to routing, authentication, or builds.
