import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE_NAME = "portfolio-session";
export const SESSION_DURATION_SECONDS = 4 * 60 * 60;
export const SESSION_ROLES = ["recruiter", "interviewer", "terrell"] as const;

export type SessionRole = (typeof SESSION_ROLES)[number];

const TOKEN_VERSION = "v2";
const NONCE_BYTES = 18;
const MAX_TOKEN_LENGTH = 512;

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

export function passwordsMatch(candidate: string, expected: string): boolean {
  return timingSafeEqual(digest(candidate), digest(expected));
}

function signature(payload: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(payload, "utf8").digest();
}

export function isSessionRole(value: unknown): value is SessionRole {
  return typeof value === "string" && SESSION_ROLES.some((role) => role === value);
}

export function createSessionToken(secret: string, now = Date.now(), role: SessionRole = "terrell"): string {
  const issuedAt = Math.floor(now / 1000);
  const expiresAt = issuedAt + SESSION_DURATION_SECONDS;
  const nonce = randomBytes(NONCE_BYTES).toString("base64url");
  const payload = `${TOKEN_VERSION}.${issuedAt}.${expiresAt}.${role}.${nonce}`;
  return `${payload}.${signature(payload, secret).toString("base64url")}`;
}

export function readSessionRole(token: string | undefined, secret: string, now = Date.now()): SessionRole | null {
  if (!token || token.length > MAX_TOKEN_LENGTH) return null;

  const parts = token.split(".");
  if (parts.length !== 6 || parts[0] !== TOKEN_VERSION) return null;

  const [version, issuedText, expiresText, role, nonce, suppliedText] = parts;
  if (!isSessionRole(role) || !/^\d{1,13}$/.test(issuedText) || !/^\d{1,13}$/.test(expiresText)) return null;
  if (!/^[A-Za-z0-9_-]{24}$/.test(nonce) || !/^[A-Za-z0-9_-]{43}$/.test(suppliedText)) return null;

  const issuedAt = Number(issuedText);
  const expiresAt = Number(expiresText);
  const nowSeconds = Math.floor(now / 1000);
  if (!Number.isSafeInteger(issuedAt) || !Number.isSafeInteger(expiresAt)) return null;
  if (issuedAt <= 0 || expiresAt <= issuedAt || issuedAt > nowSeconds || expiresAt <= nowSeconds) return null;
  if (expiresAt - issuedAt > SESSION_DURATION_SECONDS) return null;

  const payload = `${version}.${issuedText}.${expiresText}.${role}.${nonce}`;
  let supplied: Buffer;
  try {
    supplied = Buffer.from(suppliedText, "base64url");
  } catch {
    return null;
  }
  const expected = signature(payload, secret);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected) ? role : null;
}

export function verifySessionToken(token: string | undefined, secret: string, now = Date.now()): boolean {
  return readSessionRole(token, secret, now) !== null;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  };
}

export function expiredSessionCookieOptions() {
  return {
    ...sessionCookieOptions(),
    expires: new Date(0),
    maxAge: 0,
  };
}
