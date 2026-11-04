import type { SessionRole } from './session';
export function applicationReturnReference(search: string): string | null {
  const params = new URLSearchParams(search); const reference = params.get('applicationReturn') ?? params.get('return');
  return reference && /^[A-Za-z0-9_-]{8,128}$/.test(reference) ? reference : null;
}
export function applicationLoginDestination(role: SessionRole, destination: string, search: string) {
  const reference = applicationReturnReference(search);
  return role === 'terrell' && reference ? `/dashboard/inbox?applicationReturn=${encodeURIComponent(reference)}` : destination;
}
