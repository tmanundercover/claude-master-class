import { Resend } from 'resend';
import { mailConfiguration } from '../mail/live.ts';
import { mailbox } from '../mail/index.ts';
import { boundedBody, MailError } from '../mail/validation.ts';
import { mailFailure, privateResponse } from './inbox.ts';
const EVENTS = new Set(['inbox.email.received','inbox.email.sent','inbox.thread.created','inbox.thread.folder.updated','inbox.thread.labels.updated','inbox.draft.created','inbox.draft.updated','inbox.draft.sent','inbox.draft.deleted']);
export async function mailEvents(request: Request): Promise<Response> {
  try {
    if (request.method !== 'POST') throw new MailError('Use POST for inbox events.', 405, 'method');
    const config = mailConfiguration();
    if (!config.webhookSecret) throw new MailError('Configure the backend webhook signing secret.', 503, 'configuration');
    const payload = await boundedBody(request, 256 * 1024);
    let event;
    try { event = new Resend(config.apiKey).webhooks.verify({ payload, headers: { id: request.headers.get('svix-id') ?? '', timestamp: request.headers.get('svix-timestamp') ?? '', signature: request.headers.get('svix-signature') ?? '' }, webhookSecret: config.webhookSecret }); }
    catch { throw new MailError('Invalid inbox event signature.', 401, 'signature'); }
    if (!EVENTS.has(event.type) || !('inbox_id' in event.data) || event.data.inbox_id !== config.inboxId) throw new MailError('Unsupported event or mailbox.', 400, 'event');
    // Safe repeated authoritative read. No local counters, sends, contact writes, or browser-push claims.
    await mailbox().summary();
    return privateResponse(Response.json({ status: 'accepted' }));
  } catch (error) { return mailFailure(error); }
}
