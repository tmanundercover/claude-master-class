# Profile photo

Open **Dashboard → Profile photo**, choose a JPEG, PNG or WebP image up to 5 MB,
review the preview, and select **Save profile photo**. The photo is public: it
appears on the portfolio card, private workspace header, inbox account menu and
the owner's outgoing-message avatars. Other senders retain their own initials.

The browser prepares a JPEG at up to 1024 pixels, removing file metadata. The
server accepts only a bounded JPEG (2 MB, at most 2048 pixels per side), verifies
the owner session and same-origin request, and checks the saved revision before
replacing the image. A failed or stale upload leaves the saved image intact.

Image bytes live in the configured Cloud Storage bucket under server-generated
`profile-photos/{ownerUid}/{id}.jpg` paths. Firestore's `portfolio/profilePhoto`
document stores the integrity manifest and update metadata. The implementation
reuses the existing server storage configuration; local development uses the
Firestore and Storage emulators. No credentials or direct object URLs reach the
browser. Both rule files continue to deny direct client storage access.

`GET /api/profile-photo` intentionally serves the current public portrait with
its image content type, integrity check, ETag and revalidation headers. Owner-only
`GET /api/profile-photo/settings` supplies the revision. `POST /api/profile-photo`
accepts JPEG bytes with `If-Match: "<revision>"` (or `"none"` for the first upload).
Replacing a photo queues the old object for deletion; interrupted cleanup retries
on owner settings/upload requests. Objects outside the current reference have
no public download route.

The supplied portrait is uploaded through that API in the local demo project.
An approved copy in `public/profile-photo.jpg` is also the bundled fallback and
the photo in the optional static Pages export. Firebase pages load the current
Storage-backed photo. Static Pages uses its build-time image; it cannot host the
private upload dashboard or automatically reflect later Storage uploads.

Verification: `tests/profile-photo.test.ts` covers validation, authorization,
conflicts, persistence failures and lost acknowledgements. The emulator HTTP
suite verifies actual object/metadata writes, public reads, direct-client denial
and old-object cleanup. `scripts/test-profile-photo-browser.mjs` verifies upload,
avatars, reload, invalid files, failed saves and 375px/1440px layouts.

## Local verification — 2026-11-04

- The attached 400×400 portrait was uploaded through the owner API into the local
  Storage emulator. Its Firestore reference and stored/public byte identity were
  verified (25,372 bytes), and the complete emulator data was exported.
- Five focused unit tests passed, including stale edits, failed storage and lost
  acknowledgements. Two HTTP cases passed against actual Firestore/Storage SDKs,
  covering unauthorized writes, file limits, public reads, ETags, client-rule
  denial and old-object cleanup.
- The photo browser flow passed at 375px/1440px with upload/preview, immediate
  account avatars, public display, reload persistence, invalid-file rejection,
  preserved saved images after failure and no horizontal overflow or browser errors.
- Full preflight passed: 119 unit tests, global lint, TypeScript, public and Firebase
  builds, four SDK/rules emulator checks and 18 HTTP passes (two unrelated
  controlled-model cases skipped). Additional build assertions passed: eight Pages
  checks under `/photo-check/`, six Firebase packaging checks, final lint/types
  and `git diff --check`.
- The real development photo and all three Clover artifacts remained readable
  after the isolated test emulators stopped. No provider request, email send,
  environment-key change or deployment was performed for this feature.

Evidence: `.firebase/profile-photo-browser/`, `.firebase/profile-photo-evidence/`,
`/tmp/profile-photo-preflight.log`, `/tmp/profile-photo-browser.log`,
`/tmp/profile-photo-pages.log`, `/tmp/profile-photo-final-build.log`.
