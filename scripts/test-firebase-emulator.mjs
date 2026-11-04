import { readFile, writeFile, rm, mkdtemp, cp, mkdir, symlink } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

// Tests get their own Functions package and synthetic environment. Real .env files are never read or rewritten.
let fixtureEnvironment = "RESEND_MODE=fixture\nRESEND_INBOX_ID=fixture-owner\nRESEND_WEBHOOK_SECRET=whsec_Zml4dHVyZS1zaWduaW5nLXNlY3JldA==\nAI_API_KEY=unused-emulator-key\nAI_PROVIDER=\nAI_MODEL=\nAI_BASE_URL=\nAI_REASONING_EFFORT=\n";
const isolatedFunctions = `.firebase-test-functions-${randomUUID()}`;
const configDirectory = await mkdtemp(join(tmpdir(), "portfolio-firebase-test-"));
const configPath = `.firebase-test-${randomUUID()}.json`;
fixtureEnvironment += 'JOB_WORKSPACE_MODE=emulator\n';

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
  for (const name of ["auth", "hosting", "functions", "firestore", "storage", "hub", "logging"]) config.emulators[name] = { host: "127.0.0.1", port: await unusedPort() };
  await mkdir(isolatedFunctions);
  for (const file of ['package.json', 'index.mjs', 'app.mjs']) await cp(join('functions', file), join(isolatedFunctions, file));
  await cp('functions/dist', join(isolatedFunctions, 'dist'), { recursive: true });
  await symlink(resolve('functions/node_modules'), join(isolatedFunctions, 'node_modules'), 'dir');
  await symlink(resolve('functions/public'), join(isolatedFunctions, 'public'), 'dir');
  await writeFile(join(isolatedFunctions, '.env.local'), fixtureEnvironment, { mode: 0o600 });
  for (const functionsConfig of config.functions) functionsConfig.source = isolatedFunctions;
  await writeFile(configPath, JSON.stringify(config));
  if (process.argv.includes('--model-fixtures')) {
    const bundlePath = join(isolatedFunctions, 'dist/server/entry-server.js');
    let bundle = await readFile(bundlePath, 'utf8');
    const provenanceSignature = 'function generationProvenance() {';
    if (bundle.split(provenanceSignature).length !== 2) throw new Error('Expected one provenance helper for emulator injection.');
    bundle = bundle.replace(provenanceSignature, `${provenanceSignature} return { provider: 'controlled-fixture', model: 'synthetic' };`);
    const signature = 'async function generateJson(request, call) {';
    if (bundle.split(signature).length !== 2) throw new Error('Expected one generated model helper for controlled emulator injection.');
    const fixtureURL = pathToFileURL(resolve('scripts/emulator-model-fixture.mjs')).href;
    await writeFile(bundlePath, `import { emulatorModelFixture } from ${JSON.stringify(fixtureURL)};\n` + bundle.replace(signature, `${signature}
      if (JSON.parse(request.prompt).untrustedJobDescription?.includes('[fixture:')) {
        if (process.env.FUNCTIONS_EMULATOR !== 'true') throw new Error('Controlled model fixtures require the Functions emulator.');
        return emulatorModelFixture(request, { ModelError });
      }
    `));
  }
  const childEnvironment = { ...process.env };
  // Firebase debug output may include inherited environment variables. Do not pass real credentials to tests.
  for (const key of Object.keys(childEnvironment)) if (/API_KEY|TOKEN|SECRET|PASSWORD|CREDENTIALS/.test(key)) delete childEnvironment[key];
  delete childEnvironment.DEBUG;
  child = spawn(process.execPath, [
    "node_modules/firebase-tools/lib/bin/firebase.js",
    "emulators:exec", "--inspect-functions", String(await unusedPort()), "--config", configPath, "--only", "auth,hosting,functions,firestore,storage", "--project", "demo-portfolio-migration",
    "node scripts/run-emulator-tests.mjs",
  ], {
    stdio: "inherit",
    env: {
      ...childEnvironment,
      // Firebase Storage deletes its blob directory on shutdown. Give each test
      // suite its own OS temp root so it cannot delete a running dev suite's data.
      TMPDIR: configDirectory,
      TMP: configDirectory,
      TEMP: configDirectory,
      XDG_CONFIG_HOME: configDirectory,
      GCLOUD_PROJECT: "demo-portfolio-migration",
      FIREBASE_AUTH_EMULATOR_HOST: `127.0.0.1:${config.emulators.auth.port}`,
      FIRESTORE_EMULATOR_HOST: `127.0.0.1:${config.emulators.firestore.port}`,
      FIREBASE_STORAGE_EMULATOR_HOST: `127.0.0.1:${config.emulators.storage.port}`,
      FUNCTIONS_EMULATOR: 'true',
      JOB_WORKSPACE_MODE: 'emulator',
      TEST_AUTH_USERS_FILE: join(configDirectory, "auth-users.json"),
      ...(process.argv.includes("--browser-script") ? { TEST_BROWSER_SCRIPT: process.argv[process.argv.indexOf("--browser-script") + 1] } : {}),
      TEST_BASE_URL: `http://127.0.0.1:${config.emulators.hosting.port}`,
      ...(process.argv.includes('--model-fixtures') ? { TEST_MODEL_FIXTURES: 'true' } : {}),
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
  await rm(isolatedFunctions, { recursive: true, force: true });
  await rm(configDirectory, { recursive: true, force: true });
  await rm(configPath, { force: true });
}
