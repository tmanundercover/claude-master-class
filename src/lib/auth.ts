import {
  readSessionRole,
  SESSION_COOKIE_NAME,
  SESSION_ROLES,
  type SessionRole,
} from "./session.ts";

type AuthenticationEnvironment = Partial<Record<"SITE_PASSWORD" | "SESSION_SECRET" | "INTERVIEW_PASSWORD", string | undefined>>;

export class AuthenticationConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationConfigurationError";
  }
}

function requiredSetting(env: AuthenticationEnvironment, name: "SITE_PASSWORD" | "SESSION_SECRET" | "INTERVIEW_PASSWORD"): string {
  const value = env[name];
  if (!value || value.trim().length === 0) {
    throw new AuthenticationConfigurationError(`${name} is not set.`);
  }
  return value;
}

function distinctCharacters(value: string): number {
  return new Set(value).size;
}

export function authConfiguration(env: AuthenticationEnvironment = {
  SITE_PASSWORD: process.env.SITE_PASSWORD,
  SESSION_SECRET: process.env.SESSION_SECRET,
  INTERVIEW_PASSWORD: process.env.INTERVIEW_PASSWORD,
}): { password: string; secret: string; interviewPassword: string } {
  const password = requiredSetting(env, "SITE_PASSWORD");
  const secret = requiredSetting(env, "SESSION_SECRET");
  const interviewPassword = requiredSetting(env, "INTERVIEW_PASSWORD");

  if (password.trim().length < 12 || distinctCharacters(password) < 4 || /^(password|changeme|letmein)/i.test(password)) {
    throw new AuthenticationConfigurationError("SITE_PASSWORD must be at least 12 characters and must not be an obvious or repetitive password.");
  }
  if (secret.trim().length < 32 || distinctCharacters(secret) < 8 || /(password|change.?me|placeholder|example|workshop.*secret)/i.test(secret)) {
    throw new AuthenticationConfigurationError("SESSION_SECRET must be at least 32 random characters and must not be a placeholder or repetitive value.");
  }
  if (interviewPassword.trim().length < 12 || distinctCharacters(interviewPassword) < 4 || /^(password|changeme|letmein)/i.test(interviewPassword)) {
    throw new AuthenticationConfigurationError("INTERVIEW_PASSWORD must be at least 12 characters and must not be an obvious or repetitive password.");
  }
  if (new Set([password, secret, interviewPassword]).size !== 3) {
    throw new AuthenticationConfigurationError("SITE_PASSWORD, INTERVIEW_PASSWORD, and SESSION_SECRET must be different values.");
  }
  return { password, secret, interviewPassword };
}

export async function currentSessionRole(): Promise<SessionRole | null> {
  const { secret } = authConfiguration();
  const { cookies } = await import("next/headers");
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  return readSessionRole(token, secret);
}

export async function isAuthenticated(allowedRoles: readonly SessionRole[] = SESSION_ROLES): Promise<boolean> {
  const role = await currentSessionRole();
  return role !== null && allowedRoles.includes(role);
}
