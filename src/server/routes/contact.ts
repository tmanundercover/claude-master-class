import { createHash } from 'node:crypto';
import { isSameOrigin } from '../../lib/origin.ts';
import { mailbox } from '../mail/index.ts';
import { mailFailure, privateResponse } from './inbox.ts';
import { mailJson, submission, MailError } from '../mail/validation.ts';
export class ContactLimiter {
  private clients = new Map<string, { count: number; reset: number }>();
  check(request: Request) {
    const now = Date.now();
    for (const [key, entry] of this.clients) if (entry.reset <= now) this.clients.delete(key);
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const key = createHash('sha256').update(ip).digest('hex');
    const entry = this.clients.get(key) ?? { count: 0, reset: now + 600000 };
    if (entry.count >= 5 || (!this.clients.has(key) && this.clients.size >= 5000)) throw new MailError('Too many submissions. Please retry later.', 429, 'rate_limit', Math.ceil((entry.reset - now) / 1000));
    entry.count++; this.clients.set(key, entry);
  }
}
const limiter = new ContactLimiter();
export async function contactRoute(request: Request, dependencies = { mailbox, limiter }): Promise<Response> {
  try {
    if (request.method !== 'POST') throw new MailError('Use POST for contact messages.', 405, 'method');
    if (!isSameOrigin(request)) throw new MailError('Cross-origin contact submissions are not allowed.', 403);
    const value = submission(await mailJson(request, 12 * 1024));
    dependencies.limiter.check(request);
    const service = dependencies.mailbox();
    await service.contact(value);
    return privateResponse(Response.json({ status: 'accepted', localTest: service.mode === 'fixture' }, { status: 202 }));
  } catch (error) { return mailFailure(error); }
}
