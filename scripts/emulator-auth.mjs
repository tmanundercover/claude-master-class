// Test/dev credentials only. Never send synthetic identities to a live Firebase project.
function endpoint(operation) {
  const host = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  if (!/^demo-[a-z0-9-]+$/.test(process.env.GCLOUD_PROJECT ?? '') || !/^127\.0\.0\.1:\d+$/.test(host ?? '')) {
    throw new Error('Synthetic sign-in requires a demo project and loopback Auth emulator.');
  }
  return `http://${host}/identitytoolkit.googleapis.com/v1/accounts:${operation}?key=emulator-only`;
}
async function signIn(operation, body) {
  const response = await fetch(endpoint(operation), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, returnSecureToken: true }) });
  const result = await response.json();
  if (!response.ok || !result.idToken) throw new Error(`Auth emulator sign-in failed (${response.status}): ${result.error?.message ?? 'missing ID token'}`);
  return result.idToken;
}
export function emulatorPasswordToken(email, password) { return signIn('signInWithPassword', { email, password }); }
export function emulatorGoogleToken(user) {
  return signIn('signInWithIdp', { requestUri: 'http://localhost', postBody: new URLSearchParams({
    providerId: 'google.com', id_token: JSON.stringify({ sub: `emulator-google-${user.uid}`, email: user.email, email_verified: true, name: user.role === 'terrell' ? 'Terrell Singleton' : 'Test Google account' }),
  }).toString() });
}
export function emulatorUserToken(user) { return user.role === 'terrell' ? emulatorGoogleToken(user) : emulatorPasswordToken(user.email, user.password); }

export async function emulatorOwnerBrowserSignIn(page, email = 'terrell.singleton@gmail.com') {
  endpoint('signInWithIdp');
  await page.locator('#role').selectOption('terrell');
  const opened = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Continue with Google', exact: true }).click();
  const popup = await opened;
  await popup.waitForURL(url => url.hostname === '127.0.0.1' && url.port === process.env.FIREBASE_AUTH_EMULATOR_HOST.split(':')[1]);
  await popup.waitForFunction(() => typeof window.finishWithUser === 'function');
  const accounts = popup.locator('.js-reuse-account');
  await accounts.first().waitFor();
  const index = await accounts.evaluateAll((elements, email) => elements.findIndex(element => element.textContent.toLowerCase().includes(email.toLowerCase())), email);
  if (index < 0) throw new Error('The seeded Google owner is missing from the emulator account picker.');
  await accounts.nth(index).click();
}
