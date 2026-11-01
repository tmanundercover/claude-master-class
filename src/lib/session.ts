// Firebase Hosting forwards this cookie to Functions; Firebase Auth signs its value.
export const SESSION_COOKIE_NAME = "__session";
export const SESSION_DURATION_SECONDS = 4 * 60 * 60;
export const SESSION_ROLES = ["recruiter", "interviewer", "terrell"] as const;
export type SessionRole = (typeof SESSION_ROLES)[number];

export function isSessionRole(value: unknown): value is SessionRole {
  return typeof value === "string" && SESSION_ROLES.some((role) => role === value);
}

export function sessionCookieOptions() {
  return { httpOnly: true, secure: true, sameSite: "strict" as const, path: "/", maxAge: SESSION_DURATION_SECONDS };
}

export function expiredSessionCookieOptions() {
  return { ...sessionCookieOptions(), expires: new Date(0), maxAge: 0 };
}
