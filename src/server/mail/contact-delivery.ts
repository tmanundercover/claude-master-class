import { OWNER_EMAIL, type Message } from '../../lib/mail-types.ts';

function mailboxAddress(value: string): string {
  return (value.match(/<([^<>]+)>\s*$/)?.[1] ?? value).trim().toLowerCase();
}

/** Recognize only the application's fixed notification identity and owner recipient. */
export function isContactNotification(message: Message, contactFrom: string): boolean {
  return mailboxAddress(message.from) === contactFrom.toLowerCase()
    && message.to.some(value => mailboxAddress(value) === OWNER_EMAIL)
    && !!message.subject?.startsWith('Website message from ')
    && message.reply_to.length === 1;
}

/** SMTP Message-ID connects the actual received copy to this exact server-owned send. */
export function receivedContactCopy(sent: Message, messages: Message[], contactFrom: string): Message | undefined {
  if (sent.direction !== 'outbound' || !sent.message_id || !isContactNotification(sent, contactFrom)) return undefined;
  return messages.find(message => message.direction === 'inbound'
    && message.message_id === sent.message_id
    && message.subject === sent.subject
    && isContactNotification(message, contactFrom)
    && mailboxAddress(message.reply_to[0]) === mailboxAddress(sent.reply_to[0]));
}
