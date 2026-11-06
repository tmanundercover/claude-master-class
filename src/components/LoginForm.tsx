import { useEffect, useRef, useState, type FormEvent } from "react";
import { applicationLoginDestination } from "../lib/job-return";
import { sitePath } from "@/lib/site-path";
import type { SessionRole } from "@/lib/session";
import { OWNER_LOGIN_EMAIL } from '../lib/owner-identity';

const roleDescriptions: Record<SessionRole, string> = {
  recruiter: "Explore my experience and answers to common interview questions.",
  interviewer: "Watch my responses and explore follow-up details.",
  terrell: "Open the owner workspace and all portfolio tools.",
};

export default function LoginForm() {
  const [role, setRole] = useState<SessionRole>("recruiter");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const googleSignIn = useRef<(() => Promise<Response>) | null>(null);

  useEffect(() => {
    if (role !== 'terrell') return;
    let cancelled = false;
    // Prepare before the click so the popup opens while the user gesture is active.
    void import('@/lib/firebase-client').then(async client => {
      await client.prepareFirebaseSignIn();
      if (!cancelled) { googleSignIn.current = client.firebaseGoogleSignIn; setGoogleReady(true); }
    }).catch(() => { if (!cancelled) setError('Could not prepare Google sign-in. Check your connection and select Terrell again.'); });
    return () => { cancelled = true; };
  }, [role]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = role === 'terrell' && googleSignIn.current
        ? await googleSignIn.current()
        : await (await import('@/lib/firebase-client')).firebaseSignIn(email, password, role);
      const data: unknown = await response.json();
      if (!response.ok) {
        const message = typeof data === "object" && data !== null && "error" in data && typeof data.error === "string" ? data.error : `Login failed (${response.status}).`;
        setError(message);
        return;
      }
      const destination = typeof data === "object" && data !== null && "destination" in data && typeof data.destination === "string"
        ? data.destination
        : role === "terrell" ? "/dashboard" : "/interview";
      window.location.replace(sitePath(applicationLoginDestination(role, destination, window.location.search)));
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
      setError(code === "auth/invalid-credential" || code === "auth/user-not-found" || code === "auth/wrong-password"
        ? "Email or password is incorrect."
        : code === 'auth/owner-account-required' ? `Use the Google account ${OWNER_LOGIN_EMAIL} for owner access.`
        : code === 'auth/popup-blocked' ? 'Allow pop-ups for this site, then try Google sign-in again.'
        : code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request' ? 'Google sign-in was cancelled. You can try again.'
        : code === 'auth/unauthorized-domain' || code === 'auth/operation-not-allowed' ? 'Google sign-in is not configured for this site.'
        : code === 'auth/account-exists-with-different-credential' ? 'This Google account needs to be linked to the existing owner account.'
        : code === "auth/too-many-requests" ? "Too many attempts. Wait before trying again."
        : "Could not sign in. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <label htmlFor="role">Continue as
        <select id="role" value={role} disabled={busy} onChange={(event) => { setRole(event.target.value as SessionRole); setError(''); setPassword(''); }}>
          <option value="recruiter">Recruiter</option>
          <option value="interviewer">Interviewer</option>
          <option value="terrell">Terrell Singleton</option>
        </select>
      </label>
      <p className="role-description" aria-live="polite">{roleDescriptions[role]}</p>
      {role === 'terrell' ? <p>Owner access is limited to the Google account <strong>{OWNER_LOGIN_EMAIL}</strong>.</p> : <><label htmlFor="email">Email
        <input id="email" type="email" autoComplete="username" required disabled={busy} value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <label htmlFor="password">Password
        <input id="password" type="password" autoComplete="current-password" required disabled={busy} value={password} onChange={(event) => setPassword(event.target.value)} />
      </label></>}
      <button type="submit" disabled={busy || (role === 'terrell' && !googleReady)}>{busy ? "Signing in..." : role === 'terrell' ? (googleReady ? 'Continue with Google' : 'Preparing Google sign-in...') : `Continue as ${role[0].toUpperCase() + role.slice(1)}`}</button>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  );
}
