import { readFile, writeFile, rm, mkdtemp } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";
import { randomUUID } from "node:crypto";

const fixtures = new Map([
  ["functions/.env.local", "AI_API_KEY=unused-emulator-key\nAI_PROVIDER=\nAI_MODEL=\nAI_BASE_URL=\nAI_REASONING_EFFORT=\n"],
]);
const previous = new Map();
const configDirectory = await mkdtemp(join(tmpdir(), "portfolio-firebase-test-"));
const configPath = `.firebase-test-${randomUUID()}.json`;
async function unusedPort() {
  const server = createServer();
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}
let child;
try {
  const config = JSON.parse(await readFile("firebase.json", "utf8"));
  for (const name of ["auth", "hosting", "functions", "hub", "logging"]) config.emulators[name] = { host: "127.0.0.1", port: await unusedPort() };
  await writeFile(configPath, JSON.stringify(config));
  for (const [path, content] of fixtures) {
    try { previous.set(path, await readFile(path)); }
    catch (error) { if (error.code !== "ENOENT") throw error; previous.set(path, null); }
    await writeFile(path, content, { mode: 0o600 });
  }
  child = spawn(process.execPath, [
    "node_modules/firebase-tools/lib/bin/firebase.js",
    "emulators:exec", "--config", configPath, "--only", "auth,hosting,functions", "--project", "demo-portfolio-migration",
    "node scripts/run-emulator-tests.mjs",
  ], {
    stdio: "inherit",
    env: {
      ...process.env,
      XDG_CONFIG_HOME: configDirectory,
      GCLOUD_PROJECT: "demo-portfolio-migration",
      FIREBASE_AUTH_EMULATOR_HOST: `127.0.0.1:${config.emulators.auth.port}`,
      TEST_AUTH_USERS_FILE: join(configDirectory, "auth-users.json"),
      ...(process.argv.includes("--browser-script") ? { TEST_BROWSER_SCRIPT: process.argv[process.argv.indexOf("--browser-script") + 1] } : {}),
      TEST_BASE_URL: `http://127.0.0.1:${config.emulators.hosting.port}`,
      FIREBASE_CLI_DISABLE_MOTD: "true",
      CI: "true",
    },
  });
  for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => child.kill(signal));
  process.exitCode = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });
} finally {
  for (const [path, content] of previous) {
    if (content === null) await rm(path, { force: true });
    else await writeFile(path, content);
  }
  await rm(configDirectory, { recursive: true, force: true });
  await rm(configPath, { force: true });
}
