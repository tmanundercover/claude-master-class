import { createHmac } from "node:crypto";
import { before, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

import { emulatorUserToken, emulatorPasswordToken, emulatorGoogleToken } from "../scripts/emulator-auth.mjs";

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
const signIn = emulatorPasswordToken;

async function login(role, client = `${role}-session`) {
  const response = await request("/api/auth", { method: "POST", headers: jsonHeaders(undefined, client), body: JSON.stringify({ role, idToken: tokens.get(role) }) });
  assert.equal(response.status, 200);
  const cookie = response.headers.get("set-cookie");
  assert.ok(cookie, "The Hosting response must preserve Set-Cookie");
  return { response, cookie, pair: cookie.split(";", 1)[0] };
}
before(async () => {
  for (const user of users) tokens.set(user.role, await emulatorUserToken(user));
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
    for (const path of ["/dashboard", "/dashboard/fit-analyzer", "/dashboard/cover-letter", "/dashboard/career-plan", "/dashboard/resume-tailor", "/dashboard/resume", "/dashboard/inbox", "/interview"]) {
      const response = await request(path, { headers: cookie ? { Cookie: cookie } : {} });
      assert.equal(response.status, 307, path);
      assert.equal(new URL(response.headers.get("location"), base).pathname, "/login");
      assert.match(response.headers.get("cache-control"), /private.*no-store/);
      assert.equal(await response.text(), "");
    }
  }
});

