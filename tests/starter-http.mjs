import { before, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const base = process.env.TEST_BASE_URL;
if (!base || !process.env.FIREBASE_AUTH_EMULATOR_HOST || !process.env.TEST_AUTH_USERS_FILE) throw new Error("Run npm run test:http to use the Firebase emulators.");
const users = JSON.parse(await readFile(process.env.TEST_AUTH_USERS_FILE, "utf8"));
const admin = getAuth(initializeApp({ projectId: process.env.GCLOUD_PROJECT }, "http-acceptance"));
const tokens = new Map();
function request(path, options = {}) {
  return fetch(`${base}${path}`, { ...options, redirect: "manual", signal: AbortSignal.timeout(30000) });
}
function jsonHeaders(cookie, client = "test-client", origin = base) {
  return { "Content-Type": "application/json", Origin: origin, "X-Forwarded-For": client, ...(cookie ? { Cookie: cookie } : {}) };
}
async function signIn(email, password) {
  const response = await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=emulator-only-key`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, returnSecureToken: true }) });
  assert.equal(response.status, 200, "Firebase emulator sign-in failed");
  return (await response.json()).idToken;
}
async function login(role, client = `${role}-session`) {
  const response = await request("/api/auth", { method: "POST", headers: jsonHeaders(undefined, client), body: JSON.stringify({ role, idToken: tokens.get(role) }) });
  assert.equal(response.status, 200);
  const cookie = response.headers.get("set-cookie");
  assert.ok(cookie, "The Hosting response must preserve Set-Cookie");
  return { response, cookie, pair: cookie.split(";", 1)[0] };
}
before(async () => {
  for (const user of users) tokens.set(user.role, await signIn(user.email, user.password));
});

test("project source notes stay behind owner authentication", async () => {
  const profile = JSON.parse(await readFile("data/profile.json", "utf8"));
  const publicHtml = await (await request("/")).text();
  for (const project of profile.projects) assert.equal(publicHtml.includes(project.evidence), false);
  assert.match(publicHtml, /Selected projects/);
  const { pair } = await login("terrell", "owner-evidence");
  const privateHtml = await (await request("/dashboard/resume", { headers: { Cookie: pair } })).text();
  const payload = JSON.parse(privateHtml.match(/<script id="page-data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
  assert.deepEqual(payload.resume.currentProjects, profile.projects);
});

test("public configuration exposes only Firebase browser settings", async () => {
  const response = await request("/api/auth/config");
  assert.equal(response.status, 200);
  const config = await response.json();
  assert.deepEqual(Object.keys(config).sort(), ["apiKey", "authDomain", "emulatorUrl", "projectId"]);
  assert.equal(config.projectId, process.env.GCLOUD_PROJECT);
  assert.equal(config.emulatorUrl, `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);
});

test("the portfolio is public and invalid sessions disclose no private pages", async () => {
  assert.equal((await request("/")).status, 200);
  for (const cookie of [undefined, "__session=forged-token"]) {
    for (const path of ["/dashboard", "/dashboard/fit-analyzer", "/dashboard/cover-letter", "/dashboard/career-plan", "/dashboard/resume", "/interview"]) {
      const response = await request(path, { headers: cookie ? { Cookie: cookie } : {} });
      assert.equal(response.status, 307, path);
      assert.equal(new URL(response.headers.get("location"), base).pathname, "/login");
      assert.match(response.headers.get("cache-control"), /private.*no-store/);
      assert.equal(await response.text(), "");
    }
  }
});

test("each private API denies unauthenticated requests before model calls", async () => {
  for (const path of ["/api/fit-analyzer", "/api/cover-letter", "/api/career-plan"]) {
    const response = await request(path, { method: "POST", body: "not-json" });
    assert.equal(response.status, 401);
    assert.match((await response.json()).error, /Sign in/);
  }
});

test("session exchange rejects wrong origins, invalid identities, and client-selected role escalation", async () => {
  const cases = [
    [{ role: "terrell", idToken: 42 }, 400],
    [{ role: "admin", idToken: tokens.get("terrell") }, 400],
    [{ role: "terrell", idToken: "forged-token" }, 401],
    [{ role: "terrell", idToken: tokens.get("recruiter") }, 403],
    [{ role: "terrell", password: "legacy-password" }, 400],
  ];
  for (const [body, status] of cases) {
    const response = await request("/api/auth", { method: "POST", headers: jsonHeaders(undefined, "invalid-login"), body: JSON.stringify(body) });
    assert.equal(response.status, status);
    assert.equal(response.headers.get("set-cookie"), null);
  }
  const rejected = await request("/api/auth", { method: "POST", headers: jsonHeaders(undefined, "origin-check", "https://untrusted.example"), body: JSON.stringify({ role: "terrell", idToken: tokens.get("terrell") }) });
  assert.equal(rejected.status, 403);
  const wrongType = await request("/api/auth", { method: "POST", body: "{}" });
  assert.equal(wrongType.status, 415);
  const unassigned = await signIn("unassigned@example.test", "Emulator-Only-84!");
  assert.equal((await request("/api/auth", { method: "POST", headers: jsonHeaders(undefined, "unassigned"), body: JSON.stringify({ role: "terrell", idToken: unassigned }) })).status, 403);
});

