import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { randomBytes } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

const accounts = [
  { role: "terrell", email: "Terrell.singleton@gmail.com" },
  { role: "interviewer", email: "Terrell.singleton+interviewer@gmail.com" },
  { role: "recruiter", email: "Terrell.singleton+recruiter@gmail.com" },
];

export async function seedAuthEmulator({ projectId, host, credentialsPath, password }) {
  if (!projectId.startsWith("demo-") || !/^127\.0\.0\.1:\d+$/.test(host)) throw new Error("Seeding is restricted to a local Auth emulator and demo project.");
  process.env.FIREBASE_AUTH_EMULATOR_HOST = host;
  const app = getApps().find((app) => app.options.projectId === projectId) ?? initializeApp({ projectId }, `seed-${projectId}`);
  const auth = getAuth(app);
  let previous = [];
  try { previous = JSON.parse(await readFile(credentialsPath, "utf8")); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  const users = [];
  for (const account of accounts) {
    const saved = previous.find((item) => item.role === account.role && item.email === account.email);
    const accountPassword = saved?.password || password || randomBytes(24).toString("base64url");
    let user;
    try { user = await auth.getUserByEmail(account.email); }
    catch (error) {
      if (error.code !== "auth/user-not-found") throw error;
      user = await auth.createUser({ email: account.email, password: accountPassword, emailVerified: true, displayName: account.role === "terrell" ? "Terrell Singleton" : account.role });
    }
    await auth.setCustomUserClaims(user.uid, { ...user.customClaims, portfolioRole: account.role });
    users.push({ ...account, uid: user.uid, password: accountPassword });
  }
  await mkdir(dirname(credentialsPath), { recursive: true });
  await writeFile(credentialsPath, JSON.stringify(users, null, 2) + "\n", { mode: 0o600 });
  console.log(`Seeded ${users.length} Auth emulator roles. Local credentials: ${credentialsPath}`);
  return users;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const config = JSON.parse(await readFile("firebase.json", "utf8"));
  await seedAuthEmulator({ projectId: "demo-portfolio-local", host: `${config.emulators.auth.host}:${config.emulators.auth.port}`, credentialsPath: ".firebase/auth-users.local.json" });
}