test("each private API denies unauthenticated requests before model calls", async () => {
  for (const path of ["/api/fit-analyzer", "/api/cover-letter", "/api/career-plan", "/api/resume-tailor"]) {
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
  for (const [path, text] of [["/dashboard", /Your workspace/], ["/dashboard/fit-analyzer", /id="jd"/], ["/dashboard/resume-tailor", /id="jd"/], ["/dashboard/resume", /The evidence behind the timeline/], ["/interview", /Terrell Singleton/]]) {
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
    for (const path of ["/dashboard", "/dashboard/resume", "/dashboard/inbox", "/dashboard/fit-analyzer", "/dashboard/resume-tailor"]) {
      const response = await request(path, { headers: { Cookie: pair } });
      assert.equal(response.status, 307);
      assert.equal(response.headers.get("location"), "/interview");
    }
    for (const path of ["/api/fit-analyzer", "/api/cover-letter", "/api/career-plan", "/api/resume-tailor"]) assert.equal((await request(path, { method: "POST", headers: jsonHeaders(pair) })).status, 403);
  }
});

test("authenticated tools retain validation and explicit missing-provider failures", async () => {
  const { pair } = await login("terrell", "owner-tools");
  for (const path of ["/api/fit-analyzer", "/api/cover-letter", "/api/career-plan", "/api/resume-tailor"]) {
    for (const jobDescription of [" ", "a".repeat(15001)]) {
      assert.equal((await request(path, { method: "POST", headers: jsonHeaders(pair), body: JSON.stringify({ jobDescription }) })).status, 400);
    }
    // Accept the decoded 15,000-character boundary even when JSON escaping exceeds 20,000 characters.
    for (const jobDescription of ["a".repeat(15000), '"\\\n'.repeat(5000)]) {
      assert.equal(jobDescription.length, 15000);
      const accepted = await request(path, { method: "POST", headers: jsonHeaders(pair), body: JSON.stringify({ jobDescription }) });
      assert.equal(accepted.status, 503, `${path} accepts 15,000 characters and reaches the unconfigured provider`);
      assert.match((await accepted.json()).error, /AI_PROVIDER/);
    }
    const result = await request(path, { method: "POST", headers: jsonHeaders(pair), body: JSON.stringify({ jobDescription: "Software Engineer at Example Co", tone: "technical", mode: "study", weeklyHours: 5 }) });
    assert.equal(result.status, 503);
    assert.match((await result.json()).error, /AI_PROVIDER/);
  }
});

test("controlled model fixtures exercise owner generation and route failures", { skip: process.env.TEST_MODEL_FIXTURES !== "true" }, async () => {
  const { pair } = await login("terrell", "owner-controlled-models");
  for (const path of ["/api/resume-tailor", "/api/fit-analyzer", "/api/cover-letter", "/api/career-plan"]) {
    const post = (jobDescription, extra = {}, origin = base) => request(path, { method: "POST", headers: jsonHeaders(pair, "controlled-models", origin), body: JSON.stringify({ jobDescription, ...extra }) });
    assert.equal((await post("[fixture:success] React developer at Example", {}, "https://evil.example")).status, 403);
    const success = await post("[fixture:success] React developer at Example");
    assert.equal(success.status, 200, path);
    const value = await success.json();
    if (path.endsWith("resume-tailor")) {
      assert.equal(value.document.experience.length, 1);
      assert.equal(value.document.projects.length, 1);
      assert.equal(value.document.name, JSON.parse(await readFile("data/profile.json", "utf8")).name);
      assert.ok(!("sources" in value));
      assert.ok(!JSON.stringify(value.document).includes("CONTROLLED-REVIEW-NOTE"));
    }
    if (path.endsWith("fit-analyzer")) {
      assert.equal(value.version, 2);
      assert.equal(value.score, 100);
      assert.deepEqual(value.breakdown.map(group => group.effectiveWeight), [100, 0, 0]);
      assert.equal(value.requirements[0].status, 'supported');
      assert.equal(value.requirements[0].references[0].text, 'React');
      assert.equal(value.location.status, 'not_stated');
      for (const marker of ['fit-unknown-reference', 'fit-provider-score']) assert.equal((await post(`[fixture:${marker}] React developer`)).status, 502);
    }
    for (const [marker, status] of [["malformed", 502], ["provider-error", 502], ["rate-limit", 429]]) {
      const failure = await post(`[fixture:${marker}] React developer at Example`);
      assert.equal(failure.status, status, `${path} ${marker}`);
      if (status === 429) assert.equal(failure.headers.get("retry-after"), "17");
      const body = await failure.json(); assert.equal(typeof body.error, "string"); assert.equal(body.document, undefined);
    }
    if (path.endsWith("career-plan")) assert.equal((await post("[fixture:success] React developer at Example", { mode: "study", weeklyHours: 7 })).status, 200);
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


test("owner inbox runs through Hosting/Functions with public ingress, private authorization, downloads and signed replay", async () => {
  const paths = ["summary", "threads", "threads/foreign", "threads/foreign/messages", "threads/foreign/messages/email/attachments/file", "drafts", "drafts/foreign/send", "labels", "contacts", "settings"];
  const { pair } = await login("terrell", "owner-inbox");
  const page = await request("/dashboard/inbox", { headers: { Cookie: pair } });
  assert.equal(page.status, 200); assert.match(await page.text(), /Your inbox/);
  const dashboard = await (await request("/dashboard", { headers: { Cookie: pair } })).text();
  assert.doesNotMatch(dashboard, /Exercise [1-4]|Open exercise/);
  for (const link of ["/dashboard/inbox", "/dashboard/resume", "/dashboard/fit-analyzer", "/dashboard/cover-letter", "/dashboard/career-plan", "/dashboard/resume-tailor", "/interview"]) assert.ok(dashboard.includes(link));
  for (const path of paths) {
    const response = await request(`/api/inbox/${path}`, { method: "POST", body: "x".repeat(50000) });
    assert.equal(response.status, 401, path); assert.match(response.headers.get("cache-control"), /private.*no-store/);
    const guest = await login("interviewer", "guest-inbox");
    assert.equal((await request(`/api/inbox/${path}`, { headers: { Cookie: guest.pair } })).status, 403);
  }
  const value = { name: "HTTP Visitor", email: "http-visitor@example.test", message: "HTTP acceptance message", website: "", attempt: "http-contact-attempt-0001" };
  for (let i=0; i<2; i++) {
    const accepted = await request("/api/contact", { method: "POST", headers: jsonHeaders(undefined, "contact-http"), body: JSON.stringify(value) });
    assert.equal(accepted.status, 202); assert.deepEqual(await accepted.json(), { status: "accepted", localTest: true });
  }
  const get = async path => { const response = await request(`/api/inbox/${path}`, { headers: { Cookie: pair } }); assert.equal(response.status, 200, path); return response.json(); };
  const threads = await get("threads?query=HTTP%20acceptance"); assert.equal(threads.data.length, 1);
  const summary = await get("summary"); assert.equal(summary.mode, "fixture"); assert.equal(typeof summary.unread, "number");
  const threadId = threads.data[0].id, message = (await get(`threads/${threadId}/messages`)).data[0]; assert.deepEqual(message.reply_to, [value.email]);
  const content = { to: [value.email], cc: [], bcc: [], subject: "Re: question", text: "An owner reply", html: "" };
  const respond = () => request(`/api/inbox/threads/${threadId}/messages/${message.id}/reply`, { method: "POST", headers: jsonHeaders(pair), body: JSON.stringify({ content, attempt: "http-reply-attempt-00001" }) });
  assert.equal((await respond()).status, 200); assert.equal((await respond()).status, 200);
  const messages = (await get(`threads/${threadId}/messages`)).data; assert.equal(messages.length, 3); assert.deepEqual(messages[2].to, [value.email]);
  assert.equal(messages[0].direction, "outbound"); assert.equal(messages[1].direction, "inbound");
  assert.equal((await get(`threads/${threadId}`)).folder, "inbox");
  const download = await request("/api/inbox/threads/thread-1/messages/email-2/attachments/attachment-1", { headers: { Cookie: pair } }); assert.equal(download.status, 200); assert.equal(download.headers.get("content-type"), "application/octet-stream"); assert.match(download.headers.get("content-disposition"), /attachment/);
  assert.equal((await request("/api/inbox/threads/thread-1", { method: "PATCH", headers: jsonHeaders(pair, "origin-inbox", "https://evil.example"), body: JSON.stringify({ read: true }) })).status, 403);
  assert.equal((await request("/api/contact", { method: "POST", headers: jsonHeaders(undefined, "origin-contact", "https://evil.example"), body: JSON.stringify(value) })).status, 403);
  const event = JSON.stringify({ type: "inbox.email.received", created_at: new Date().toISOString(), data: { inbox_id: "fixture-owner" } });
  const timestamp = String(Math.floor(Date.now()/1000)), id = "http-event-1";
  const signature = createHmac("sha256", Buffer.from("fixture-signing-secret")).update(`${id}.${timestamp}.${event}`).digest("base64");
  for (let i=0; i<2; i++) assert.equal((await request("/api/mail/events", { method: "POST", headers: { "Content-Type": "application/json", "svix-id": id, "svix-timestamp": timestamp, "svix-signature": `v1,${signature}` }, body: event })).status, 200);
  assert.equal((await request("/api/mail/events", { method: "POST", headers: { "svix-id": id, "svix-timestamp": timestamp, "svix-signature": `v1,${signature}` }, body: event + " " })).status, 401);
  assert.equal((await get("contacts")).data.length, 0);
});

test("revoked owner cannot read inbox pages, statistics or attachment bytes", async () => {
  const { pair } = await login("terrell", "revoke-owner-inbox");
  await new Promise(resolve => setTimeout(resolve, 1100));
  await admin.revokeRefreshTokens(users.find(user => user.role === "terrell").uid);
  assert.equal((await request("/dashboard/inbox", { headers: { Cookie: pair } })).status, 307);
  for (const path of ["summary", "threads", "contacts", "drafts", "settings", "threads/thread-1/messages/email-2/attachments/attachment-1"]) assert.equal((await request(`/api/inbox/${path}`, { headers: { Cookie: pair } })).status, 401);
});

test('owner Google login denies password tokens, other Google accounts, and old password cookies', async () => {
  const user = users.find(user => user.role === 'terrell');
  const passwordToken = await emulatorPasswordToken(user.email, user.password);
  const denied = await request('/api/auth', { method: 'POST', headers: jsonHeaders(undefined, 'owner-password-denied'), body: JSON.stringify({ role: 'terrell', idToken: passwordToken }) });
  assert.equal(denied.status, 403); assert.equal(denied.headers.get('set-cookie'), null);
  assert.match((await denied.json()).error, /Google.*terrell.singleton@gmail\.com/);
  const oldCookie = await admin.createSessionCookie(passwordToken, { expiresIn: 600000 });
  assert.equal((await request('/dashboard', { headers: { Cookie: '__session=' + oldCookie } })).status, 307);
  assert.equal((await request('/api/inbox/summary', { headers: { Cookie: '__session=' + oldCookie } })).status, 401);
  const foreign = await admin.createUser({ email: 'foreign-google@example.test', emailVerified: true });
  await admin.setCustomUserClaims(foreign.uid, { portfolioRole: 'terrell' });
  const foreignToken = await emulatorGoogleToken({ uid: foreign.uid, email: foreign.email, role: 'terrell' });
  const wrongGoogle = await request('/api/auth', { method: 'POST', headers: jsonHeaders(undefined, 'wrong-google'), body: JSON.stringify({ role: 'terrell', idToken: foreignToken }) });
  assert.equal(wrongGoogle.status, 403); assert.equal(wrongGoogle.headers.get('set-cookie'), null);
});
