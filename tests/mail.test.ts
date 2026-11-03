import test from 'node:test';
import assert from 'node:assert/strict';
import { Resend } from 'resend';
import { FixtureMailbox } from '../src/server/mail/fixture.ts';
import { LiveMailbox, mailConfiguration, trustedAttachmentURL } from '../src/server/mail/live.ts';
import { composition, submission, search, boundedBody, mailJson, MailError } from '../src/server/mail/validation.ts';
import { safeEmailDocument } from '../src/server/mail/html.ts';
import { inboxRoute } from '../src/server/routes/inbox.ts';
import { contactRoute, ContactLimiter } from '../src/server/routes/contact.ts';
import { OWNER_EMAIL, MAIL_LIMITS, type Composition } from '../src/lib/mail-types.ts';
const content: Composition = { to: ['visitor@example.test'], cc: [], bcc: [], subject: 'Hello', text: 'A private message', html: '' };
const contact = { name: 'Visitor', email: 'visitor@example.test', message: 'A question', website: '', attempt: 'contact-attempt-00000001' };
const config = mailConfiguration({ RESEND_MODE: 'fixture', FUNCTIONS_EMULATOR: 'true', GCLOUD_PROJECT: 'demo-test' });

function contactCopies(id: string) {
  const message = { id, direction: 'outbound' as const, from: config.contactFrom, to: [OWNER_EMAIL], cc: [], bcc: [], reply_to: [contact.email], subject: `Website message from ${contact.name}`, message_id: '<contact-smtp-id>', text: contact.message, html: null, attachments: [], read: true, received_at: '2026-11-03T12:00:00Z' };
  return [message, { ...message, id: `received-${id}`, direction: 'inbound' as const }];
}

