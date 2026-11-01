# 00 - PDF to Your Portfolio

## Why

Learn to turn unstructured and historical source material into reviewed structured
data without asking AI to invent a professional identity. One current profile grounds
the public portfolio and private tools; an optional normalized archive can add dated
evidence without replacing the current résumé.

## Work

Attach your redacted resume PDF and project notes to an approved assistant.
Do not upload raw sources to the portfolio or commit them. Inspect `data/profile.json`,
`src/pages/Home.tsx`, and `src/App.tsx` before edits. If you have an older portfolio
export, normalize only approved résumé records into a small JSON evidence file; do not
ship its raw backup, binary assets, drafts, or unrelated CMS documents.

## Good Prompt

```text
Use my attached resume PDF and project notes as evidence.
Inspect data/profile.json and its consumers before editing.
Extract my identity, experience, skills, projects, education, and approved contact.
Preserve every approved current record. Add historical evidence instead of replacing
or deleting current content. Ask about missing required facts or conflicts.
Do not invent dates, employers, metrics, credentials, or project results.
Replace fictional Alex Morgan content with facts I approve.
Keep source PDFs and private notes out of public assets and Git.
If dated roles or projects establish skill longevity, label the earliest evidence and
accumulated dated-role time precisely; do not imply uninterrupted daily use. Clearly
label old proficiency values as archived self-ratings, not certifications.
Put a hidden-until-opened search FAB on the main public résumé. Keep the detailed
historical evidence explorer owner-only in the private dashboard.
Update the public portfolio and metadata; preserve login and exercise shells.
Check 375px and 1440px layouts. Explain the edits and remaining unknowns.
```

## Done When

- No fictional/sample identity, project claims, or placeholder contact links remain.
- You can explain the evidence behind every public claim.
- Education and career history are truthful; academic/personal work is labeled.
- Existing current résumé entries remain intact after historical evidence is added.
- The main résumé FAB searches current roles, skills, projects, education, and approved
  historical evidence; its search UI is hidden until opened.
- Skill longevity comes from dated roles/projects, accumulated role time is labeled,
  and historical proficiency values are explicitly identified as self-ratings.
- The owner dashboard can search the detailed archive; guest interview roles cannot.
- Homepage, navigation, and metadata show the new identity.
- Lint, type check, and build pass; no horizontal overflow at either viewport.

The avatar uses initials, so there is no missing-photo dependency. Add a photo only
if desired, authorized, and tested. Do not add a PDF parser or new app scaffold.

## Boundaries, Do's and Don'ts

| Section | Do | Don't |
|---------|----|-------|
| PDF -> reviewed facts | Use redacted sources; ask about gaps and conflicts | Invent credentials or publish source PDFs |
| Historical archive | Normalize approved roles, projects, and skills; preserve provenance | Commit a raw CMS backup or treat an old bio as current truth |
| Skill depth | Derive dates from linked roles/projects and label archived self-ratings | Claim continuous use or present a self-rating as certification |
| Public portfolio | Add approved evidence and a résumé search FAB; preserve current records and schema | Delete current content, rewrite the app, change auth, or expose private job-search data |
| Private dashboard | Keep the complete evidence explorer owner-only | Expose detailed private tooling to shared recruiter credentials |
| Verification | Check every claim and both viewport sizes | Treat attractive output as evidence of truth |

## Bad Prompts

**Extraction:** "Make my resume impressive; fill in missing achievements and metrics."
This invents evidence rather than extracting it.

**Portfolio:** "Rebuild everything and put my resume and job applications online."
This expands scope and crosses the public/private boundary.

## Good Extraction Prompt

```text
Extract facts from my redacted resume and project notes into the existing profile
schema. If an older portfolio export is available, normalize its approved dated roles,
projects, skills, versions, and proficiency values into a separate evidence snapshot.
Do not remove current records. Label the old values and list conflicting or missing
facts for my review before changing files. Do not invent achievements or publish raw
source documents. Wait for my approval.
```

Use the good implementation prompt above only after approving the extracted facts.
Next: [build authentication](00-authentication.md) before opening private tools.
