import { useState, type FormEvent } from "react";
import { sitePath } from "@/lib/site-path";
import type { SessionRole } from "@/lib/session";

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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { firebaseSignIn } = await import("@/lib/firebase-client");
      const response = await firebaseSignIn(email, password, role);
      const data: unknown = await response.json();
      if (!response.ok) {
        const message = typeof data === "object" && data !== null && "error" in data && typeof data.error === "string" ? data.error : `Login failed (${response.status}).`;
        setError(message);
        return;
      }
      const destination = typeof data === "object" && data !== null && "destination" in data && typeof data.destination === "string"
        ? data.destination
        : role === "terrell" ? "/dashboard" : "/interview";
      window.location.replace(sitePath(destination));
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
      setError(code === "auth/invalid-credential" || code === "auth/user-not-found" || code === "auth/wrong-password"
        ? "Email or password is incorrect."
        : code === "auth/too-many-requests" ? "Too many attempts. Wait before trying again."
        : "Could not sign in. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <label htmlFor="role">Continue as
        <select id="role" value={role} onChange={(event) => setRole(event.target.value as SessionRole)}>
          <option value="recruiter">Recruiter</option>
          <option value="interviewer">Interviewer</option>
          <option value="terrell">Terrell Singleton</option>
        </select>
      </label>
      <p className="role-description" aria-live="polite">{roleDescriptions[role]}</p>
      <label htmlFor="email">Email
        <input id="email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <label htmlFor="password">Password
        <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
      </label>
      <button type="submit" disabled={busy}>{busy ? "Signing in..." : `Continue as ${role === "terrell" ? "Terrell" : role[0].toUpperCase() + role.slice(1)}`}</button>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  );
}
