import { seedAuthEmulator } from "./seed-auth-emulator.mjs";
import { spawn } from "node:child_process";
import { getAuth } from "firebase-admin/auth";
import { getApps } from "firebase-admin/app";

await seedAuthEmulator({ projectId: process.env.GCLOUD_PROJECT, host: process.env.FIREBASE_AUTH_EMULATOR_HOST, credentialsPath: process.env.TEST_AUTH_USERS_FILE, password: "Emulator-Only-84!" });
const app = getApps().find((app) => app.options.projectId === process.env.GCLOUD_PROJECT);
await getAuth(app).createUser({ email: "unassigned@example.test", password: "Emulator-Only-84!" });
const storageTests = spawn(process.execPath, ['--experimental-strip-types', '--test', '--test-concurrency=1', 'tests/job-storage-emulator.mjs'], { stdio: 'inherit', env: process.env });
const storageCode = await new Promise((resolve, reject) => { storageTests.once('error', reject); storageTests.once('exit', code => resolve(code ?? 1)); });
if (storageCode !== 0) process.exit(storageCode);
const args = process.env.TEST_BROWSER_SCRIPT ? [process.env.TEST_BROWSER_SCRIPT] : ["--test", "--test-concurrency=1", "tests/job-workspaces-http.mjs", "tests/profile-photo-http.mjs", "tests/starter-http.mjs"];
const child = spawn(process.execPath, args, { stdio: "inherit", env: process.env });
process.exitCode = await new Promise((resolve, reject) => { child.once("error", reject); child.once("exit", (code) => resolve(code ?? 1)); });