function request(path: string, method = 'GET', body?: unknown, origin = 'https://site.test') { return new Request(`https://site.test${path}`, { method, headers: { 'Content-Type': 'application/json', Origin: origin }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }); }
test('mail modes fail closed for missing configuration and production fixtures', () => {
  for (const env of [{}, { RESEND_MODE: 'fixture' }, { RESEND_MODE: 'fixture', FUNCTIONS_EMULATOR: 'true', GCLOUD_PROJECT: 'real-project' }, { RESEND_MODE: 'live', RESEND_API_KEY: 'present' }]) assert.throws(() => mailConfiguration(env), /configure|explicitly|emulation/i);
  assert.equal(config.email, OWNER_EMAIL);
});
test('fixture conversations, pagination, draft sends and retry identity never access the network', async t => {
  t.mock.method(globalThis, 'fetch', () => { throw new Error('Unexpected provider send'); });
  const box = new FixtureMailbox();
  assert.equal((await box.summary()).unread, 25);
  const first = await box.threads({ folder: 'inbox' }); assert.equal(first.has_more, true); assert.equal(first.data.length, 20);
  assert.equal((await box.threads({ after: first.data.at(-1)!.id })).data.length, 5);
  const created = await box.saveDraft(null, content, 'draft-create-attempt1');
  assert.deepEqual(await box.saveDraft(null, content, 'draft-create-attempt1'), created);
  await assert.rejects(box.saveDraft(null, { ...content, text: 'conflict' }, 'draft-create-attempt1'), /different content/);
  assert.equal((await box.summary()).drafts, 1);
  const [sent, retry] = await Promise.all([box.sendDraft(created.id, 'send-attempt-00000001'), box.sendDraft(created.id, 'send-attempt-00000001')]);
  assert.deepEqual(sent, retry); assert.equal((await box.threads({ folder: 'sent' })).data.length, 1); assert.equal((await box.summary()).drafts, 0);
});
test('contact ingress deduplicates without contacts, supports visitor replies and follow-up in one thread', async () => {
  const box = new FixtureMailbox(); await box.contact(contact); await box.contact(contact);
  const threads = await box.threads({ query: 'A question' }); assert.equal(threads.data.length, 1);
  const thread = threads.data[0], original = (await box.messages(thread.id)).data[0];
  assert.deepEqual(original.reply_to, [contact.email]);
  assert.equal(original.direction, 'outbound');
  assert.equal((await box.messages(thread.id)).data[1].direction, 'inbound');
  assert.equal((await box.thread(thread.id)).folder, 'inbox');
  const replyDraft = await box.saveDraft(null, { ...content, threadId: thread.id, replyToEmailId: original.id }, 'contact-reply-draft-001');
  assert.equal((await box.draft(replyDraft.id)).reply_to_email_id, (await box.messages(thread.id)).data[1].id);
  await box.respond(thread.id, original.id, 'reply-all', content, 'reply-attempt-0000001');
  const outbound = (await box.messages(thread.id)).data.at(-1)!; assert.deepEqual(outbound.to, [contact.email]);
  box.receive('Re: question', contact.email, 'Thanks', thread.id); assert.equal((await box.messages(thread.id)).data.length, 4);
  assert.equal((await box.contacts()).data.length, 0);
});
test('fixture labels, combined searches, organization, contacts and settings persist separately', async () => {
  const box = new FixtureMailbox(), id = (await box.threads({})).data[0].id;
  const label = await box.saveLabel(null, { name: 'Hiring', color: '#123456' });
  await box.threadLabels(id, [label.id]); await box.updateThread(id, { read: true, folder: 'archive' });
  assert.equal((await box.threads({ folder: 'archive', label: label.id, read: true, from: 'person23@example.test', startDate: '2026-11-01', endDate: '2026-11-30', query: 'Local' })).data.length, 1);
  await box.saveLabel(label.id, { name: 'Follow-up', color: '#654321' }); assert.equal((await box.thread(id)).labels[0].name, 'Follow-up');
  const person = await box.saveContact(null, { email: 'person@example.test', firstName: 'Test', lastName: 'Contact' });
  await box.updateThread(id, { folder: 'trash' }); assert.equal((await box.contacts()).data.length, 1);
  await box.saveContact(person.id, { email: 'person@example.test', firstName: 'Edited', lastName: 'Contact' }); assert.equal((await box.contacts()).data[0].unsubscribed, true);
  const settings = await box.settings(); assert.deepEqual(settings.agent.actions, []); await box.saveSettings({ ...settings, name: 'Saved inbox' }); assert.equal((await box.settings()).name, 'Saved inbox');
  await box.deleteLabel(label.id); assert.equal((await box.thread(id)).labels.length, 0); await box.deleteContact(person.id); assert.equal((await box.contacts()).data.length, 0);
});
test('composition validates decoded bytes, encoding overhead, fields, addresses and file types', () => {
  const attachment = { filename: 'a.txt', contentType: 'text/plain', content: Buffer.alloc(MAIL_LIMITS.attachments, 97).toString('base64') };
  assert.equal(composition({ ...content, attachments: [attachment] }).attachments!.length, 1);
  for (const value of [{ ...content, from: OWNER_EMAIL }, { ...content, to: ['bad\r\nBcc: x@test.com'] }, { ...content, attachments: [{ ...attachment, content: attachment.content + 'YQ==' }] }, { ...content, attachments: [{ filename: 'attack.html', contentType: 'text/html', content: 'YQ==' }] }, { ...content, text: 'é'.repeat(MAIL_LIMITS.content) }, { ...content, attachments: [{ ...attachment, path: 'https://localhost/private' }] }]) assert.throws(() => composition(value));
  assert.throws(() => search(new URLSearchParams({ inboxId: 'foreign' }))); assert.throws(() => search(new URLSearchParams({ read: 'maybe' })));
});
test('mail parser bounds bytes while streaming and rejects malformed JSON and misleading lengths', async () => {
  const exact = new Request('https://test', { method: 'POST', body: 'a'.repeat(12) }); assert.equal((await boundedBody(exact, 12)).length, 12);
  await assert.rejects(boundedBody(new Request('https://test', { method: 'POST', body: 'a'.repeat(13) }), 12), /too large/);
  await assert.rejects(boundedBody(new Request('https://test', { method: 'POST', headers: { 'Content-Length': '999' }, body: '' }), 12), /too large/);
  await assert.rejects(mailJson(new Request('https://test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })), /valid JSON/);
});
test('every inbox operation authorizes before body parsing or provider creation', async () => {
  const paths = ['summary','threads','threads/foreign','threads/foreign/labels','threads/foreign/messages','threads/foreign/messages/email','threads/foreign/messages/email/attachments/file','threads/foreign/messages/email/reply','threads/foreign/messages/email/reply-all','threads/foreign/messages/email/forward','drafts','drafts/foreign','drafts/foreign/send','labels','labels/foreign','contacts','contacts/foreign','settings'];
  for (const roleStatus of [401, 403]) for (const path of paths) for (const method of ['GET','POST','PATCH','PUT','DELETE']) {
    const result = await inboxRoute(request(`/api/inbox/${path}`, method, method === 'GET' ? undefined : 'x'.repeat(160000)), { authorize: async () => Response.json({ error: 'denied' }, { status: roleStatus }), mailbox: () => { throw new Error('Provider accessed'); } });
    assert.equal(result.status, roleStatus, path); assert.equal(result.headers.get('cache-control'), 'private, no-store');
  }
});
test('authorized mail dispatch checks method, origins, foreign resources and fixed identity', async () => {
  const box = new FixtureMailbox(), dependencies = { authorize: async () => null, mailbox: () => box };
  assert.equal((await inboxRoute(request('/api/inbox/summary'), dependencies)).status, 200);
  assert.equal((await inboxRoute(request('/api/inbox/threads?inboxId=foreign'), dependencies)).status, 400);
  assert.equal((await inboxRoute(request('/api/inbox/drafts', 'POST', { content: { ...content, from: 'foreign@test.com' }, attempt: 'attempt-0000000001' }), dependencies)).status, 400);
  assert.equal((await inboxRoute(request('/api/inbox/threads/foreign/messages/foreign/attachments/foreign'), dependencies)).status, 404);
  assert.equal((await inboxRoute(request('/api/inbox/threads/thread-1/messages/email-2/attachments/attachment-1?url=https://localhost'), dependencies)).status, 400);
  const download = await inboxRoute(request('/api/inbox/threads/thread-1/messages/email-2/attachments/attachment-1'), dependencies); assert.equal(download.status, 200); assert.match(download.headers.get('content-disposition')!, /attachment/); assert.match(download.headers.get('content-security-policy')!, /sandbox/);
  assert.equal((await inboxRoute(request('/api/inbox/threads/thread-1', 'PATCH', { read: true }, 'https://evil.test'), dependencies)).status, 403);
  assert.equal((await inboxRoute(request('/api/inbox/summary', 'DELETE'), dependencies)).status, 405);
});
test('public endpoint rejects routing, headers, honeypots, cross-origin, malformed and rate-limited submissions before sending', async () => {
  let called = 0; const box = new FixtureMailbox(); const dependencies = { mailbox: () => { called++; return box; }, limiter: new ContactLimiter() };
  for (const bad of [{ ...contact, to: 'victim@test.com' }, { ...contact, name: 'Visitor\r\nX: test' }, { ...contact, email: 'invalid' }, { ...contact, message: 'a'.repeat(8001) }, { ...contact, website: 'bot' }]) assert.equal((await contactRoute(request('/api/contact','POST',bad), dependencies)).status, 400);
  assert.equal((await contactRoute(request('/api/contact','POST',contact,'https://evil.test'), dependencies)).status, 403); assert.equal(called, 0);
  for (let i = 0; i < 5; i++) assert.equal((await contactRoute(request('/api/contact','POST',contact), dependencies)).status, 202);
  const limited = await contactRoute(request('/api/contact','POST',contact), dependencies); assert.equal(limited.status, 429); assert.ok(Number(limited.headers.get('retry-after')) > 0); assert.equal(called, 5);
  assert.equal((await box.threads({ query: 'A question' })).data.length, 1);
  assert.throws(() => submission({ ...contact, headers: {} }));
});
test('email sanitization strips active content and tracking until explicit image consent', () => {
  const html = '<script>alert(1)</script><form><input></form><svg onload="alert(1)"></svg><p onclick="alert(1)">Hi</p><img src="https://tracker.test/a"><a href="javascript:alert(1)">bad</a><a href="https://example.com">safe</a>';
  const safe = safeEmailDocument(html); assert.doesNotMatch(safe, /<script|<form|<input|<svg|onclick|javascript:|<img|tracker\.test/); assert.match(safe, /noopener noreferrer/);
  assert.match(safeEmailDocument(html, true), /<img src="https:\/\/tracker.test/);
  for (const url of ['http://inbound-cdn.resend.com/a','https://inbound-cdn.resend.com.evil.test/a','https://localhost/a','https://inbound-cdn.resend.com:444/a','https://user@inbound-cdn.resend.com/a']) assert.equal(trustedAttachmentURL(new URL(url)), false);
  assert.equal(trustedAttachmentURL(new URL('https://inbound-cdn.resend.com/a')), true);
});
test('pinned SDK maps selectors, combined search, contact reply-to, pagination, native response and idempotency', async t => {
  const requests: Array<{ url: URL; method: string; headers: Headers; body: Record<string, unknown> }> = [];
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input)), body = init?.body ? JSON.parse(String(init.body)) : {};
    requests.push({ url, method: init?.method ?? 'GET', headers: new Headers(init?.headers), body });
    if (url.pathname === '/inboxes/fixture-owner/threads') return Response.json({ data: [{ id: 'contact-thread', subject: `Website message from ${contact.name}`, folder: 'spam' }], has_more: false });
    if (url.pathname === '/inboxes/fixture-owner/threads/contact-thread/emails') return Response.json({ data: contactCopies('result-1'), has_more: false });
    if (url.pathname.endsWith('/emails/email-1') && init?.method === 'GET') return Response.json({ ...contactCopies('email-1')[1], id: 'email-1' });
    if (url.pathname === '/inboxes/fixture-owner' && init?.method === 'GET') return Response.json({ email_address: OWNER_EMAIL, unread: 7, drafts: 3, last_received: null });
    if (init?.method === 'GET') return Response.json({ data: [], has_more: true });
    return Response.json({ id: 'result-1' });
  });
  const box = new LiveMailbox({ ...config, mode: 'live' }, new Resend('test-key'));
  const summary = await box.summary(); assert.equal(summary.unread, 7); assert.equal(summary.drafts, 3);
  await box.threads({ folder: 'inbox', query: 'hello', read: false, label: 'label-1', from: contact.email, to: OWNER_EMAIL, hasAttachment: true, startDate: '2026-11-01', endDate: '2026-11-30', after: 'cursor-1' });
  const query = requests.at(-1)!.url.searchParams; assert.equal(query.get('query'), 'hello'); assert.equal(query.get('after'), 'cursor-1'); assert.ok(requests.at(-1)!.url.pathname.includes('/inboxes/fixture-owner/threads/search'));
  await box.saveDraft(null, content, 'draft-attempt-000001'); assert.equal(requests.at(-1)!.headers.get('Idempotency-Key'), 'draft-draft-attempt-000001');
  await box.respond('thread-1', 'email-1', 'reply-all', content, 'reply-attempt-000001'); assert.equal(requests.at(-1)!.body.reply_all, true); assert.equal(requests.at(-1)!.body.to, undefined);
  await box.respond('thread-1', 'email-1', 'forward', content, 'forward-attempt-0001'); assert.deepEqual(requests.at(-1)!.body.to, content.to);
  await box.contact(contact); const sent = requests.findLast(r => r.url.pathname === '/emails' && r.method === 'POST')!; assert.deepEqual(sent.body.to, [OWNER_EMAIL]); assert.equal(sent.body.reply_to, contact.email); assert.equal(sent.headers.get('Idempotency-Key'), `contact-${contact.attempt}`);
});
test('live reads retry bounded failures; writes expose uncertainty and reuse immutable provider keys', async t => {
  let count = 0; const keys: (string | null)[] = []; let mode = 'network';
  t.mock.method(globalThis, 'fetch', async (_input: unknown, init?: RequestInit) => {
    count++; keys.push(new Headers(init?.headers).get('Idempotency-Key'));
    if (init?.method === 'GET' && mode === 'accepted') return Response.json({ data: String(_input).endsWith('/emails?limit=50') ? contactCopies('accepted') : [{ id: 'contact-thread', subject: `Website message from ${contact.name}`, folder: 'inbox' }], has_more: false });
    if (mode === 'network') throw new Error('timeout');
    if (mode === 'rate') return Response.json({ name: 'rate_limit_exceeded', message: 'limited', statusCode: 429 }, { status: 429, headers: { 'retry-after': '30' } });
    if (mode === 'conflict') return Response.json({ name: 'invalid_idempotent_request', message: 'conflict', statusCode: 409 }, { status: 409 });
    return Response.json({ id: 'accepted' });
  });
  const box = new LiveMailbox({ ...config, mode: 'live' });
  await assert.rejects(box.threads({}), (e: MailError) => e.code === 'unavailable'); assert.equal(count, 3);
  count = 0;
  await assert.rejects(box.contact(contact), (e: MailError) => e.code === 'uncertain'); assert.equal(count, 1);
  mode = 'accepted'; await box.contact(contact); assert.equal(keys.filter(k => k === `contact-${contact.attempt}`).length, 2);
  await assert.rejects(box.contact({ ...contact, message: 'changed' }), /different content/);
  mode = 'rate'; await assert.rejects(box.threads({}), (e: MailError) => e.status === 429 && e.retryAfter === 30);
  mode = 'conflict'; await assert.rejects(box.saveDraft(null, content, 'different-attempt0001'), (e: MailError) => e.status === 409);
});
test('lost provider response reconciles one send across adapter instances with the same idempotency key', async t => {
  const accepted = new Map<string, { hash: string; id: string }>(); let deliveries = 0, lose = true;
  t.mock.method(globalThis, 'fetch', async (_input: unknown, init?: RequestInit) => {
    if (init?.method === 'GET') return Response.json({ data: String(_input).includes('/emails?') ? contactCopies('outbound-1') : [{ id: 'contact-thread', subject: `Website message from ${contact.name}`, folder: 'inbox' }], has_more: false });
    const key = new Headers(init?.headers).get('Idempotency-Key')!, hash = String(init?.body);
    const prior = accepted.get(key);
    if (prior && prior.hash !== hash) return Response.json({ name: 'invalid_idempotent_request', statusCode: 409, message: 'changed' }, { status: 409 });
    const result = prior ?? { hash, id: `outbound-${++deliveries}` }; accepted.set(key, result);
    if (lose) { lose = false; throw new Error('Lost response after provider acceptance'); }
    return Response.json({ id: result.id });
  });
  const box = new LiveMailbox({ ...config, mode: 'live' });
  await assert.rejects(box.contact(contact), (e: MailError) => e.code === 'uncertain');
  assert.deepEqual(await new LiveMailbox({ ...config, mode: 'live' }).contact(contact), { id: 'outbound-1' });
  await assert.rejects(new LiveMailbox({ ...config, mode: 'live' }).contact({ ...contact, message: 'changed' }), (e: MailError) => e.code === 'conflict');
  assert.equal(deliveries, 1);
});
test('native draft send reconciles email_id after a lost response without sending twice', async t => {
  let sent: string | null = null, sends = 0;
  const seenKeys: string[] = [];
  t.mock.method(globalThis, 'fetch', async (_input: unknown, init?: RequestInit) => {
    if (init?.method === 'GET') return Response.json({ id: 'draft-1', ...content, thread_id: null, email_id: sent, attachments: [], updated_at: '2026-11-03T00:00:00Z' });
    sends++; seenKeys.push(new Headers(init?.headers).get('Idempotency-Key')!); sent = 'sent-email-1';
    const body = JSON.parse(String(init?.body)); assert.match(body.headers['X-Owner-Draft-Content'], /^[0-9a-f]{64}$/);
    throw new Error('Accepted but response lost');
  });
  await assert.rejects(new LiveMailbox({ ...config, mode: 'live' }).sendDraft('draft-1', 'stable-send-attempt001'), (e: MailError) => e.code === 'uncertain');
  assert.deepEqual(await new LiveMailbox({ ...config, mode: 'live' }).sendDraft('draft-1', 'stable-send-attempt001'), { id: 'sent-email-1' });
  assert.equal(sends, 1); assert.equal(seenKeys[0], 'send-stable-send-attempt001');
});
test('fixture contact cursors preserve account preferences across updates and mail operations', async () => {
  const box = new FixtureMailbox();
  for (let i=0; i<22; i++) await box.saveContact(null, { email: `saved${i}@example.test`, firstName: 'Contact', lastName: String(i) });
  const first = await box.contacts(); assert.equal(first.data.length, 20); assert.equal(first.has_more, true);
  const second = await box.contacts(first.data.at(-1)!.id); assert.equal(second.data.length, 2); assert.equal(second.has_more, false);
  const person = first.data[0];
  await box.saveContact(person.id, { email: person.email, firstName: 'Updated', lastName: 'Name' });
  await box.contact(contact); await box.updateThread('thread-1', { folder: 'trash' });
  assert.equal((await box.contacts()).data[0].unsubscribed, person.unsubscribed);
});

