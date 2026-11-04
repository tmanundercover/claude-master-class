import { isFitResult } from './fit-result.ts';
import { isTailorResult } from './resume-tailor-client.ts';
import { isLetterResult } from './letter-result.ts';
import { isCareerResult } from './career-result.ts';
import type { ArtifactKind } from './job-contracts.ts';
/** Keep the existing display-contract checks when results are loaded from saved versions. */
export function isSavedArtifactResult(kind: ArtifactKind, result: unknown, weeklyHours: number): boolean {
  switch (kind) {
    case 'job-fit': return isFitResult(result);
    case 'resume': return isTailorResult(result);
    case 'cover-letter': return isLetterResult(result);
    case 'interview-prep': return isCareerResult(result, 'interview', weeklyHours);
    case 'study-plan': return isCareerResult(result, 'study', weeklyHours);
  }
}
