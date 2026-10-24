import { NextResponse } from "next/server";
import { readJson } from "@/lib/api";
import { authConfiguration } from "@/lib/auth";
import { isSameOrigin } from "@/lib/origin";
import {
  createSessionToken,
  expiredSessionCookieOptions,
  isSessionRole,
  passwordsMatch,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/session";

const LOGIN_ATTEMPT_LIMIT = 10;
const LOGIN_WINDOW_MS = 60_000;

// Classroom-only, process-local throttling. It resets on restart and is not distributed.
const loginAttempts = new Map<string, { count: number; windowStartedAt: number }>();

function loginClientKey(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim()
    || request.headers.get("x-real-ip")
    || "local-classroom-client";
}

function retryAfterFor(request: Request, now = Date.now()): number | null {
  const key = loginClientKey(request);
  const current = loginAttempts.get(key);
  if (!current || now - current.windowStartedAt >= LOGIN_WINDOW_MS) {
    loginAttempts.set(key, { count: 1, windowStartedAt: now });
    return null;
  }
  if (current.count >= LOGIN_ATTEMPT_LIMIT) {
    return Math.max(1, Math.ceil((LOGIN_WINDOW_MS - (now - current.windowStartedAt)) / 1000));
  }
  current.count += 1;
  return null;
}

function configurationError() {
  return NextResponse.json(
    { error: "Login is not securely configured. Set strong SITE_PASSWORD and INTERVIEW_PASSWORD values plus SESSION_SECRET on the server." },
    { status: 503 },
  );
}

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body.ok) return body.response;
  if (typeof body.value !== "object" || body.value === null || Array.isArray(body.value)
    || !("password" in body.value) || typeof body.value.password !== "string"
    || !("role" in body.value) || !isSessionRole(body.value.role)) {
    return NextResponse.json({ error: "Choose a valid role and provide a password." }, { status: 400 });
  }

  let configuration: ReturnType<typeof authConfiguration>;
  try {
    configuration = authConfiguration();
  } catch (error) {
    console.error("Login configuration error:", error);
    return configurationError();
  }

  const retryAfter = retryAfterFor(request);
  if (retryAfter !== null) {
    return NextResponse.json(
      { error: "Too many login attempts. Wait before trying again." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }
  const expectedPassword = body.value.role === "terrell"
    ? configuration.password
    : configuration.interviewPassword;
  if (!passwordsMatch(body.value.password, expectedPassword)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const destination = body.value.role === "terrell" ? "/dashboard" : "/interview";
  const response = NextResponse.json({ ok: true, role: body.value.role, destination });
  response.cookies.set(
    SESSION_COOKIE_NAME,
    createSessionToken(configuration.secret, Date.now(), body.value.role),
    sessionCookieOptions(),
  );
  return response;
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin requests are not allowed." }, { status: 403 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", expiredSessionCookieOptions());
  return response;
}
