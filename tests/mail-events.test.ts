import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { mailEvents } from '../src/server/routes/mail-events.ts';
import { mailbox } from '../src/server/mail/index.ts';
const secret = Buffer.from('fixture-signing-secret').toString('base64');
test('signed inbox callbacks reject tampering, foreign mailbox and unsupported events; replay only reads', async t => {
  const previous = { ...process.env };
  t.after(() => { for (const key of Object.keys(process.env)) if (!(key in previous)) delete process.env[key]; Object.assign(process.env, previous); });
  for (const [key, value] of Object.entries({ RESEND_MODE: 'fixture', FUNCTIONS_EMULATOR: 'true', GCLOUD_PROJECT: 'demo-mail-events', RESEND_INBOX_ID: 'fixture-owner', RESEND_WEBHOOK_SECRET: `whsec_${secret}` })) process.env[key] = value;
  const box = mailbox(), before = await box.summary();
  t.mock.method(globalThis, 'fetch', () => { throw new Error('Events must not send mail'); });
  const send = (type: string, inbox: string, tamper = false) => {
    const body = JSON.stringify({ type, created_at: new Date().toISOString(), data: { inbox_id: inbox } });
    const id = 'event-1', timestamp = String(Math.floor(Date.now() / 1000));
    const signature = createHmac('sha256', Buffer.from(secret, 'base64')).update(`${id}.${timestamp}.${body}`).digest('base64');
    return mailEvents(new Request('https://site.test/api/mail/events', { method: 'POST', headers: { 'svix-id': id, 'svix-timestamp': timestamp, 'svix-signature': `v1,${signature}` }, body: tamper ? body + ' ' : body }));
  };
  assert.equal((await send('inbox.email.received','fixture-owner')).status, 200);
  assert.equal((await send('inbox.email.received','fixture-owner')).status, 200);
  assert.equal((await send('inbox.email.received','fixture-owner', true)).status, 401);
  assert.equal((await send('inbox.email.received','foreign')).status, 400);
  assert.equal((await send('email.sent','fixture-owner')).status, 400);
  assert.deepEqual(await box.summary(), before); assert.equal((await box.contacts()).data.length, 0);
});
