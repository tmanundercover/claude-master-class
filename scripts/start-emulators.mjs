import { spawn } from "node:child_process";
import { readFile, access } from "node:fs/promises";
import { seedAuthEmulator } from "./seed-auth-emulator.mjs";

const projectId = "demo-portfolio-local";
const config = JSON.parse(await readFile("firebase.json", "utf8"));
const authHost = `${config.emulators.auth.host}:${config.emulators.auth.port}`;
const data = ".firebase/emulator-data";
let imported = [];
try { await access(`${data}/firebase-export-metadata.json`); imported = ["--import", data]; }
catch (error) { if (error.code !== "ENOENT") throw error; }
const child = spawn(process.execPath, ["node_modules/firebase-tools/lib/bin/firebase.js", "emulators:start", "--only", "auth,hosting,functions", "--project", projectId, "--export-on-exit", data, ...imported], { stdio: "inherit" });
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
