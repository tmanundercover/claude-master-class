export const OWNER_LOGIN_EMAIL = 'terrell.singleton@gmail.com';

/** Call only with claims verified by Firebase Admin, for both ID tokens and cookies. */
export function isApprovedOwnerIdentity(claims: Record<string, unknown>): boolean {
  const provider = claims.firebase;
  return typeof claims.email === 'string' && claims.email.toLowerCase() === OWNER_LOGIN_EMAIL
    && claims.email_verified === true && typeof provider === 'object' && provider !== null
    && !Array.isArray(provider) && 'sign_in_provider' in provider && provider.sign_in_provider === 'google.com';
}
