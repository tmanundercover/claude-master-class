import { readJson } from "@/lib/api";
import { adminAuth, authConfiguration, roleFromClaims } from "@/lib/auth";
import { isSameOrigin } from "@/lib/origin";
import { expiredSessionCookieOptions, isSessionRole, SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS, sessionCookieOptions } from "@/lib/session";

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

export async function configuration() {
  try {
    const { projectId } = authConfiguration();
    const emulatorHost = process.env.FUNCTIONS_EMULATOR === "true" ? process.env.FIREBASE_AUTH_EMULATOR_HOST : undefined;
    const apiKey = emulatorHost ? "emulator-only-key" : process.env.PORTFOLIO_FIREBASE_WEB_API_KEY || process.env.FIREBASE_WEB_API_KEY;
    if (!apiKey) return Response.json({ error: "Firebase web configuration is missing." }, { status: 503 });
    return Response.json({ projectId, apiKey, authDomain: `${projectId}.firebaseapp.com`, ...(emulatorHost ? { emulatorUrl: `http://${emulatorHost}` } : {
      storageBucket: process.env.PORTFOLIO_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.PORTFOLIO_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.PORTFOLIO_FIREBASE_APP_ID,
      measurementId: process.env.PORTFOLIO_FIREBASE_MEASUREMENT_ID,
    }) });
  } catch { return Response.json({ error: "Firebase Authentication is not configured." }, { status: 503 }); }
}

export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body.ok) return body.response;
  if (typeof body.value !== "object" || body.value === null || Array.isArray(body.value)
    || !("idToken" in body.value) || typeof body.value.idToken !== "string" || !body.value.idToken || body.value.idToken.length > 16000
    || !("role" in body.value) || !isSessionRole(body.value.role)) {
    return Response.json({ error: "Choose a valid role and sign in with Firebase Authentication." }, { status: 400 });
  }
  const retryAfter = retryAfterFor(request);
  if (retryAfter !== null) return Response.json({ error: "Too many login attempts. Wait before trying again." }, { status: 429, headers: { "Retry-After": String(retryAfter) } });
  try {
    const auth = adminAuth();
    const claims = await auth.verifyIdToken(body.value.idToken, true);
    const role = roleFromClaims(claims);
    if (!role || role !== body.value.role) return Response.json({ error: "Your account is not assigned to the selected role." }, { status: 403 });
    const age = Date.now() / 1000 - claims.auth_time;
    if (!Number.isFinite(age) || age < -60 || age > 300) return Response.json({ error: "Sign in again to create a session." }, { status: 401 });
    const cookie = await auth.createSessionCookie(body.value.idToken, { expiresIn: SESSION_DURATION_SECONDS * 1000 });
    const response = Response.json({ ok: true, role, destination: role === "terrell" ? "/dashboard" : "/interview" });
    response.headers.set("Set-Cookie", serializeSessionCookie(cookie));
    return response;
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    if (/^auth\/(argument-error|invalid-.*|.*-expired|.*-revoked|user-disabled|user-not-found)$/.test(code)) {
      return Response.json({ error: "Firebase sign-in could not be verified. Sign in again." }, { status: 401 });
    }
    return Response.json({ error: "Firebase Authentication is unavailable or not configured." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Cross-origin requests are not allowed." }, { status: 403 });
  const response = Response.json({ ok: true });
  response.headers.set("Set-Cookie", serializeSessionCookie("", true));
  return response;
}

function serializeSessionCookie(token: string, expired = false): string {
  const options = expired ? expiredSessionCookieOptions() : sessionCookieOptions();
  return `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${options.maxAge}`
    + (options.secure ? "; Secure" : "") + (expired ? "; Expires=Thu, 01 Jan 1970 00:00:00 GMT" : "");
}
