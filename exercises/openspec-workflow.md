# Lesson 0 — OpenSpec workflow

Learn to agree on one lesson's outcome before asking an assistant to implement it.
First complete [student readiness](../docs/pre-class.md). The application already
supplies working features: inspect and verify them, then agree on a bounded
personalization or extension. Keep existing satisfied behavior.

## One lesson at a time

Explore → discuss examples and checks → refine → Propose → review → Apply → Verify.
Finish the current lesson's checks before beginning the next lesson. Propose only
that lesson; the course outline is not one implementation request.

| Stage | What you do | What permits the next stage |
|---|---|---|
| Explore | Paste the exercise's wrapper and full feature brief together | Existing behavior, unknowns, and scope are understood; no edits |
| Refine | Discuss examples, tradeoffs, prerequisites, and acceptance checks | You agree on the approach; discussion alone grants no writing permission |
| Propose | Invoke propose for one concrete named lesson change | Planning artifacts exist; implementation has not begun |
| Review | Read proposal, design, applicable delta specs, and tasks | Facts, access boundaries, files, and observable checks are acceptable |
| Apply | Explicitly invoke apply with that same change name | The assistant implements its task list and reports actual results |
| Verify | Run checks and inspect the lesson's expected outcomes | Checks pass and remaining unknowns are recorded |

## Assistant chat, not terminal commands

This clone includes `.agents/skills/openspec-*`. In Codex use the dollar forms
shown below. Other integrations use the syntax actually installed in their chat:
Claude Code commonly exposes `/opsx:explore`, `/opsx:propose`, `/opsx:apply`;
GitHub Copilot IDE exposes `/opsx-explore`, `/opsx-propose`, `/opsx-apply`.
Select the matching command from autocomplete. A skill-only assistant may expose
`/openspec-explore`, `/openspec-propose`, `/openspec-apply-change`.
If none appear, fix integration readiness before proceeding; do not type these
assistant invocations into a shell.

For example, during the Job Fit lesson, first paste its complete exploration
block, answer the questions, and refine the acceptance checks. Then in **chat**:

```text
$openspec-propose lesson-job-fit
Use our agreed Job Fit discussion only. Preserve satisfied behavior and other
tools. Write the proposal, design, applicable specs, and tasks. Do not implement.
```

Open the generated artifacts. Check one lesson scope, server-only provider calls,
owner authorization, truthful evidence, runtime validation, failures, and tests.
Request planning corrections before approval. After review, a separate **chat**:

```text
$openspec-apply-change lesson-job-fit
Implement the reviewed lesson change. Run its checks and report actual outcomes.
```

There is one initial apply for the current lesson's whole task list, rather than
an apply per prompt line. This is not a guarantee that one invocation succeeds.

## Same-change recovery

In the **terminal**, inspect the exact change when interrupted or a check fails:

```text
openspec status --change lesson-job-fit --json
openspec instructions apply --change lesson-job-fit --json
```

Record expected result, actual result, and the complete error with secrets removed.
Discuss a design problem and review any revised plan; otherwise resume with
`$openspec-apply-change lesson-job-fit`. Keep failed/unperformed checks unchecked.
Do not create a replacement change to disguise unfinished work or advance until
the lesson checks pass. If blocked, keep this lesson open and ask the instructor.

Sync, archive, sending, and live publication are separate actions after review.
Passing a lesson never performs them automatically. Local app checks use only
Firebase Auth, Hosting, Functions, Firestore, and Cloud Storage emulators; the deck opens as a local file.

Syntax references: [OpenSpec command forms](https://github.com/Fission-AI/OpenSpec/blob/main/docs/how-commands-work.md),
[OpenSpec installation](https://github.com/Fission-AI/OpenSpec#quick-start),
and [official Codex IDE setup](https://developers.openai.com/codex/ide/).

Previous: [pre-class setup](../docs/pre-class.md) · Next: [Lesson 1 — personalize your portfolio](00-personalize.md).
