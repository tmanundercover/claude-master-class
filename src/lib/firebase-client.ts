import { initializeApp, getApps } from "@firebase/app";
import { connectAuthEmulator, getAuth, GoogleAuthProvider, inMemoryPersistence, setPersistence, signInWithEmailAndPassword, signInWithPopup, signOut } from "@firebase/auth";
import { OWNER_LOGIN_EMAIL } from './owner-identity';

let authentication: Promise<ReturnType<typeof getAuth>> | undefined;

function clientAuth() {
  authentication ??= initializeAuthentication().catch(error => { authentication = undefined; throw error; });
  return authentication;
}

async function initializeAuthentication() {
  const response = await fetch("/api/auth/config");
  if (!response.ok) throw new Error("Firebase Authentication is not configured.");
  const { emulatorUrl, ...config } = await response.json();
  const app = getApps()[0] ?? initializeApp(config);
  const auth = getAuth(app);
  if (emulatorUrl) connectAuthEmulator(auth, emulatorUrl, { disableWarnings: true });
  await setPersistence(auth, inMemoryPersistence);
  return auth;
}

export async function prepareFirebaseSignIn(): Promise<void> { await clientAuth(); }

function exchangeToken(idToken: string, role: string): Promise<Response> {
  return fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken, role }) });
}

export async function firebaseGoogleSignIn(): Promise<Response> {
  const auth = await clientAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account', login_hint: OWNER_LOGIN_EMAIL });
  try {
    const credential = await signInWithPopup(auth, provider);
    if (credential.user.email?.toLowerCase() !== OWNER_LOGIN_EMAIL) {
      throw Object.assign(new Error('Use the approved owner Google account.'), { code: 'auth/owner-account-required' });
    }
    return await exchangeToken(await credential.user.getIdToken(true), 'terrell');
  } finally { await signOut(auth); }
}

export async function firebaseSignIn(email: string, password: string, role: string): Promise<Response> {
  if (role === 'terrell') throw Object.assign(new Error('Owner access requires Google sign-in.'), { code: 'auth/owner-account-required' });
  const auth = await clientAuth();
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return await exchangeToken(await credential.user.getIdToken(true), role);
  } finally { await signOut(auth); }
}
