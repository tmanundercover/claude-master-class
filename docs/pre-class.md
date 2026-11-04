# Before Class: Student Setup

**Goal:** arrive with the supplied website running, OpenSpec ready, and your redacted resume PDF.
It works on **Mac and Windows**. Where a step differs, both are shown.

| Step | What you set up | Why |
|---|---|---|
| 1 | VS Code | Where you build |
| 2 | GitHub account | Where your code lives |
| 3 | One coding assistant | Writes the code with you |
| 4 | Git + the masterclass code | Your copy of the project |
| 5 | Node.js + a check run | Runs the sample website on your laptop |
| 6 | AI provider access | Powers four career tool entries when using a real provider |
| 7 | Your resume and a job description | What you build from in class |

Steps 1 to 3 get your editor ready. From step 4, your coding assistant can do most of the work:
each step has a prompt to paste, with the by-hand commands as a fallback.

## 1. Install VS Code

Download and install [VS Code](https://code.visualstudio.com/), then open it.

We use VS Code in class. Already use another editor with a coding assistant built in,
such as Cursor or Windsurf? That works too. The steps are the same; open the folder there instead.

## 2. Create a GitHub Account

1. Create a free account at [github.com/signup](https://github.com/signup) and verify your email.
2. In VS Code, click the **Accounts** icon (bottom left) -> **Sign in with GitHub** and complete the browser sign-in.

## 3. Set Up One Coding Assistant

The assistant reads your project, edits files and runs terminal commands for you. Pick **one**.
Confirm current account access and usage limits with your chosen provider before class.

| Assistant | Official setup |
|---|---|
| GitHub Copilot | [VS Code setup](https://code.visualstudio.com/docs/copilot/setup) |
| Claude Code | [VS Code extension](https://code.claude.com/docs/en/vs-code) |
| OpenAI Codex | [Official IDE extension setup](https://developers.openai.com/codex/ide/) |

Install your chosen provider's official extension, sign in, and open its chat in
this project folder. Use its agent capability for implementation after reviewing
the lesson proposal. The OpenSpec introduction distinguishes planning from edits.

**Check it works:** send `Hello, can you see my files?` in the assistant's chat. It should reply.
When it asks for permission to edit a file or run a command, read what it wants to do, then allow it.

## 4. Get the Masterclass Code

**The fast way.** Open VS Code with any folder you keep projects in (**File -> Open Folder**,
for example `Documents`). Paste this into your coding assistant's chat:

```text
I'm setting up my laptop for a class. Please do this step by step:
1. Check whether Git is installed. If it isn't, install it for me
   if you can; otherwise tell me exactly how, and wait until I confirm.
2. Clone https://github.com/nahidfar/claude-master-class.git
   into a new folder called my-portfolio here.
Stop when the clone is done and tell me the full path of my-portfolio.
```

Then open the new folder: **File -> Open Folder -> my-portfolio**.
You should see `package.json` and `package-lock.json` in the VS Code Explorer.

**By hand.** Install [Git](https://git-scm.com/downloads) (on a Mac it may already be installed),
reopen VS Code, select **Terminal -> New Terminal**, and run each command separately:

```
git --version
git clone --branch main https://github.com/nahidfar/claude-master-class.git my-portfolio
cd my-portfolio
code .
```

If `code .` is not recognized, use **File -> Open Folder** and select the cloned `my-portfolio` folder.

**Already cloned it before?** Open that folder and inspect `git status` first. Preserve local work; coordinate with your instructor before pulling updates into a dirty tree.
**Clone once. Do not clone individual folders or copy `node_modules`.**

## 5. Install Node.js and Check the Sample Website

The Firestore and Storage emulators also need Java. Install Java JDK 21+ and
confirm `java -version` works in your terminal before running the checks below.
See [Firebase's Java guidance](https://firebase.google.com/docs/emulator-suite/connect_firestore).

**The fast way.** In the `my-portfolio` window, paste this into your coding assistant's chat:

```text
This is my class project. Please get it running:
1. Check that Node.js 22.18 or newer and npm are installed. If not,
   install Node.js LTS for me if you can; otherwise tell me exactly
   how, and wait until I confirm.
2. Run npm ci, npm ci --prefix functions, then npm run preflight.
3. Start npm run dev and give me the local URL.
If a step fails, show me the error, explain it in one line,
fix it, and run the step again. Don't delete package-lock.json
or run npm audit fix --force. Finish with a short summary of
what passed and anything I still need to do.
```

**By hand.**
1. Install [Node.js LTS](https://nodejs.org/en/download), **22.18 or newer**. npm comes with it.
2. Close and reopen VS Code, open **Terminal -> New Terminal** in `my-portfolio`, and run:

```
npm config get registry
node --version
npm --version
npm ci
npm ci --prefix functions
npm run preflight
npm run dev
```

`npm ci` installs the app's libraries, **not npm itself**. There is no separate command to install npm.
**Windows only:** if PowerShell blocks `npm.ps1`, use `npm.cmd` instead of `npm`.

The first command shows where npm downloads packages. The repository lockfile uses the standard
public npm registry and also works with compatible company or school mirrors. If `npm ci` reports
`404 Not Found` from a custom package feed, do not delete the lockfile. If your network permits
public npm access, retry just that installation with:

```
npm ci --registry=https://registry.npmjs.org/
```

On a managed network that blocks public npm, share the complete error with your instructor or
support contact so the mirror can be checked.

**Pass:** Node is 22.18+, the checks in `npm run preflight` finish without errors, and the sample
portfolio opens at the local URL, usually **http://127.0.0.1:5500**. Stop the Firebase emulators with Ctrl+C.
Login and four career tool entries are supplied: Job Fit, Cover Letter,
Interview Prep / Study Plan (one entry, two modes), and Resume Tailor. Sign in
with the demo accounts in the ignored `.firebase/auth-users.local.json` manifest.
An unauthenticated API returns 401; a guest calling an owner API receives 403.
Missing provider/storage configuration is a visible configuration failure, not an
unfinished endpoint. Interview media may be absent and must have honest placeholders.
Inbox/contact practice uses isolated local fixtures and sends no real mail.
Saved jobs, versioned artifacts, and application PDFs are separate work in progress;
read current [workspace documentation](job-workspaces.md) and change status before
teaching extensions. They are not completion claims of this curriculum.

**If a step fails:** copy the whole error, paste it into your coding assistant and ask it to fix it.
That's also how we work in class. Do not delete the lockfile or run force-fix commands.

## 6. Prepare backend AI configuration

Four career tool entries can call the shared server model adapter. Your coding
assistant subscription and application API usage are separate. Choose a supported
provider and check its current access, model, and billing requirements:
[OpenAI](https://platform.openai.com/api-keys),
[Anthropic](https://console.anthropic.com/settings/keys), or
[Gemini](https://aistudio.google.com/apikey). OpenAI-compatible endpoints are also
supported by the existing adapter. No fixed credit amount guarantees class usage.

Keep `AI_PROVIDER`, `AI_MODEL`, `AI_API_KEY`, and optional `AI_BASE_URL` /
`AI_REASONING_EFFORT` in backend configuration. Do not paste keys into chat, email,
Git, or frontend variables. Preserve every existing `.env.*` value. Inspect names
in `functions/.env.example`; do not copy it over an existing credential file.
Only enter your own approved values privately when needed. Deterministic fixture
checks need no paid provider and do not measure real writing quality.

You can finish setup without a real model key. See the
[Firebase guide](deploy-firebase.md) for server configuration and fixture boundaries.

## 7. Bring This to Class

- [ ] Sample homepage working.
- [ ] VS Code open with the student app and your coding assistant signed in.
- [ ] Your own provider access if needed for real writing, kept private.
- [ ] OpenSpec CLI and chosen assistant integration verified below.
- [ ] Your **redacted resume PDF** (no phone number or home address), plus plain text as a fallback.
- [ ] One target job description, at most 15,000 characters.
- [ ] Optional: a square photo of yourself for your portfolio.

**At the start of class:** attach the PDF in your coding assistant's chat,
not on the website. If PDF attachments are unsupported, paste the redacted text.
The website has no PDF upload feature. Do not put raw resumes in public folders or Git.

Next time you open the app, open the same cloned folder and run
`npm run dev`. No need to clone or install again unless dependencies change.

## 8. Check OpenSpec before initialization

In the project terminal, run these read-only checks first:

```text
openspec --version
openspec list --json
```

This curriculum was checked with OpenSpec 1.14.1. If the executable is absent,
install the [official npm package](https://github.com/Fission-AI/OpenSpec#quick-start)
with `npm install -g @fission-ai/openspec@1.14.1`, then rerun the checks.
The existing clone should return a `root` object. Read `.agents/skills/` and confirm
the explore, propose, and apply skills are available to your chosen assistant.
Use the [workflow introduction](../exercises/openspec-workflow.md) invocation table.
Seeing files alone is insufficient: confirm the assistant can discover/read them.

Do not initialize an already-configured clone again. A root/store declaration
error needs its stated repair, not a new local root. Only for a genuinely
uninitialized student project, after agreeing that initialization is wanted,
run `openspec init --tools codex` (or `claude` / `github-copilot` for the selected
integration). Review the files it creates and recheck discovery. Missing integration
in an initialized clone needs deliberate setup review; do not silently overwrite
workflow configuration or installed skills. Restart the assistant if necessary.

Start [Lesson 0](../exercises/openspec-workflow.md), then complete one lesson at a
time. The introductory session can stop after Lesson 5 once its checks pass;
Lessons 6–10 are continuation material. There is no promise to finish the expanded
series in one 90-minute session.
