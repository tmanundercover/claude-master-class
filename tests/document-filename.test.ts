import { test } from 'node:test';
import assert from 'node:assert/strict';
import { documentFilename } from '../src/lib/document-filename.ts';

test('download names use candidate, position, company, document and saved year', () => {
  const job = { title: 'Fullstack Developer', company: 'Clover' };
  for (const extension of ['pdf', 'md', 'html'] as const) {
    assert.equal(documentFilename('James Terrell Singleton', job, 'resume', extension, '2026-11-04T12:00:00Z'), `james-terrell-singleton-fullstack-developer-clover-resume-2026.${extension}`);
  }
  assert.equal(documentFilename('James Terrell Singleton', job, 'cover-letter', 'pdf', '2026-11-04'), 'james-terrell-singleton-fullstack-developer-clover-cover-letter-2026.pdf');
  assert.equal(documentFilename('James Terrell Singleton', null, 'resume', 'pdf', '2026-11-04'), 'james-terrell-singleton-resume-2026.pdf');
});

test('filenames omit unknown metadata, normalize labels and bound unsafe/long names', () => {
  assert.equal(documentFilename('Jámés O’Neill', { title: 'Sr. Front-End/Full Stack Developer', company: 'Clóver\r\n"; /' }, 'resume', 'pdf', '2026-01-01'), 'james-oneill-sr-front-end-full-stack-developer-clover-resume-2026.pdf');
  assert.equal(documentFilename('Candidate', { title: null, company: null }, 'resume', 'pdf', '2026-01-01'), 'candidate-resume-2026.pdf');
  const long = documentFilename('a'.repeat(500), { title: 'b'.repeat(500), company: 'c'.repeat(500) }, 'cover-letter', 'html', '2026-01-01');
  assert.ok(long.length <= 200); assert.match(long, /^[a-z0-9-]+\.html$/);
});
