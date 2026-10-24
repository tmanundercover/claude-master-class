"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { SessionRole } from "@/lib/session";

const roleDescriptions: Record<SessionRole, string> = {
  recruiter: "Browse concise stories, experience context, and technical themes.",
  interviewer: "Review full responses and drill into follow-up details.",
  terrell: "Open the owner workspace and all portfolio tools.",
};

export default function LoginForm() {
  const router = useRouter();
  const [role, setRole] = useState<SessionRole>("recruiter");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, password }),
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        const message = typeof data === "object" && data !== null && "error" in data && typeof data.error === "string" ? data.error : `Login failed (${response.status}).`;
        setError(message);
        return;
      }
      const destination = typeof data === "object" && data !== null && "destination" in data && typeof data.destination === "string"
        ? data.destination
        : role === "terrell" ? "/dashboard" : "/interview";
      router.replace(destination);
      router.refresh();
    } catch (error) {
      console.error("Login request failed:", error);
      setError("Could not reach the login service. Check the server and try again.");
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
      <label htmlFor="password">{role === "terrell" ? "Owner password" : "Interview room password"}
        <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
      </label>
      <button type="submit" disabled={busy}>{busy ? "Signing in..." : `Continue as ${role === "terrell" ? "Terrell" : role[0].toUpperCase() + role.slice(1)}`}</button>
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  );
}
