import { initializeApp, getApps } from "@firebase/app";
import { connectAuthEmulator, getAuth, inMemoryPersistence, setPersistence, signInWithEmailAndPassword, signOut } from "@firebase/auth";

let authentication: ReturnType<typeof getAuth>;

async function clientAuth() {
  if (authentication) return authentication;
  const response = await fetch("/api/auth/config");
  if (!response.ok) throw new Error("Firebase Authentication is not configured.");
  const { emulatorUrl, ...config } = await response.json();
  const app = getApps()[0] ?? initializeApp(config);
  authentication = getAuth(app);
  if (emulatorUrl) connectAuthEmulator(authentication, emulatorUrl, { disableWarnings: true });
  await setPersistence(authentication, inMemoryPersistence);
  return authentication;
}

export async function firebaseSignIn(email: string, password: string, role: string): Promise<Response> {
  const auth = await clientAuth();
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return await fetch("/api/auth", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: await credential.user.getIdToken(true), role }),
    });
  } finally { await signOut(auth); }
}