test('contact ingress waits for the received SMTP copy before moving the native Spam thread to Inbox', async t => {
  let sends = 0, polls = 0; const moves: unknown[] = [];
  t.mock.method(globalThis, 'fetch', async (input: unknown, init?: RequestInit) => {
    const url = new URL(String(input));
    if (url.pathname === '/emails') { sends++; return Response.json({ id: 'accepted-contact' }); }
    if (url.pathname.endsWith('/threads')) { polls++; return Response.json({ data: [{ id: 'contact-thread', subject: `Website message from ${contact.name}`, folder: polls === 1 ? 'sent' : 'spam' }], has_more: false }); }
    if (url.pathname.endsWith('/emails')) return Response.json({ data: contactCopies('accepted-contact').slice(0, polls === 1 ? 1 : 2), has_more: false });
    if (init?.method === 'PATCH') { moves.push(JSON.parse(String(init.body))); assert.ok(polls >= 2, 'Do not file the outbound-only copy before SMTP delivery'); return Response.json({ id: 'contact-thread' }); }
    throw new Error('Unexpected provider operation');
  });
  const box = new LiveMailbox({ ...config, mode: 'live' });
  await box.contact(contact); await box.contact(contact);
  assert.equal(sends, 1); assert.equal(polls, 2); assert.deepEqual(moves, [{ folder: 'inbox', read: false }]);
});

