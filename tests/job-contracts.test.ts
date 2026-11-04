import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ARTIFACT_KINDS, descriptionText, generationInput, noteValues, validId, metadataInput, stateToken } from '../src/lib/job-contracts.ts';
test('job contracts enforce distinct modes, strict fields and encoded limits', () => {
  assert.ok(ARTIFACT_KINDS.includes('interview-prep')); assert.ok(ARTIFACT_KINDS.includes('study-plan'));
  const input = { attemptId: 'attempt_123', mode: 'start-over', expectedState: 0, descriptionId: 'description_123', settings: {} };
  assert.equal(generationInput(input).mode, 'start-over');
  for (const value of [{ ...input, extra: true }, { ...input, changeMessage: 'old instructions' }, { ...input, mode: 'revise' }, { ...input, mode: 'revise', changeMessage: 'x'.repeat(2001) }, { ...input, settings: { apiKey: 'forbidden' } }]) assert.throws(() => generationInput(value));
  for (const id of ['../escape', '', 'x/y', 'short']) assert.throws(() => validId(id));
  for (const state of [-1, 1.5, NaN]) assert.throws(() => stateToken(state));
  assert.equal(descriptionText('  Role\r\nCompany  '), 'Role\nCompany');
  assert.throws(() => descriptionText(' ')); assert.throws(() => descriptionText('x'.repeat(15001)));
  assert.throws(() => noteValues({ note_1234: '😀'.repeat(20000) }));
  assert.throws(() => metadataInput({ uid: 'owner' }));
});

test('application login return carries only an opaque reference and remains role-bound', async () => {
  const { applicationLoginDestination, applicationReturnReference } = await import('../src/lib/job-return.ts');
  assert.equal(applicationLoginDestination('terrell', '/dashboard', '?applicationReturn=reference_123'), '/dashboard/inbox?applicationReturn=reference_123');
  assert.equal(applicationLoginDestination('recruiter', '/interview', '?applicationReturn=reference_123'), '/interview');
  assert.equal(applicationReturnReference('?return=reference_123'), 'reference_123');
  for (const search of ['?applicationReturn=https://evil.example', '?applicationReturn=../foreign', '?next=https://evil.example']) assert.equal(applicationReturnReference(search), null);
});
