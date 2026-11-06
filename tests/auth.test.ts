import { test } from "node:test";
import assert from "node:assert/strict";
import { AuthenticationConfigurationError, authConfiguration, currentSessionRole, roleFromClaims, sessionToken } from "../src/lib/auth.ts";
import { SESSION_DURATION_SECONDS, sessionCookieOptions } from "../src/lib/session.ts";

const ownerIdentity = { email: 'Terrell.Singleton@gmail.com', email_verified: true, firebase: { sign_in_provider: 'google.com' } };

test("Firebase auth requires a project, not site passwords or session secrets", () => {
  assert.deepEqual(authConfiguration({ GCLOUD_PROJECT: "demo-test" }), { projectId: "demo-test" });
  assert.throws(() => authConfiguration({}), AuthenticationConfigurationError);
});

test("only explicit server-assigned portfolio roles grant access", () => {
  for (const role of ["terrell", "interviewer", "recruiter"]) assert.equal(roleFromClaims({ ...ownerIdentity, portfolioRole: role }), role);
  for (const claims of [{}, { role: "terrell" }, { portfolioRole: "admin" }, { portfolioRole: true }]) assert.equal(roleFromClaims(claims), null);
});

test("the Hosting session cookie uses secure four-hour flags", () => {
  assert.equal(SESSION_DURATION_SECONDS, 14400);
  assert.deepEqual(sessionCookieOptions(), { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 14400 });
  assert.equal(sessionToken(new Request("http://localhost", { headers: { Cookie: "other=x; __session=verified-token" } })), "verified-token");
});

test("session roles are read only after Firebase verification", async () => {
  const previous = process.env.GCLOUD_PROJECT;
  process.env.GCLOUD_PROJECT = "demo-test";
  try {
    const request = new Request("http://localhost", { headers: { Cookie: "__session=signed-cookie" } });
    let called = false;
    assert.equal(await currentSessionRole(request, async (token) => { called = true; assert.equal(token, "signed-cookie"); return { ...ownerIdentity, portfolioRole: "terrell" }; }), "terrell");
    assert.equal(called, true);
    assert.equal(await currentSessionRole(new Request("http://localhost"), async () => { throw new Error("must not verify absent cookie"); }), null);
  } finally { if (previous === undefined) delete process.env.GCLOUD_PROJECT; else process.env.GCLOUD_PROJECT = previous; }
});

test("revoked, expired, disabled, and tampered sessions deny access; service failures surface", async () => {
  const previous = process.env.GCLOUD_PROJECT;
  process.env.GCLOUD_PROJECT = "demo-test";
  try {
    const request = new Request("http://localhost", { headers: { Cookie: "__session=invalid" } });
    for (const code of ["auth/session-cookie-revoked", "auth/session-cookie-expired", "auth/argument-error", "auth/user-disabled"]) {
      assert.equal(await currentSessionRole(request, async () => { throw { code }; }), null);
    }
    await assert.rejects(() => currentSessionRole(request, async () => { throw new Error("service unavailable"); }), /service unavailable/);
  } finally { if (previous === undefined) delete process.env.GCLOUD_PROJECT; else process.env.GCLOUD_PROJECT = previous; }
});

test("workspace principal trusts verified UID and role only", async () => {
  const { currentSessionPrincipal } = await import('../src/lib/auth.ts');
  const previous = process.env.GCLOUD_PROJECT;
  process.env.GCLOUD_PROJECT = 'demo-test';
  const request = new Request('http://localhost?uid=owner', { headers: { Cookie: '__session=signed', 'X-Owner-Uid': 'owner' } });
  try {
    for (const role of ['terrell', 'recruiter', 'interviewer']) {
      assert.deepEqual(await currentSessionPrincipal(request, async () => ({ ...ownerIdentity, uid: 'verified-user', portfolioRole: role })), { uid: 'verified-user', role });
    }
    assert.equal(await currentSessionPrincipal(request, async () => ({ portfolioRole: 'terrell' })), null);
    assert.equal(await currentSessionPrincipal(request, async () => ({ uid: '../owner', portfolioRole: 'terrell' })), null);
    assert.equal(await currentSessionPrincipal(new Request('http://localhost')), null);
    for (const code of ['auth/session-cookie-expired', 'auth/session-cookie-revoked']) {
      assert.equal(await currentSessionPrincipal(request, async () => { throw { code }; }), null);
    }
  } finally { if (previous === undefined) delete process.env.GCLOUD_PROJECT; else process.env.GCLOUD_PROJECT = previous; }
});

// Session checks use the same restriction as the initial ID-token exchange.
test('owner access requires the exact verified Google identity and a server-assigned role', async () => {
  const good = { ...ownerIdentity, portfolioRole: 'terrell' };
  assert.equal(roleFromClaims(good), 'terrell');
  for (const patch of [
    { email: 'someone@gmail.com' }, { email: 'terrell.singleton+owner@gmail.com' },
    { email: 'terrellsingleton@gmail.com' }, { email: undefined }, { email_verified: false },
    { email_verified: 'true' }, { firebase: { sign_in_provider: 'password' } },
    { firebase: { sign_in_provider: 'custom' } }, { firebase: null }, { firebase: {} },
  ]) assert.equal(roleFromClaims({ ...good, ...patch }), null);
  assert.equal(roleFromClaims(ownerIdentity), null);
  for (const role of ['recruiter', 'interviewer']) assert.equal(roleFromClaims({ portfolioRole: role, firebase: { sign_in_provider: 'password' } }), role);
  const previous = process.env.GCLOUD_PROJECT; process.env.GCLOUD_PROJECT = 'demo-test';
  try {
    const request = new Request('http://localhost', { headers: { Cookie: '__session=old-password-session' } });
    assert.equal(await currentSessionRole(request, async () => ({ ...good, firebase: { sign_in_provider: 'password' } })), null);
  } finally { if (previous === undefined) delete process.env.GCLOUD_PROJECT; else process.env.GCLOUD_PROJECT = previous; }
});