test('contact placement cannot move an unrelated message with the same subject or a mismatched SMTP identity', async t => {
  let moves = 0, wrongSMTP = false;
  t.mock.method(globalThis, 'fetch', async (input: unknown, init?: RequestInit) => {
    const url = new URL(String(input));
    if (init?.method === 'PATCH') { moves++; return Response.json({ id: 'wrong-thread' }); }
    if (url.pathname === '/emails') return Response.json({ id: 'accepted-contact' });
    if (url.pathname.endsWith('/threads')) return Response.json({ data: [{ id: 'wrong-thread', subject: `Website message from ${contact.name}`, folder: 'spam' }], has_more: false });
    const messages = contactCopies(wrongSMTP ? 'accepted-contact' : 'unrelated-send');
    if (wrongSMTP) messages[1].message_id = '<different-smtp-message>';
    return Response.json({ data: messages, has_more: false });
  });
  const box = new LiveMailbox({ ...config, mode: 'live' });
  await assert.rejects(box.contact(contact), (e: MailError) => e.code === 'uncertain' && /accepted/.test(e.message));
  assert.equal(moves, 0);
  wrongSMTP = true;
  await assert.rejects(box.contact(contact), (e: MailError) => e.code === 'uncertain');
  assert.equal(moves, 0);
});

