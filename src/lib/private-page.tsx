import { redirect } from "next/navigation";
import { authConfiguration, currentSessionRole } from "./auth";
import type { SessionRole } from "./session";

export async function privatePageGuard(allowedRoles: readonly SessionRole[] = ["terrell"]) {
  let role: SessionRole | null;
  try {
    authConfiguration();
    role = await currentSessionRole();
  } catch (error) {
    console.error("Private page configuration error:", error);
    return <main id="main" className="workspace"><h1>Configure your private workspace</h1><p className="error" role="alert">Set SITE_PASSWORD and INTERVIEW_PASSWORD (12+ characters each) plus SESSION_SECRET (32+ random characters) in .env.local, then restart. The public portfolio does not need these values.</p></main>;
  }
  if (!role) redirect("/login");
  if (!allowedRoles.includes(role)) redirect("/interview");
  return null;
}
