import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { isSessionRole, SESSION_COOKIE_NAME, SESSION_ROLES, type SessionRole } from "./session.ts";

export class AuthenticationConfigurationError extends Error {}

export function authConfiguration(env: NodeJS.ProcessEnv = process.env): { projectId: string } {
  const projectId = env.GCLOUD_PROJECT || env.GOOGLE_CLOUD_PROJECT;
  if (!projectId) throw new AuthenticationConfigurationError("The Firebase project is not configured.");
  return { projectId };
}

export function adminApp() {
  const { projectId } = authConfiguration();
  return getApps().find((app) => app.options.projectId === projectId)
    ?? initializeApp({ projectId }, `portfolio-${projectId}`);
}

export function adminAuth() { return getAuth(adminApp()); }

export interface SessionPrincipal { uid: string; role: SessionRole }

export async function currentSessionPrincipal(
  request: Request,
  verify = (token: string): Promise<Record<string, unknown>> => adminAuth().verifySessionCookie(token, true),
): Promise<SessionPrincipal | null> {
  let principal: SessionPrincipal | null = null;
  await currentSessionRole(request, async (token) => {
    const claims = await verify(token);
    const role = roleFromClaims(claims);
    if (role && typeof claims.uid === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(claims.uid)) {
      principal = { uid: claims.uid, role };
    }
    return claims;
  });
  return principal;
}

export function roleFromClaims(claims: Record<string, unknown>): SessionRole | null {
  return isSessionRole(claims.portfolioRole) ? claims.portfolioRole : null;
}

export function sessionToken(request: Request): string | undefined {
  return request.headers.get("cookie")?.split(";").map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`))?.slice(SESSION_COOKIE_NAME.length + 1);
}

export async function currentSessionRole(
  request: Request,
  verify = (token: string): Promise<Record<string, unknown>> => adminAuth().verifySessionCookie(token, true),
): Promise<SessionRole | null> {
  authConfiguration();
  const token = sessionToken(request);
  if (!token || token.length > 8192) return null;
  try { return roleFromClaims(await verify(token)); }
  catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    if (/^auth\/(argument-error|invalid-.*|.*-expired|.*-revoked|user-disabled|user-not-found)$/.test(code)) return null;
    throw error;
  }
}

export async function isAuthenticated(request: Request, allowedRoles: readonly SessionRole[] = SESSION_ROLES): Promise<boolean> {
  const role = await currentSessionRole(request);
  return role !== null && allowedRoles.includes(role);
}
