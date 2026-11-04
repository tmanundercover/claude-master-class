import { spawn } from "node:child_process";
import { readFile, access, mkdir } from "node:fs/promises";
import { resolve } from 'node:path';
import { seedAuthEmulator } from "./seed-auth-emulator.mjs";

const projectId = "demo-portfolio-local";
const config = JSON.parse(await readFile("firebase.json", "utf8"));
const authHost = `${config.emulators.auth.host}:${config.emulators.auth.port}`;
const data = ".firebase/emulator-data";
const tempDirectory = resolve('.firebase/emulator-tmp');
await mkdir(tempDirectory, { recursive: true, mode: 0o700 });
let imported = [];
try { await access(`${data}/firebase-export-metadata.json`); imported = ["--import", data]; }
catch (error) { if (error.code !== "ENOENT") throw error; }
// In-process fixtures require one Functions process across concurrent browser requests.
let mailFixture = process.env.RESEND_MODE === 'fixture';
try { mailFixture ||= /^\s*RESEND_MODE\s*=\s*["']?fixture["']?\s*(?:#.*)?$/m.test(await readFile('functions/.env.local', 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const fixtureArgs = mailFixture ? ['--inspect-functions', process.env.FUNCTIONS_DEBUG_PORT || '9229'] : [];
const child = spawn(process.execPath, ["node_modules/firebase-tools/lib/bin/firebase.js", "emulators:start", "--only", "auth,hosting,functions,firestore,storage", "--project", projectId, ...fixtureArgs, "--export-on-exit", data, ...imported], {
  stdio: 'inherit',
  // Forward terminal Ctrl+C once. Two SIGINTs make Firebase abort its data export.
  detached: process.platform !== 'win32',
  env: { ...process.env, TMPDIR: tempDirectory, TMP: tempDirectory, TEMP: tempDirectory, JOB_WORKSPACE_EMULATORS: 'true' },
});
let exited = false;
const completion = new Promise((resolve, reject) => {
  child.once("error", reject);
  child.once("exit", (code) => { exited = true; resolve(code ?? 1); });
});
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => child.kill(signal));
try {
  let ready = false;
  for (let attempt = 0; attempt < 120 && !exited; attempt++) {
    try {
      const response = await fetch(`http://${authHost}/emulator/v1/projects/${projectId}/config`, { signal: AbortSignal.timeout(1000) });
      if (response.ok) { ready = true; break; }
    } catch { /* Wait for the Auth emulator, without opening a separate server. */ }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!ready) throw new Error("The Auth emulator did not start. Check the Firebase CLI output.");
  await seedAuthEmulator({ projectId, host: authHost, credentialsPath: ".firebase/auth-users.local.json" });
  console.log(`Open Hosting: http://${config.emulators.hosting.host}:${config.emulators.hosting.port}`);
  console.log("After editing source, run npm run build:firebase and refresh the browser.");
  process.exitCode = await completion;
} catch (error) {
  child.kill("SIGTERM");
  await completion;
  throw error;
}
