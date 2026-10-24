import { createHmac, randomBytes } from "node:crypto";
import { test } from "node:test";
import assert from "node:assert/strict";
import { AuthenticationConfigurationError, authConfiguration } from "../src/lib/auth.ts";
import {
  createSessionToken,
  passwordsMatch,
  readSessionRole,
  SESSION_DURATION_SECONDS,
  verifySessionToken,
} from "../src/lib/session.ts";

const password = "Classroom-Only-84!";
const interviewPassword = "Interview-Guest-92!";
const secret = "9f71c6a4b8d2e5f013579bdf2468ace09f71c6a4b8d2e5f0";

test("authentication configuration accepts strong server-only settings", () => {
  assert.deepEqual(authConfiguration({ SITE_PASSWORD: password, INTERVIEW_PASSWORD: interviewPassword, SESSION_SECRET: secret }), { password, interviewPassword, secret });
});

test("authentication configuration rejects missing and weak settings", () => {
  const weakConfigurations: Partial<Record<"SITE_PASSWORD" | "INTERVIEW_PASSWORD" | "SESSION_SECRET", string>>[] = [
    {},
    { SITE_PASSWORD: "short", INTERVIEW_PASSWORD: interviewPassword, SESSION_SECRET: secret },
    { SITE_PASSWORD: "aaaaaaaaaaaa", INTERVIEW_PASSWORD: interviewPassword, SESSION_SECRET: secret },
    { SITE_PASSWORD: "password-is-bad-123", INTERVIEW_PASSWORD: interviewPassword, SESSION_SECRET: secret },
    { SITE_PASSWORD: password, INTERVIEW_PASSWORD: interviewPassword, SESSION_SECRET: "short" },
    { SITE_PASSWORD: password, INTERVIEW_PASSWORD: interviewPassword, SESSION_SECRET: "a".repeat(40) },
    { SITE_PASSWORD: password, INTERVIEW_PASSWORD: interviewPassword, SESSION_SECRET: "workshop-test-secret-more-than-32-characters" },
    { SITE_PASSWORD: password, INTERVIEW_PASSWORD: "short", SESSION_SECRET: secret },
    { SITE_PASSWORD: password, INTERVIEW_PASSWORD: password, SESSION_SECRET: secret },
    { SITE_PASSWORD: secret, INTERVIEW_PASSWORD: interviewPassword, SESSION_SECRET: secret },
  ];
  for (const environment of weakConfigurations) {
    assert.throws(() => authConfiguration(environment), AuthenticationConfigurationError);
  }
});

test("password comparison checks equal-length digests", () => {
  assert.equal(passwordsMatch(password, password), true);
  assert.equal(passwordsMatch("incorrect", password), false);
  assert.equal(passwordsMatch(`${password}x`, password), false);
});

test("sessions use unique nonces and verify during their four-hour lifetime", () => {
  const now = 1_800_000_000_000;
  const first = createSessionToken(secret, now);
  const second = createSessionToken(secret, now);
  assert.notEqual(first, second);
  assert.equal(verifySessionToken(first, secret, now), true);
  assert.equal(verifySessionToken(first, secret, now + SESSION_DURATION_SECONDS * 1000 - 1), true);
  assert.equal(verifySessionToken(first, secret, now + SESSION_DURATION_SECONDS * 1000), false);
});

test("sessions sign the selected role and reject a modified role claim", () => {
  const now = 1_800_000_000_000;
  const recruiter = createSessionToken(secret, now, "recruiter");
  assert.equal(readSessionRole(recruiter, secret, now), "recruiter");
  assert.equal(readSessionRole(createSessionToken(secret, now, "interviewer"), secret, now), "interviewer");
  assert.equal(readSessionRole(createSessionToken(secret, now, "terrell"), secret, now), "terrell");
  assert.equal(readSessionRole(recruiter.replace(".recruiter.", ".terrell."), secret, now), null);
});

test("missing, malformed, tampered, future, and wrong-secret sessions are denied", () => {
  const now = 1_800_000_000_000;
  const token = createSessionToken(secret, now);
  const parts = token.split(".");
  parts[4] = `${parts[4][0] === "A" ? "B" : "A"}${parts[4].slice(1)}`;

  assert.equal(verifySessionToken(undefined, secret, now), false);
  assert.equal(verifySessionToken("not-a-session", secret, now), false);
  assert.equal(verifySessionToken(parts.join("."), secret, now), false);
  assert.equal(verifySessionToken(token, `${secret}wrong`, now), false);
  assert.equal(verifySessionToken(createSessionToken(secret, now + 1000), secret, now), false);
});

test("a correctly signed token cannot claim more than the maximum lifetime", () => {
  const now = 1_800_000_000_000;
  const issuedAt = Math.floor(now / 1000);
  const expiresAt = issuedAt + SESSION_DURATION_SECONDS + 1;
  const nonce = randomBytes(18).toString("base64url");
  const payload = `v2.${issuedAt}.${expiresAt}.terrell.${nonce}`;
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  assert.equal(verifySessionToken(`${payload}.${signature}`, secret, now), false);
});