test('lost folder-update responses retry the accepted send key and preserve existing Inbox read state', async t => {
  const keys: string[] = []; let deliveries = 0, attempts = 0, folder = 'spam', moves = 0;
  t.mock.method(globalThis, 'fetch', async (input: unknown, init?: RequestInit) => {
    const url = new URL(String(input));
    if (url.pathname === '/emails') { keys.push(new Headers(init?.headers).get('Idempotency-Key')!); if (!deliveries) deliveries++; return Response.json({ id: 'accepted-contact' }); }
    if (url.pathname.endsWith('/threads')) return Response.json({ data: [{ id: 'contact-thread', subject: `Website message from ${contact.name}`, folder, read: true }], has_more: false });
    if (url.pathname.endsWith('/emails')) return Response.json({ data: contactCopies('accepted-contact'), has_more: false });
    if (init?.method === 'PATCH') { moves++; attempts++; folder = 'inbox'; throw new Error('Update applied but response lost'); }
    throw new Error('Unexpected provider operation');
  });
  await assert.rejects(new LiveMailbox({ ...config, mode: 'live' }).contact(contact), (e: MailError) => e.code === 'uncertain');
  assert.equal(attempts, 1);
  await new LiveMailbox({ ...config, mode: 'live' }).contact(contact);
  assert.equal(deliveries, 1); assert.deepEqual(keys, [`contact-${contact.attempt}`, `contact-${contact.attempt}`]); assert.equal(moves, 1, 'Do not reset read state once already filed');
});