test("owner Firebase sessions use four-hour secure cookies and open private pages", async () => {
  const { cookie, pair } = await login("terrell");
  for (const pattern of [/^__session=/, /HttpOnly/i, /SameSite=Strict/i, /Max-Age=14400/i, /Secure/i]) assert.match(cookie, pattern);
  for (const [path, text] of [["/dashboard", /Your next four builds/], ["/dashboard/fit-analyzer", /id="jd"/], ["/dashboard/resume", /The evidence behind the timeline/], ["/interview", /Terrell Singleton/]]) {
    const response = await request(path, { headers: { Cookie: pair } });
    assert.equal(response.status, 200, path);
    assert.match(await response.text(), text);
  }
});

test("interviewer and recruiter have the same guest access and no owner access", async () => {
  for (const role of ["recruiter", "interviewer"]) {
    const { pair } = await login(role);
    const interview = await request("/interview", { headers: { Cookie: pair } });
    assert.equal(interview.status, 200);
    const guestHtml = await interview.text();
    assert.match(guestHtml, /Interview questions/);
    assert.doesNotMatch(guestHtml, /\bSTAR\b|\b(?:Situation|Task|Action|Result):/i);
    for (const path of ["/dashboard", "/dashboard/resume", "/dashboard/fit-analyzer"]) {
      const response = await request(path, { headers: { Cookie: pair } });
      assert.equal(response.status, 307);
      assert.equal(response.headers.get("location"), "/interview");
    }
    for (const path of ["/api/fit-analyzer", "/api/cover-letter", "/api/career-plan"]) assert.equal((await request(path, { method: "POST", headers: jsonHeaders(pair) })).status, 403);
  }
});

test("authenticated tools retain validation and explicit missing-provider failures", async () => {
  const { pair } = await login("terrell", "owner-tools");
  for (const path of ["/api/fit-analyzer", "/api/cover-letter", "/api/career-plan"]) {
    for (const jobDescription of [" ", "a".repeat(5001)]) {
      assert.equal((await request(path, { method: "POST", headers: jsonHeaders(pair), body: JSON.stringify({ jobDescription }) })).status, 400);
    }
    const result = await request(path, { method: "POST", headers: jsonHeaders(pair), body: JSON.stringify({ jobDescription: "Software Engineer at Example Co", tone: "technical", mode: "study", weeklyHours: 5 }) });
    assert.equal(result.status, 503);
    assert.match((await result.json()).error, /AI_PROVIDER/);
  }
});

test("logout checks origin and clears the Hosting session cookie", async () => {
  const { pair } = await login("terrell", "owner-logout");
  assert.equal((await request("/api/auth", { method: "DELETE", headers: { Origin: "https://untrusted.example", Cookie: pair } })).status, 403);
  const response = await request("/api/auth", { method: "DELETE", headers: { Origin: base, Cookie: pair } });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie"), /__session=;.*Max-Age=0/);
  assert.equal((await request("/api/fit-analyzer", { method: "POST" })).status, 401);
});

test("session exchange rate limits repeated invalid identity tokens", async () => {
  for (let attempt = 0; attempt < 10; attempt++) assert.equal((await request("/api/auth", { method: "POST", headers: jsonHeaders(undefined, "limited-client"), body: JSON.stringify({ role: "terrell", idToken: "invalid" }) })).status, 401);
  const response = await request("/api/auth", { method: "POST", headers: jsonHeaders(undefined, "limited-client"), body: JSON.stringify({ role: "terrell", idToken: "invalid" }) });
  assert.equal(response.status, 429);
  assert.match(response.headers.get("retry-after"), /^\d+$/);
});

test("recordings remain private and unknown API routes or methods fail", async () => {
  for (const path of ["/interview/missing.mp4", "/interview%2fmissing.mp4"]) assert.equal((await request(path)).status, 307);
  assert.equal((await request("/api/auth")).status, 405);
  assert.equal((await request("/api/missing")).status, 404);
  assert.equal((await request("/does-not-exist")).status, 404);
});

test("revoked Firebase sessions cannot keep using private routes", async () => {
  const { pair } = await login("recruiter", "revoke-client");
  await new Promise((resolve) => setTimeout(resolve, 1100));
  await admin.revokeRefreshTokens(users.find((user) => user.role === "recruiter").uid);
  const response = await request("/interview", { headers: { Cookie: pair } });
  assert.equal(response.status, 307);
  assert.equal(response.headers.get("location"), "/login");
});
