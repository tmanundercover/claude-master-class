import { useState } from "react";
import { sitePath } from "@/lib/site-path";

export default function LogoutButton() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth", { method: "DELETE" });
      if (!response.ok) throw new Error(`Logout failed (${response.status}).`);
      window.location.replace(sitePath("/login"));
    } catch (error) {
      console.error("Logout request failed:", error);
      setError("Sign-out failed. Please retry.");
      setBusy(false);
    }
  }

  return <div><button className="secondary" disabled={busy} onClick={logout}>Sign out</button>{error && <p role="alert">{error}</p>}</div>;
}
