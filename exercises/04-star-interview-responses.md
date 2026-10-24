# 04 - Build STAR Interview Responses

## Why

Turn verified resume evidence into a private, browsable interview room. Recruiters
need a quick way to scan relevant stories; interviewers need the full response,
transcript, and source experience. The owner still needs a separate workspace.

This exercise extends the classroom authentication from exercise 00. It does not
add public accounts or claim that a shared guest password is production identity.

## Work

Build `/interview` and update the role-selection experience at `/login`.

1. Add a server-only `INTERVIEW_PASSWORD` to `.env.local`. Generate a unique value
   of at least 12 characters and keep it out of Git. Recruiter and Interviewer share
   it for this classroom build; Terrell Singleton continues to use `SITE_PASSWORD`.
2. Put the selected role inside the signed, expiring session. Validate the role on
   the server. Recruiter and Interviewer can open only the interview room; Terrell
   can open the interview room and the existing owner dashboard/tool APIs.
3. On the login screen, add a role dropdown and a 16:9 welcome-video area. Beneath
   it, use Motion for React to type a short explanation of what each role can expect.
   Respect reduced-motion preferences and keep the script readable to assistive tech.
4. Create a YouTube-like, full-width response list: video thumbnail, metadata, and a
   short independently scrolling transcript area in the first column; question,
   response summary, experience source, and technology tags in the second. When its
   file is present, a thumbnail video plays muted and loops only while at least 55%
   of it is visible, then pauses when it leaves the viewport.
5. Support text search plus topic, technology, and experience filters. Filtering is
   client-side over approved metadata and transcripts; never expose private notes.
6. Open a large response modal with normal video controls, summary, technology tags,
   and a separately scrollable transcript. Its experience card must show the source
   role, organization, period, and complete experience description. Hovering or
   keyboard-focusing the card animates at least three verified resume bullets beneath
   the description. If a recording is not present, show an honest placeholder and
   allow browser speech playback of the approved transcript rather than rendering a
   broken video or fake completion.
7. Reuse that same reduced-motion-safe experience reveal in the public homepage
   Experience section. Every homepage role needs at least three verified bullets,
   animated beneath its existing summary on hover or keyboard focus. Keep the page
   server-rendered by isolating the interactive card in a small client component.
8. Add an **I have another question** button. Its modal validates the question and
   opens a prepared email draft. Explain that the visitor must review and send it;
   do not display a false “submitted” state without a real delivery provider.
9. Keep video files out of source until they are approved for distribution. When a
   file is added, keep its transcript and summary synchronized with the recording.
   Use the exact filenames documented in `public/interview/README.md` so the server
   can distinguish available recordings from missing ones before rendering.
10. Add focused tests for role-bearing sessions, rejected role tampering, complete
    response evidence, stable video IDs, and the minimum three bullets required for
    every interview and homepage experience.

Generate a guest password locally:

```powershell
node -e "console.log(require('node:crypto').randomBytes(24).toString('base64url'))"
```

## Good Prompt

```text
Implement exercise 04 in this existing Next.js app.
Read the installed Next.js guides before editing auth, route, or client boundaries.
Preserve the owner dashboard and tool APIs. Add Recruiter, Interviewer, and Terrell
Singleton role selection. Recruiter and Interviewer must validate the same server-only
INTERVIEW_PASSWORD; Terrell must validate SITE_PASSWORD. Sign the role into the
four-hour HTTP-only session and enforce authorization on every server boundary.

Build a protected /interview route with a YouTube-like full-width response list.
Each item needs a muted viewport-aware looping video preview, question title, summary,
topic, technology tags, its verified resume experience, and a scrolling transcript
excerpt beneath the preview. Add text search and topic, technology, and experience
filters. The expanded modal needs normal video controls, the same metadata, a complete
experience description, and a scrollable transcript. Hovering or keyboard-focusing
the modal experience card must animate at least three verified resume bullets beneath
the description. Missing recordings need honest placeholders, not broken media or
fake content.

Add a welcome-video slot and a reduced-motion-safe Motion typewriter explanation to
the role screen. Add an “I have another question” modal that opens an email draft and
does not claim delivery. Reuse the experience-card reveal on every homepage experience,
with at least three verified bullets beneath each existing summary, while keeping the
homepage server-rendered. Use only approved profile evidence for response scripts and
experience details. Add focused role/session, access, response-evidence, and homepage
experience tests; run the full checks; and report missing recordings or delivery
infrastructure separately from what actually works.
```

