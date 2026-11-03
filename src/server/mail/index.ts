import type { Mailbox } from '../../lib/mail-types.ts';
import { FixtureMailbox } from './fixture.ts';
import { LiveMailbox, mailConfiguration } from './live.ts';
let active: Mailbox | undefined;
let signature = '';
export function mailbox(): Mailbox {
  const config = mailConfiguration();
  const next = JSON.stringify(config);
  if (!active || signature !== next) { active = config.mode === 'fixture' ? new FixtureMailbox(config.contactFrom) : new LiveMailbox(config); signature = next; }
  return active;
}
