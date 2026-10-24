import { createHmac, randomBytes } from "node:crypto";
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const password = "Classroom-Only-84!";
const interviewPassword = "Interview-Guest-92!";
const secret = "9f71c6a4b8d2e5f013579bdf2468ace09f71c6a4b8d2e5f0";
const sessionSeconds = 4 * 60 * 60;
let application;

async function startServer(authenticationEnvironment) {
  const server = spawn(process.execPath, [
    path.join(root, "node_modules", "next", "dist", "bin", "next"),
    "start", "--port", "0", "--hostname", "127.0.0.1",
  ], {
    cwd: root,
    env: {
      ...process.env,
      AI_PROVIDER: "",
      AI_MODEL: "",
      AI_API_KEY: "",
      AI_BASE_URL: "",
      AI_REASONING_EFFORT: "",
      ...authenticationEnvironment,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  let timer;
  const base = await new Promise((resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`Server readiness timed out:\n${output}`)), 30000);
    const read = (chunk) => {
      output += chunk.toString();
      const match = output.match(/http:\/\/127\.0\.0\.1:\d+/);
      if (match && output.includes("Ready")) resolve(match[0]);
    };
    server.stdout.on("data", read);
    server.stderr.on("data", read);
    server.once("error", reject);
    server.once("exit", (code) => reject(new Error(`Server exited (${code}):\n${output}`)));
  }).finally(() => clearTimeout(timer));
  return {
    base,
    server,
    async stop() {
      if (server.exitCode !== null) return;
      const exited = once(server, "exit");
      server.kill();
      await exited;
    },
  };
}

before(async () => {
  application = await startServer({ SITE_PASSWORD: password, INTERVIEW_PASSWORD: interviewPassword, SESSION_SECRET: secret });
});

after(async () => {
  await application?.stop();
});

function request(route, options = {}, base = application.base) {
  return fetch(`${base}${route}`, { ...options, redirect: options.redirect ?? "manual", signal: AbortSignal.timeout(30000) });
}

function jsonHeaders(origin, client = "default-test-client", cookie) {
  return {
    "Content-Type": "application/json",
    Origin: origin,
    "X-Forwarded-For": client,
    ...(cookie ? { Cookie: cookie } : {}),
  };
}

function cookiePair(setCookie) {
  assert.ok(setCookie, "expected Set-Cookie header");
  return setCookie.split(";", 1)[0];
}

