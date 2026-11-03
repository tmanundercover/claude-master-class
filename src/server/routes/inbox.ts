import { requireApiSession } from '../../lib/api.ts';
import { isSameOrigin } from '../../lib/origin.ts';
import { mailbox } from '../mail/index.ts';
import { safeEmailDocument } from '../mail/html.ts';
import { MailError, mailJson, composition, identifier, attemptId, keys, object, search, string, contactInput, agentInput } from '../mail/validation.ts';
import type { Mailbox } from '../../lib/mail-types.ts';
export function privateResponse(response: Response): Response { response.headers.set('Cache-Control', 'private, no-store'); response.headers.set('Vary', 'Cookie'); response.headers.set('X-Content-Type-Options', 'nosniff'); return response; }
export function mailFailure(error: unknown): Response {
  const e = error instanceof MailError ? error : new MailError('Mail service is unavailable.', 503, 'unavailable');
  return privateResponse(Response.json({ error: e.message, code: e.code }, { status: e.status, ...(e.retryAfter ? { headers: { 'Retry-After': String(e.retryAfter) } } : {}) }));
}
export async function inboxRoute(request: Request, dependencies = { authorize: requireApiSession, mailbox }): Promise<Response> {
  try {
    const denied = await dependencies.authorize(request);
    if (denied) return privateResponse(denied);
    if (!['GET','HEAD'].includes(request.method) && !isSameOrigin(request)) throw new MailError('Cross-origin mail changes are not allowed.', 403);
    return privateResponse(await dispatch(request, dependencies.mailbox));
  } catch (error) { return mailFailure(error); }
}
async function dispatch(request: Request, getMailbox: () => Mailbox): Promise<Response> {
  const url = new URL(request.url), parts = url.pathname.replace(/\/+$/, '').slice('/api/inbox/'.length).split('/');
  const method = request.method, [resource, rawId, child, rawEmail, action, rawAttachment] = parts;
  const id = rawId ? identifier(rawId) : undefined;
  if (method !== 'GET' || !((resource === 'threads' && (!id || child === 'messages')) || (!id && ['drafts','contacts'].includes(resource)))) keys(Object.fromEntries(url.searchParams), []);
  const cursor = () => { keys(Object.fromEntries(url.searchParams), ['after']); return url.searchParams.has('after') ? identifier(url.searchParams.get('after')) : undefined; };
  const json = (data: unknown) => Response.json(data);
  const body = () => mailJson(request, resource === 'drafts' || child === 'messages' ? undefined : 20000);
  // Only instantiate a provider after authorization, route validation, and body validation.
  if (resource === 'summary' && parts.length === 1 && method === 'GET') { keys(Object.fromEntries(url.searchParams), []); return json(await getMailbox().summary()); }
  if (resource === 'threads') {
    if (!id && method === 'GET') return json(await getMailbox().threads(search(url.searchParams)));
    if (id && parts.length === 2 && method === 'GET') return json(await getMailbox().thread(id));
    if (id && parts.length === 2 && method === 'PATCH') {
      const v = await body(); keys(v, ['read','folder']);
      if ((v.read !== undefined && typeof v.read !== 'boolean') || (v.folder !== undefined && !['inbox','archive','spam','trash'].includes(String(v.folder))) || !Object.keys(v).length) throw new MailError('Choose a supported read state or destination folder.');
      return json(await getMailbox().updateThread(id, v));
    }
    if (id && child === 'labels' && parts.length === 3 && method === 'PUT') {
      const v = await body(); keys(v, ['labels']);
      if (!Array.isArray(v.labels) || v.labels.length > 10) throw new MailError('Use at most 10 labels.');
      return json(await getMailbox().threadLabels(id, v.labels.map(identifier)));
    }
    if (id && child === 'messages') {
      if (parts.length === 3 && method === 'GET') return json(await getMailbox().messages(id, cursor()));
      if (!rawEmail) throw new MailError('Unsupported mailbox route or method.', 405, 'method');
      const email = identifier(rawEmail);
      if (parts.length === 4 && method === 'GET') {
        keys(Object.fromEntries(url.searchParams), ['remoteImages']);
        const message = await getMailbox().message(id, email);
        return json({ ...message, html: null, document: message.html ? safeEmailDocument(message.html, url.searchParams.get('remoteImages') === 'true') : null });
      }
      if (parts.length === 6 && action === 'attachments' && method === 'GET') {
        keys(Object.fromEntries(url.searchParams), []);
        const a = await getMailbox().attachment(id, email, identifier(rawAttachment));
        return new Response(Buffer.from(a.bytes), { headers: { 'Content-Type': 'application/octet-stream', 'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(a.filename).replace(/['()*]/g, c => `%${c.charCodeAt(0).toString(16)}`)}`, 'Content-Security-Policy': "default-src 'none'; sandbox" } });
      }
      if (parts.length === 5 && ['reply','reply-all','forward'].includes(action) && method === 'POST') {
        const v = await body(); keys(v, ['content','attempt']); const content = composition(v.content), attempt = attemptId(v.attempt);
        return json(await getMailbox().respond(id, email, action as 'reply' | 'reply-all' | 'forward', content, attempt));
      }
    }
  }
  if (resource === 'drafts') {
    if (!id && method === 'GET') return json(await getMailbox().drafts(cursor()));
    if (id && parts.length === 2 && method === 'GET') return json(await getMailbox().draft(id));
    if (id && parts.length === 2 && method === 'DELETE') return json(await getMailbox().discardDraft(id));
    if ((!id && method === 'POST') || (id && parts.length === 2 && method === 'PATCH')) {
      const v = await body(); keys(v, ['content','attempt']); const content = composition(v.content), attempt = attemptId(v.attempt);
      return json(await getMailbox().saveDraft(id ?? null, content, attempt));
    }
    if (id && child === 'send' && parts.length === 3 && method === 'POST') { const v = await body(); keys(v, ['attempt']); const attempt = attemptId(v.attempt); return json(await getMailbox().sendDraft(id, attempt)); }
  }
  if (resource === 'labels') {
    if (!id && method === 'GET') return json(await getMailbox().labels());
    if (id && parts.length === 2 && method === 'DELETE') return json(await getMailbox().deleteLabel(id));
    if ((!id && method === 'POST') || (id && parts.length === 2 && method === 'PATCH')) {
      const v = await body(); keys(v, ['name','color']); const name = string(v.name, 100, 'label name', true), color = string(v.color, 7, 'label color');
      if (!/^#[0-9a-f]{6}$/i.test(color)) throw new MailError('Use a #RRGGBB label color.');
      return json(await getMailbox().saveLabel(id ?? null, { name, color }));
    }
  }
  if (resource === 'contacts') {
    if (!id && method === 'GET') return json(await getMailbox().contacts(cursor()));
    if (id && parts.length === 2 && method === 'DELETE') return json(await getMailbox().deleteContact(id));
    if ((!id && method === 'POST') || (id && parts.length === 2 && method === 'PATCH')) { const value = contactInput(await body()); return json(await getMailbox().saveContact(id ?? null, value)); }
  }
  if (resource === 'settings' && parts.length === 1) {
    if (method === 'GET') return json(await getMailbox().settings());
    if (method === 'PUT') { const v = await body(); keys(v, ['name','fromName','agent']); const name = string(v.name, 100, 'inbox name', true), fromName = string(v.fromName, 100, 'display name', true); if (/[\r\n<>]/.test(fromName)) throw new MailError('Invalid display name.'); const agent = agentInput(object(v.agent)); return json(await getMailbox().saveSettings({ name, fromName, agent })); }
  }
  throw new MailError('Unsupported mailbox route or method.', 405, 'method');
}