## Implementation Shape

- `src/lib/interview-responses.ts` owns the approved questions, summaries, filters,
  video paths, transcripts, source descriptions, and detailed experience bullets.
- `data/profile.json` owns the public homepage experience summaries and bullets.
- `src/components/ExpandableExperience.tsx` is the shared Motion client boundary used
  by the response modal and homepage; do not duplicate the hover/focus state machine.
- `src/app/interview/page.tsx` checks which local MP4 files exist before handing their
  IDs to the client library. The repository intentionally ships no recordings.
- `public/interview/README.md` is the filename contract for the welcome recording and
  six response recordings.
- `tests/interview-responses.test.ts` and `tests/profile.test.ts` enforce the evidence
  shape, including at least three substantial bullets for each experience.

## Acceptance Checks

- Missing or weak `INTERVIEW_PASSWORD` blocks secure login with a configuration error.
- Recruiter and Interviewer use `INTERVIEW_PASSWORD`; Terrell uses `SITE_PASSWORD`.
- A guest session opens `/interview` but is denied the owner dashboard and tool APIs.
- A forged or modified role claim fails signature verification.
- Search and all three filters work together and show an explicit empty state.
- Visible list videos play muted and loop; offscreen previews pause.
- Every list item has a scrollable transcript excerpt directly below its video area.
- The expanded video has controls and the transcript scrolls independently.
- Each response shows its verified job experience and technologies; the detailed
  modal also shows the full experience description.
- Hovering or focusing a detailed experience animates at least three verified bullets
  beneath the description, with reduced motion respected.
- Every homepage experience has the same shared hover/focus bullet reveal beneath its
  summary, including roles that do not yet have an interview response.
- The welcome script types with Motion and becomes static with reduced motion.
- The follow-up modal never claims a question was delivered unless delivery occurred.
- Mobile rows stack without horizontal overflow; keyboard focus remains visible.
- Missing MP4 files produce labeled placeholders and transcript speech playback; no
  broken media element is rendered.
- Tests, lint, type check, and production build pass.

## Boundaries, Do's and Don'ts

| Boundary | Do | Don't |
|---|---|---|
| Identity | Sign and authorize the selected role on the server | Trust a dropdown, query string, or localStorage role |
| Secrets | Keep all passwords server-only and distinct from the session secret | Use `NEXT_PUBLIC_`, commit values, or log passwords |
| Evidence | Trace every story to the verified profile and label missing media | Invent metrics, employers, outcomes, or recordings |
| Playback | Autoplay list previews muted only while visible; give full videos controls | Autoplay sound or keep every offscreen video running |
| Experience details | Share one accessible reveal component and source every bullet from the resume | Duplicate divergent interactions or invent extra accomplishments |
| Questions | Open a transparent email draft or configure real delivery | Report success for a question that was not sent |
| Production | Label shared-password auth as a classroom pattern | Present it as production-ready recruiter identity |

## Bad Prompt

```text
Put the interview password in the browser, trust the selected role, invent impressive
STAR metrics and experience bullets, duplicate the modal interaction on the homepage,
autoplay every video with sound, and show “question sent” without wiring up delivery.
Skip authorization tests because the page is hidden from navigation.
```

This exposes credentials, confuses interface state with authorization, fabricates
career evidence, wastes device resources, and reports an external action that did not happen.