function signedToken(signingSecret, issuedAt, expiresAt) {
  const nonce = randomBytes(18).toString("base64url");
  const payload = `v2.${issuedAt}.${expiresAt}.terrell.${nonce}`;
  const signature = createHmac("sha256", signingSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function invalidSessionCookies() {
  const now = Math.floor(Date.now() / 1000);
  const expired = signedToken(secret, now - sessionSeconds - 1, now - 1);
  const wrongSecret = signedToken(`${secret}wrong`, now, now + sessionSeconds);
  const valid = signedToken(secret, now, now + sessionSeconds);
  const parts = valid.split(".");
  parts[5] = `${parts[5][0] === "A" ? "B" : "A"}${parts[5].slice(1)}`;
  return ["portfolio-session=forged-token", `portfolio-session=${expired}`, `portfolio-session=${wrongSecret}`, `portfolio-session=${parts.join(".")}`];
}

async function privatePageResponse(route, headers) {
  let response = await request(route, { headers });
  const location = response.headers.get("location");
  if (headers.RSC === "1" && response.status === 307 && location) {
    const redirect = new URL(location, application.base);
    if (redirect.pathname === route && redirect.searchParams.has("_rsc")) {
      response = await request(`${redirect.pathname}${redirect.search}`, { headers });
    }
  }
  return response;
}

test("the portfolio stays public while invalid sessions cannot disclose private pages", async () => {
  assert.equal((await request("/")).status, 200);
  for (const cookie of [undefined, ...invalidSessionCookies()]) {
    for (const route of ["/dashboard", "/dashboard/fit-analyzer", "/dashboard/cover-letter", "/dashboard/career-plan", "/interview"]) {
      for (const rsc of [false, true]) {
        const response = await privatePageResponse(route, { ...(cookie ? { Cookie: cookie } : {}), ...(rsc ? { RSC: "1" } : {}) });
        const content = await response.text();
        if (rsc) {
          assert.equal(response.status, 200, `${route} RSC (${cookie ?? "no cookie"})`);
          assert.match(content, /NEXT_REDIRECT;replace;\/login;307;/, route);
        } else {
          assert.equal(response.status, 307, `${route} HTML (${cookie ?? "no cookie"})`);
          assert.equal(new URL(response.headers.get("location"), application.base).pathname, "/login");
        }
        assert.ok(!content.includes("Your next four builds."), route);
        assert.ok(!content.includes("Back to workspace"), route);
        assert.ok(!content.includes('id="jd"'), route);
        assert.ok(!content.includes("Start with the story"), route);
      }
    }
  }
});

test("every private API returns JSON 401 before parsing or reaching a model call", async () => {
  for (const cookie of [undefined, ...invalidSessionCookies()]) {
    for (const route of ["/api/fit-analyzer", "/api/cover-letter", "/api/career-plan"]) {
      const response = await request(route, {
        method: "POST",
        headers: { Origin: application.base, ...(cookie ? { Cookie: cookie } : {}) },
        body: "not-json",
      });
      assert.equal(response.status, 401, route);
      assert.match(response.headers.get("content-type"), /application\/json/);
      assert.match((await response.json()).error, /Sign in/);
      assert.equal(response.headers.get("set-cookie"), null);
    }
  }
});

test("missing or weak server configuration returns 503 and never renders private children", async () => {
  const unconfigured = await startServer({ SITE_PASSWORD: "short", INTERVIEW_PASSWORD: "short", SESSION_SECRET: "also-short" });
  try {
    assert.equal((await request("/", {}, unconfigured.base)).status, 200);
    const dashboard = await request("/dashboard", {}, unconfigured.base);
    assert.equal(dashboard.status, 200);
    const html = await dashboard.text();
    assert.match(html, /Configure your private workspace/);
    assert.ok(!html.includes("Your next four builds."));

    const api = await request("/api/fit-analyzer", { method: "POST" }, unconfigured.base);
    assert.equal(api.status, 503);
    assert.match((await api.json()).error, /not securely configured/);

    const login = await request("/api/auth", {
      method: "POST",
      headers: jsonHeaders(unconfigured.base, "unconfigured-client"),
      body: JSON.stringify({ role: "terrell", password }),
    }, unconfigured.base);
    assert.equal(login.status, 503);
    assert.equal(login.headers.get("set-cookie"), null);
  } finally {
    await unconfigured.stop();
  }
});

test("login preserves JSON and origin checks and rejects invalid or incorrect passwords", async () => {
  const wrongType = await request("/api/auth", {
    method: "POST",
    headers: jsonHeaders(application.base, "validation-client"),
    body: JSON.stringify({ role: "terrell", password: 42 }),
  });
  assert.equal(wrongType.status, 400);

  const incorrect = await request("/api/auth", {
    method: "POST",
    headers: jsonHeaders(application.base, "validation-client"),
    body: JSON.stringify({ role: "terrell", password: "incorrect" }),
  });
  assert.equal(incorrect.status, 401);
  assert.equal(incorrect.headers.get("set-cookie"), null);

  const crossOrigin = await request("/api/auth", {
    method: "POST",
    headers: jsonHeaders("https://untrusted.example", "validation-client"),
    body: JSON.stringify({ role: "terrell", password }),
  });
  assert.equal(crossOrigin.status, 403);
  assert.equal(crossOrigin.headers.get("set-cookie"), null);

  const invalidRole = await request("/api/auth", {
    method: "POST",
    headers: jsonHeaders(application.base, "validation-client"),
    body: JSON.stringify({ role: "administrator", password }),
  });
  assert.equal(invalidRole.status, 400);

  const wrongContentType = await request("/api/auth", { method: "POST", body: JSON.stringify({ role: "terrell", password }) });
  assert.equal(wrongContentType.status, 415);
});

test("login issues a signed four-hour cookie and authenticated requests reach protected pages", async () => {
  const login = await request("/api/auth", {
    method: "POST",
    headers: jsonHeaders(application.base, "successful-login-client"),
    body: JSON.stringify({ role: "terrell", password }),
  });
  assert.equal(login.status, 200);
  const setCookie = login.headers.get("set-cookie");
  assert.match(setCookie, /^portfolio-session=v2\./);
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Strict/i);
  assert.match(setCookie, /Path=\//i);
  assert.match(setCookie, /Max-Age=14400/i);
  assert.match(setCookie, /Secure/i);
  const cookie = cookiePair(setCookie);

  const dashboard = await request("/dashboard", { headers: { Cookie: cookie } });
  assert.equal(dashboard.status, 200);
  assert.match(await dashboard.text(), /Your next four builds/);

  const toolPage = await request("/dashboard/fit-analyzer", { headers: { Cookie: cookie } });
  assert.equal(toolPage.status, 200);
  assert.match(await toolPage.text(), /id="jd"/);

  const interview = await request("/interview", { headers: { Cookie: cookie } });
  assert.equal(interview.status, 200);
  const interviewHtml = await interview.text();
  assert.match(interviewHtml, /Terrell Singleton/);
  assert.match(interviewHtml, /view/);

  for (const jobDescription of [" ", "a".repeat(5001)]) {
    for (const route of ["/api/fit-analyzer", "/api/cover-letter", "/api/career-plan"]) {
      const response = await request(route, {
        method: "POST",
        headers: jsonHeaders(application.base, "authenticated-api-client", cookie),
        body: JSON.stringify({ jobDescription, mode: "study", weeklyHours: 5 }),
      });
      assert.equal(response.status, 400, route);
    }
  }

  const invalidTone = await request("/api/cover-letter", {
    method: "POST",
    headers: jsonHeaders(application.base, "authenticated-api-client", cookie),
    body: JSON.stringify({ jobDescription: "Software Engineer at Example Co", tone: "invented" }),
  });
  assert.equal(invalidTone.status, 400);

  for (const body of [
    { jobDescription: "Software Engineer at Example Co", mode: "invalid", weeklyHours: 5 },
    { jobDescription: "Software Engineer at Example Co", mode: "study", weeklyHours: 0 },
    { jobDescription: "Software Engineer at Example Co", mode: "study", weeklyHours: 41 },
  ]) {
    const response = await request("/api/career-plan", {
      method: "POST",
      headers: jsonHeaders(application.base, "authenticated-api-client", cookie),
      body: JSON.stringify(body),
    });
    assert.equal(response.status, 400);
  }

  for (const route of ["/api/fit-analyzer", "/api/cover-letter", "/api/career-plan"]) {
    const response = await request(route, {
      method: "POST",
      headers: jsonHeaders(application.base, "authenticated-api-client", cookie),
      body: JSON.stringify({
        jobDescription: "Software Engineer at Example Co",
        tone: "technical",
        mode: "study",
        weeklyHours: 5,
      }),
    });
    assert.equal(response.status, 503, route);
    assert.match((await response.json()).error, /AI_PROVIDER/);
  }
});

test("guest roles share the interview password and cannot cross into owner routes", async () => {
  for (const role of ["recruiter", "interviewer"]) {
    const login = await request("/api/auth", {
      method: "POST",
      headers: jsonHeaders(application.base, `${role}-login-client`),
      body: JSON.stringify({ role, password: interviewPassword }),
    });
    assert.equal(login.status, 200);
    const payload = await login.json();
    assert.equal(payload.destination, "/interview");
    const cookie = cookiePair(login.headers.get("set-cookie"));

    const interview = await request("/interview", { headers: { Cookie: cookie } });
    assert.equal(interview.status, 200);
    const html = await interview.text();
    assert.match(html, /Start with the story/);
    assert.match(html, new RegExp(`${role[0].toUpperCase()}${role.slice(1)}`));
    assert.match(html, /view/);

    const dashboard = await request("/dashboard", { headers: { Cookie: cookie } });
    assert.equal(dashboard.status, 307);
    assert.equal(new URL(dashboard.headers.get("location"), application.base).pathname, "/interview");

    const api = await request("/api/fit-analyzer", {
      method: "POST",
      headers: jsonHeaders(application.base, `${role}-api-client`, cookie),
      body: JSON.stringify({ jobDescription: "Software Engineer at Example Co" }),
    });
    assert.equal(api.status, 403);
  }

  const wrongGuestPassword = await request("/api/auth", {
    method: "POST",
    headers: jsonHeaders(application.base, "wrong-guest-password"),
    body: JSON.stringify({ role: "recruiter", password }),
  });
  assert.equal(wrongGuestPassword.status, 401);
});

test("logout enforces origin checks, sends the clearing cookie, and a subsequent cookie-free request is denied", async () => {
  const login = await request("/api/auth", {
    method: "POST",
    headers: jsonHeaders(application.base, "logout-client"),
    body: JSON.stringify({ role: "terrell", password }),
  });
  const cookie = cookiePair(login.headers.get("set-cookie"));

  const rejected = await request("/api/auth", {
    method: "DELETE",
    headers: { Origin: "https://untrusted.example", Cookie: cookie },
  });
  assert.equal(rejected.status, 403);
  assert.equal(rejected.headers.get("set-cookie"), null);

  const logout = await request("/api/auth", {
    method: "DELETE",
    headers: { Origin: application.base, Cookie: cookie },
  });
  assert.equal(logout.status, 200);
  const clearingCookie = logout.headers.get("set-cookie");
  assert.match(clearingCookie, /^portfolio-session=;/);
  assert.match(clearingCookie, /Max-Age=0/i);
  assert.match(clearingCookie, /HttpOnly/i);
  assert.match(clearingCookie, /SameSite=Strict/i);
  assert.match(clearingCookie, /Path=\//i);

  const denied = await request("/api/fit-analyzer", { method: "POST" });
  assert.equal(denied.status, 401);
});

test("the classroom login limiter allows ten attempts per minute and rejects the next attempt", async () => {
  const headers = jsonHeaders(application.base, "rate-limit-client");
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const response = await request("/api/auth", {
      method: "POST",
      headers,
      body: JSON.stringify({ role: "terrell", password: "incorrect" }),
    });
    assert.equal(response.status, 401, `attempt ${attempt}`);
  }
  const limited = await request("/api/auth", {
    method: "POST",
    headers,
    body: JSON.stringify({ role: "terrell", password }),
  });
  assert.equal(limited.status, 429);
  assert.match(limited.headers.get("retry-after"), /^([1-9]|[1-5][0-9]|60)$/);
  assert.equal(limited.headers.get("set-cookie"), null);
});