test('reply and reply-draft actions on a website outbound copy bind to the matching received message', async t => {
  const requests: Array<{ path: string; body: Record<string, unknown> }> = [];
  t.mock.method(globalThis, 'fetch', async (input: unknown, init?: RequestInit) => {
    const url = new URL(String(input));
    requests.push({ path: url.pathname, body: init?.body ? JSON.parse(String(init.body)) : {} });
    if (url.pathname.endsWith('/emails/sent-contact')) return Response.json(contactCopies('sent-contact')[0]);
    if (url.pathname.endsWith('/emails')) return Response.json({ data: contactCopies('sent-contact'), has_more: false });
    return Response.json({ id: 'accepted-reply' });
  });
  const box = new LiveMailbox({ ...config, mode: 'live' });
  await box.respond('contact-thread', 'sent-contact', 'reply', content, 'reply-contact-attempt01');
  assert.equal(requests.at(-1)!.path, '/inboxes/fixture-owner/threads/contact-thread/emails/received-sent-contact/reply');
  await box.saveDraft(null, { ...content, threadId: 'contact-thread', replyToEmailId: 'sent-contact' }, 'draft-contact-attempt01');
  assert.equal(requests.at(-1)!.body.reply_to_email_id, 'received-sent-contact');
});

test('contact reconciliation walks native thread/message pages and preserves Archive and Trash choices', async t => {
  for (const folder of ['archive','trash']) {
    let moves = 0;
    t.mock.method(globalThis, 'fetch', async (input: unknown, init?: RequestInit) => {
      const url = new URL(String(input)), after = url.searchParams.get('after');
      if (init?.method === 'PATCH') { moves++; return Response.json({ id: 'contact-thread' }); }
      if (url.pathname.endsWith('/threads')) return Response.json(after ? { data: [{ id: 'contact-thread', subject: `Website message from ${contact.name}`, folder }], has_more: false } : { data: [{ id: 'other-thread', subject: 'Another subject' }], has_more: true });
      return Response.json(after ? { data: contactCopies('accepted-contact'), has_more: false } : { data: [{ ...contactCopies('older-message')[0] }], has_more: true });
    });
    await new LiveMailbox({ ...config, mode: 'live' }).placeContactDelivery('accepted-contact', `Website message from ${contact.name}`, contact.email);
    assert.equal(moves, 0);
    t.mock.restoreAll();
  }
});
