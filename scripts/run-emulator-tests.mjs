import { seedAuthEmulator } from "./seed-auth-emulator.mjs";
import { spawn } from "node:child_process";
import { getAuth } from "firebase-admin/auth";
import { getApps } from "firebase-admin/app";

await seedAuthEmulator({ projectId: process.env.GCLOUD_PROJECT, host: process.env.FIREBASE_AUTH_EMULATOR_HOST, credentialsPath: process.env.TEST_AUTH_USERS_FILE, password: "Emulator-Only-84!" });
const app = getApps().find((app) => app.options.projectId === process.env.GCLOUD_PROJECT);
await getAuth(app).createUser({ email: "unassigned@example.test", password: "Emulator-Only-84!" });
const args = process.env.TEST_BROWSER_SCRIPT ? [process.env.TEST_BROWSER_SCRIPT] : ["--test", "tests/starter-http.mjs"];
const child = spawn(process.execPath, args, { stdio: "inherit", env: process.env });
process.exitCode = await new Promise((resolve, reject) => { child.once("error", reject); child.once("exit", (code) => resolve(code ?? 1)); });
