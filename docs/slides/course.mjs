// Editable course content. Exact prompts are loaded from exercises, not duplicated.
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
export const lessons = [
  ['openspec-workflow.md', 'OpenSpec workflow', 'lesson-workflow'],
  ['00-personalize.md', 'Personalize your portfolio', 'lesson-personalize-portfolio'],
  ['00-authentication.md', 'Firebase authentication', 'lesson-firebase-authentication'],
  ['01-job-fit.md', 'Job Fit', 'lesson-job-fit'],
  ['02-cover-letter.md', 'Cover Letter', 'lesson-cover-letter'],
  ['03-career-plan.md', 'Interview Prep / Study Plan', 'lesson-career-plan'],
  ['04-resume-tailor.md', 'Resume Tailor', 'lesson-resume-tailor'],
  ['04-star-interview-responses.md', 'Interview room', 'lesson-interview-room'],
  ['inbox.md', 'Inbox', 'lesson-inbox'],
  ['contact-and-email-templates.md', 'Contact form and resume email templates', 'lesson-contact-templates'],
  ['verification-and-deployment.md', 'Verification and deployment', 'lesson-verification'],
];
const esc = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
export const slides = [];
function add(lesson, mode, title, lines, notes = '', extra = {}) {
  slides.push({ lesson, mode, title, lines, notes: notes || `Explain ${title}. Ask for expected and actual results. Keep the current lesson open until its checks pass.`, ...extra });
}
function explain(lesson, title, lines, notes) { add(lesson, 'Explain · listen first', title, lines, notes); }
function act(lesson, title, lines, notes) { add(lesson, 'Act · do this now', title, lines, notes); }
const retained = [...read('./retained-slides.html').matchAll(/<section\b[^>]*>[\s\S]*?<\/section>/g)].map(x => x[0]);
function keep(index, title) { slides.push({ title, lesson: null, mode: 'Explain · listen first', html: retained[index], notes: 'Retained course opening/closing material. Course completion does not promise publication, employment, or provider readiness. Confirm current program details with the host.' }); }

