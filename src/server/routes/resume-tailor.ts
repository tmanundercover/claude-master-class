import { legacyGeneration } from './job-workspaces.ts';
export function POST(request: Request) { return legacyGeneration(request, 'resume-tailor'); }
