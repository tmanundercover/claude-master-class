import { createHash } from 'node:crypto';
import { MailError } from './validation.ts';
export const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
/** Optimization/conflict guard only. Live duplicate prevention remains provider-owned across instances. */
export class Attempts {
  private entries = new Map<string, { hash: string; result: Promise<unknown>; expires: number }>();
  run<T>(key: string, payload: unknown, execute: () => Promise<T>): Promise<T> {
    for (const [id, entry] of this.entries) if (entry.expires < Date.now()) this.entries.delete(id);
    const hash = digest(payload), previous = this.entries.get(key);
    if (previous) {
      if (previous.hash !== hash) throw new MailError('This attempt is bound to different content. Reconcile it before starting a new attempt.', 409, 'conflict');
      return previous.result as Promise<T>;
    }
    if (this.entries.size >= 2000) throw new MailError('Too many pending attempts. Retry later.', 429, 'rate_limit', 60);
    const result = execute().catch(error => { this.entries.delete(key); throw error; });
    this.entries.set(key, { hash, result, expires: Date.now() + 86400000 });
    return result;
  }
}