add(null, 'Portfolio and career workspace series', 'Build Your AI-Powered Portfolio', [
  'Your portfolio. Your career workspace. One reviewed lesson change at a time.',
  'With Nahid Farady, PhD · Hosted by Abhinav Rawat, Interview Kickstart',
  'Explore → refine → Propose → review → Apply → Verify',
], 'Welcome. This is an expanded multi-lesson series. No live publication is implied.', { hero: true });
keep(0, "Tell us who's here before we start"); keep(1, 'Meet Nahid Farady, PhD'); keep(2, 'Turn AI curiosity into the confidence to build');
explain(null, 'Outcomes and pace', [
  'Personalize supplied features using approved facts and reviewable changes.',
  'Four career entries: Job Fit, Cover Letter, Interview Prep / Study Plan, Resume Tailor.',
  'The introductory session can stop after Lesson 5 once its checks pass.',
  'Lessons 6–10 continue the series; no whole-series 90-minute promise.',
  'Working features are inspected and extended. Local fixtures do not prove live delivery.',
]);
for (const [start, end] of [[0, 5], [6, 10]]) {
  explain(null, start === 0 ? 'Course path · introduction and core' : 'Course path · continuation',
    lessons.slice(start, end + 1).map((x, n) => `Lesson ${start + n} — ${x[1]} · exercises/${x[0]}`));
}
explain(0, 'Setup before the first change', [
  'Read docs/pre-class.md; Node 22.18+, one assistant, Git and redacted evidence.',
  'Terminal: npm ci; npm ci --prefix functions; npm run preflight.',
  'Terminal: openspec --version; openspec list --json. Inspect root and installed skills.',
  'Existing configured clone: preserve workflow files. Initialize only a genuinely new project after agreement.',
  'App development: npm run dev starts only Auth, Hosting and Functions emulators.',
  'Use isolated mail/model fixtures; preserve every existing credential value.',
]);
explain(0, 'Separate supplied features from lesson work', [
  'Firebase email/password login and Admin-verified role sessions already work.',
  'Career APIs validate inputs and results; missing configuration is a visible error.',
  'Inbox, contact routing and the public-profile HTML résumé template are supplied.',
  'The job-workspace change is concurrent: saved jobs, version pairs and application PDFs have separate acceptance.',
  'Do not rebuild working features, mark unrelated tasks complete, or infer live readiness.',
]);
act(0, 'Explore first; refine before proposing', [
  'Copy the current exercise’s complete exploration block, wrapper and feature brief together.',
  'Inspect supplied behavior; discuss unknowns, tradeoffs, boundaries and acceptance checks.',
  'Do not edit implementation files or write planning artifacts during exploration.',
  'Use your assistant’s installed invocation; these are chat instructions, not shell commands.',
]);
explain(0, 'Assistant invocation map', [
  'Codex: $openspec-explore; $openspec-propose; $openspec-apply-change.',
  'Claude Code: /opsx:explore; /opsx:propose; /opsx:apply.',
  'Copilot IDE: /opsx-explore; /opsx-propose; /opsx-apply.',
  'Confirm discovery/autocomplete. Skill-only assistants may use /openspec-* forms.',
  'In a terminal use openspec list/status/instructions; do not paste chat commands there.',
]);
act(0, 'Named-change practice and review gate', [
  'Chat after agreement: $openspec-propose lesson-job-fit',
  'Read proposal, design, applicable specs, tasks; correct scope and checks.',
  'Separate chat after review: $openspec-apply-change lesson-job-fit',
  'One initial Apply covers the current lesson’s tasks; verification decides completion.',
  'Do not propose the course as one change or infer consent to implement from discussion.',
]);
act(0, 'Verify and recover under the same name', [
  'Record expected versus actual behavior. Leave failures and unperformed checks open.',
  'Terminal: openspec status --change lesson-job-fit --json',
  'Terminal: openspec instructions apply --change lesson-job-fit --json',
  'Diagnose, review plan corrections if needed, then resume that same named change.',
  'Begin the next lesson only after checks pass. Sending, publication, sync and archive are separate.',
]);

