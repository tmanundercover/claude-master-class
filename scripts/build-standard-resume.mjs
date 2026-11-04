import { publicStandardResumePdf } from '../dist/server/entry-server.js';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
export async function buildStandardResume(destination) {
  const bytes = await publicStandardResumePdf();
  if (!bytes.subarray(0, 5).equals(Buffer.from('%PDF-'))) throw new Error('Public résumé rendering did not produce a PDF.');
  await writeFile(join(destination, 'resume.pdf'), bytes);
}