const info = {
  1: [
    'Turn redacted source material into approved public facts before portfolio edits.',
    'Current portfolio and historical evidence rendering are supplied; preserve approved records.',
    'Extract facts, list conflicts, wait for explicit source-fact approval, then explore personalization.',
    'Keep raw PDFs and private notes out of public assets and Git.',
    'Check every public claim, homepage metadata, résumé search and private evidence boundaries.',
  ],
  2: [
    'Public homepage; owner-only tools; equivalent interviewer/recruiter interview access.',
    'Firebase email/password → recent ID token → four-hour __session; clear client Auth.',
    'Admin verifies signature and revocation; signed portfolioRole authorizes access.',
    'HttpOnly, Secure, SameSite=Strict, Path=/; role selection grants no permissions.',
    'Source: src/lib/auth.ts, src/lib/session.ts, src/server/routes/auth.ts, src/entry-server.tsx.',
  ],
  3: [
    'Candid decision support grounded in approved profile evidence and an untrusted JD.',
    'Supplied route and UI: inspect shared analysis/generation behind the compatibility route.',
    'Model classifies requirements; application calculates deterministic 70/20/10 weighting.',
    'Supported / partial / unsupported earn 1 / 0.5 / 0; logistics stay separate.',
    'Score is neither a hiring probability nor a gate to other tools.',
  ],
  4: [
    'Supported candidate advocacy: 200–300 actual words, selected tone, two true examples.',
    'Request: jobDescription plus formal / conversational / technical tone.',
    'Supplied protected generation, runtime validation and explicit copy feedback.',
    'Output: letter, evidenceUsed, factsToVerify; optional notes stay separate.',
    'Open directly without Job Fit. Copying never sends a letter.',
  ],
  5: [
    'One private feature, two modes; no score or previous assessment required.',
    'Interview: five questions, three truthful STAR outlines, three questions to ask.',
    'Stages are assumptions to confirm; unknown story facts need owner input.',
    'Study: three priority skills, exactly four weeks, measurable outputs within 1–40 weekly hours.',
    'Notes stay private and separate from model input or generated/exported documents.',
  ],
  6: [
    'Open /dashboard/resume-tailor directly as owner with a nonblank JD ≤15,000 characters.',
    'Supplied preview, self-contained HTML download and matching text copy.',
    'Model selects and rewrites supported evidence; server assembles immutable facts.',
    'Validate source IDs, parent association, prose bounds and errors; references are not proof of semantic truth.',
    'Separate workspace/PDF work is concurrent. HTML/text actions do not attach or send mail.',
  ],
  7: [
    'Supplied protected interview room with evidence-linked questions and answers.',
    'Guests see interview language; authoring STAR labels and private notes stay out of guest payloads.',
    'Search, topic, technology and experience filters; full response modal and transcript.',
    'Current shared interaction: ExperienceCard.tsx; inspect consumers before adapting historical names.',
    'No recordings ship: honest placeholders and transcript speech are expected.',
  ],
  8: [
    'Owner-only /dashboard/inbox and /api/inbox/**; read docs/owner-inbox.md.',
    'Supplied summary, folders, conversations, native drafts and explicit reply/send controls.',
    'Use demo owner in the isolated fixture harness; never access the maintainer’s live mailbox.',
    'Core practice: read, reply, compose, save/reopen, search/page and recover failures.',
    'Fixture acceptance is local state evidence, not external delivery.',
  ],
  9: [
    'After Inbox: public contact → fixture conversation → owner reply to visitor Reply-To.',
    'POST /api/contact validates fields, origin, limits, honeypot and fixed server routing.',
    'Send my résumé uses approved public profile content; preview leaves the current draft intact.',
    'Use template explicitly replaces subject/text/HTML, retaining recipients and files.',
    'The separate Job application template has different document behavior and separate acceptance.',
  ],
  10: [
    'Run existing verification and prepare a target-specific release review.',
    'npm run preflight: unit, lint, types, export/build and emulator HTTP checks.',
    'Inspect actual behavior at 375px/1440px; check keyboard, errors and reduced motion.',
    'Firebase serves full authenticated app; Pages serves public-only output.',
    'Building/exporting never authorizes publication, mail provisioning or DNS changes.',
  ],
};
const checks = {
  1: ['Every public claim has approved evidence; no fictional replacement of real records.', 'Current facts preserved; historical dates/ratings labeled; detailed evidence owner-only.', 'Hidden-until-opened résumé search and shared More reveal work at 375px/1440px.', 'Metadata matches approved identity; checks pass; raw sources remain private.'],
  2: ['Logged-out private page redirects; APIs return 401 before data/model reads.', 'Guest owner-API access returns 403; guest /interview works; unassigned accounts fail.', 'Tampered, expired and revoked cookies fail; cross-origin mutations fail.', 'Logout/cookie flags and four-hour lifetime verified; npm run preflight passes.'],
  3: ['Invalid JD: 400 before provider; absent/guest authorization: 401/403.', 'Each classification quotes posting and cites valid source references.', 'Strong and weak postings receive defensible reasoning; identical classifications score identically.', 'No free points for empty categories; logistics-only input has no numeric score.', 'Provider/configuration/parse errors are visible; no fabricated fallback.'],
  4: ['Actual word count 200–300; selected tone, correct role/company, two true examples.', 'Invalid tone/JD/session fails before generation; unsupported claims never appear as facts.', 'Copy reports success/failure; optional verification notes stay outside the letter.', 'No auto-send, publication or hidden dependency on Job Fit.'],
  5: ['Both variants return through one protected route with explicit mode.', 'Interview counts and true story evidence pass; assumptions and missing facts are labeled.', 'Study: exactly four weeks and each week ≤weeklyHours with measurable deliverable/check.', 'Saved Current/Previous and notes survive pending/failed replacements; malformed counts, modes or budgets fail visibly.', 'Private notes remain separate and no employment/readiness guarantee is made.'],
  6: ['Owner can tailor first; absent/guest access fails before generation.', 'Unknown/cross-parent IDs, duplicate selections and bounds fail visibly.', 'Immutable profile facts match; supported rewriting is reviewed for truth.', 'Preview/HTML/text agree in full; review notes stay separate; saved pairs survive failed replacement and clipboard errors.', 'No private output in public builds, no profile overwrite, no automatic attachment/send.'],
  7: ['Guest interview access works; owner routes/APIs and private notes remain denied.', 'Search plus all filters, empty states, independently scrolling transcript and modal work.', 'Visible previews loop muted only at ≥55% visibility, pause offscreen; full video has controls.', 'More reveals ≥3 verified bullets; reduced motion is respected; homepage shares behavior.', 'Missing media is honest; question opens reviewed email draft without claiming delivery.'],
  8: ['Logged-out/guest reads and attachments fail 401/403; owner sees fixture summary.', 'Folders, selected thread, cursor pages, search/filters and save/reopen work.', 'Failed edits remain recoverable; uncertain send freezes exact payload/attempt.', 'Unchanged retry reconciles without duplicate acceptance; no real mail is delivered.'],
  9: ['Public validation/routing/origin failures occur before provider calls and retain input.', 'Fixture contact appears in owner Inbox; Reply-To targets the visitor.', 'Unchanged uncertain retry reuses attempt and prevents duplicate notification.', 'Preview does not apply; explicit apply keeps recipients/manual attachments.', 'Both edited bodies survive Saved/reopen; Send remains deliberate; no implied PDF attachment.'],
  10: ['Record command, exit status and actual result for every check; leave unperformed items open.', 'Public output excludes server bundle, environment, private recordings/evidence/workspaces.', 'Intentional standard resume.pdf is public-profile-only; tailored PDFs and notes stay private.', 'Choose Pages/public or Firebase/full-app deliberately; review target and rollback.', 'Get separate authorization before live publication; no live delivery claim from fixtures.'],
};
function promptParts(prompt) {
  const parts = []; let part = '', weight = 0;
  for (const line of prompt.match(/.*(?:\n|$)/g).filter(Boolean)) {
    const cost = Math.max(1, Math.ceil(line.replace(/\n$/, '').length / 96));
    if (weight + cost > 13 && part) { parts.push(part); part = ''; weight = 0; }
    part += line; weight += cost;
  }
  if (part) parts.push(part);
  return parts;
}
for (let i = 1; i <= 10; i++) {
  const [file, title, change] = lessons[i];
  const source = read(`../../exercises/${file}`);
  explain(i, `${title} · purpose and current state`, info[i]);
  if (i === 1) {
    act(i, 'Approve source facts before portfolio edits', ['Attach redacted PDF/project notes to an approved assistant, never to the website.', 'First use the exercise’s extraction block. Review conflicts and missing evidence.', 'Explicitly approve extracted public facts, then explore the implementation brief.', 'Fact approval does not automatically approve a proposal or edits.']);
  }
  const prompts = [...source.matchAll(/```text\n([\s\S]*?)```/g)].map(x => x[1]).filter(x => x.startsWith('$openspec-explore\n'));
  if (!prompts.length) throw new Error(`Lesson ${i} has no canonical exploration block: ${file}`);
  // Personalization extraction happens first even though the legacy file keeps it near the end.
  if (i === 1) prompts.reverse();
  prompts.forEach((prompt, p) => {
    const parts = promptParts(prompt);
    parts.forEach((part, n) => add(i, 'Act · Explore and refine', `${title} · ${i === 1 ? (p === 0 ? 'extract facts' : 'personalize') : 'full brief'} ${n + 1}/${parts.length}`, [],
      `Canonical source: exercises/${file}. Complete paste order ${n + 1} of ${parts.length}. Copy the whole block from the exercise, including its no-edit wrapper. Discuss existing behavior, examples, tradeoffs and checks before proposing.`,
      { prompt: part, promptSource: file, promptBlock: p, promptPart: n, promptTotal: parts.length }));
  });
  add(i, 'Act · Propose and review', `${title} · review the plan`, [
    `Chat after agreement: $openspec-propose ${change}`,
    'Use only this lesson’s agreed discussion; write planning artifacts, do not implement.',
    'Read proposal, design, applicable specs and tasks. Confirm files, boundaries and checks.',
    'Request corrections before approval. Satisfied behavior stays in place.',
  ]);
  add(i, 'Act · Apply and Verify', `${title} · apply only after review`, [
    `Separate chat: $openspec-apply-change ${change}`,
    'Implement the reviewed current lesson task list; report actual results.',
    'Inspect observable checks, failures and private/public boundaries.',
    `If interrupted or failing, resume the same ${change} change after diagnosis.`,
    'Do not begin the next lesson until these checks pass. No automatic send or deployment.',
  ]);
  explain(i, `${title} · observable completion`, checks[i], `Read all checks in exercises/${file}. Record actual results. A fixture does not establish provider quality, live sending or production readiness.`);
  if (i === 5) explain(i, 'Introductory-session stopping point', ['Once Lessons 0–5 pass, save the reviewed work and record actual check results.', 'Continue with Resume Tailor, interview room, Inbox, contact/templates and release review.', 'Do not skip a failed lesson to meet a session clock. Keep the same change open.']);
  if (i === 8) {
    act(i, 'Inbox local practice · read and recover a draft', ['Run npm run test:mail:browser with isolated fixture settings and demo owner.', 'Observe summary → folders → conversation → reply; native To follows Reply-To.', 'Compose with fixture recipients; wait for Unsaved → Saving → Saved.', 'Close/reopen the same native draft; content, recipients and files remain.', 'Search/filter and cursor-page; old resource results clear on a switch.']);
    act(i, 'Inbox local practice · failed or uncertain send', ['Rejected send: keep edits and a visible error; correct validation deliberately.', 'Lost response: snapshot/attempt freeze; retry unchanged to reconcile acceptance.', 'Never create a new message to retry an uncertain accepted send.', 'Session expiry: retain/copy editable work, sign in in another tab, then retry.', 'Local acceptance is not external delivery; keep uncertain recovery open.']);
    explain(i, 'Instructor demo · extended mailbox controls', ['CC/BCC, reply-all and forward: inspect exact recipient set before explicit Send.', 'Labels and account-scope contacts: explicit edits; new contacts unsubscribed.', 'Attachments: 10 files/10 MiB; owner-bound download, no arbitrary paths/URLs.', 'Received HTML stays sanitized/inert; remote images require opt-in.', 'Refresh on focus/mutations/visible polling; cancel stale reads and respect Retry-After.', 'Settings require explicit Save; autonomous actions are not implicitly enabled.']);
  }
  if (i === 9) {
    act(i, 'Contact practice · public form to private reply', ['Submit valid fixture name/email/message with empty honeypot and stable attempt.', 'Open owner Inbox; read the fixture conversation and inspect visitor Reply-To.', 'Explicitly reply to the visitor; guest readers still receive 403.', 'Test invalid/origin/extra routing fields before provider; failed input remains.', 'Unchanged uncertain retry reconciles one notification. 202 means accepted, not delivered.']);
    act(i, 'Template practice · preview, apply, customize, reopen', ['Compose with fixture recipients and a manual attachment; wait for Saved.', 'Preview Send my résumé: no draft mutation. Use template: replaces copy only.', 'Edit both plain text and HTML; scripts/forms/external images stay blocked in preview.', 'Wait for Saved and reopen: edited copy, recipients and attachments remain.', 'Review then explicitly Send message in fixtures; no implied PDF or tailored substitution.']);
  }
  if (i === 10) explain(i, 'Prepare artifacts; review publication separately', ['npm run build:pages → dist/pages, public-only; set the project BASE_PATH when needed.', 'npm run build:firebase → dist/hosting + private Functions package, full app.', 'Pages has no authenticated backend or contact delivery; private links explain requirements.', 'Public export never contains private interview recordings, workspace files, environment or server bundle.', 'Target review, account/role/provider readiness and rollback precede separate live authorization.']);
}
explain(null, 'Take the work forward', ['Finish any remaining lesson checks under their existing named changes.', 'Report a local demo or authorized live URL, actual checks and all four tool statuses.', 'Keep career outputs private; add new approved project evidence as skills develop.', 'Choose one next action with a due date. Full Firebase hosting, a Q&A bot, an interview coach or a domain are future possibilities.', 'Current local results do not claim live publication, live email or job-workspace completion.']);
add(null, 'Take it forward', 'Your portfolio can keep growing', ['Continue building from reviewed evidence and verified behavior.', 'Explore career development with Interview Kickstart.'], 'Do not announce that the portfolio is live unless the student separately published and verified it.', { hero: true });
keep(3, 'Where tech professionals take the next step'); keep(4, 'Pick the path that fits your goal'); keep(5, 'Questions?');

export function renderSections() {
  return slides.map((s, i) => {
    const page = `${String(i + 1).padStart(2, '0')} / ${slides.length}`;
    const note = `<aside class="notes">${esc(s.notes)}</aside>`;
    if (s.html) return s.html.replace(/<section\b([^>]*)>/, `<section$1 id="slide-${i + 1}" data-title="${esc(s.title)}">`).replace('{{page}}', page).replace('</section>', `${note}</section>`);
    const nav = `<nav class="lesson-nav" aria-label="Lesson navigation">${lessons.map((l, n) => `<a href="#/lesson-${n}"${n === s.lesson ? ' aria-current="step"' : ''}>${n} ${esc(l[1])}</a>`).join('')}</nav>`;
    const content = s.prompt !== undefined ? `<p class="prompt-caption">Complete paste order ${s.promptPart + 1}/${s.promptTotal} · copy the full block from exercises/${esc(s.promptSource)}</p><pre class="course-prompt" data-source="${s.promptSource}" data-block="${s.promptBlock}" data-part="${s.promptPart}">${esc(s.prompt)}</pre>` : `<ul class="course-lines">${s.lines.map(l => `<li>${esc(l)}</li>`).join('')}</ul>`;
    return `<section id="slide-${i + 1}" data-title="${esc(s.title)}"${s.lesson !== null ? ` data-lesson="${s.lesson}"` : ''} class="${s.hero ? 'hero' : ''}"><div class="slide-grid"><header class="rail"><span class="marker">${s.lesson === null ? 'Portfolio career workspace' : `Lesson ${s.lesson} · ${esc(lessons[s.lesson][1])}`}</span><svg class="logo" viewBox="0 0 600 128"><use href="#ik-logo"/></svg></header><div class="body"><p class="course-mode">${esc(s.mode)}</p><h1 class="headline">${esc(s.title)}</h1>${nav}${content}</div><footer class="foot"><span>${s.prompt !== undefined ? 'Explore only. Original implementation verbs describe desired outcomes; no edits or planning artifacts yet.' : 'One lesson change at a time · Explore → refine → Propose → review → Apply → Verify'}</span><span class="num">${page}</span></footer></div>${note}</section>`;
  }).join('\n\n');
}
