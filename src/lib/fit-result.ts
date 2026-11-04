import type { EvidenceStatus, FitCategory, FitReference, FitRequirement, FitResult, LogisticsFit, LogisticsStatus } from './fit-types.ts';
import { FIT_CATEGORIES, scoreFitRequirements } from './fit-scoring.ts';
import { ModelOutputValidationError } from './output-validation.ts';

type ModelRequirement = Omit<FitRequirement, 'references'> & { references: string[] };
type ModelLogistics = Omit<LogisticsFit, 'references'> & { references: string[] };
export interface FitAssessment {
  summary: string;
  requirements: ModelRequirement[];
  location: ModelLogistics;
  workArrangement: ModelLogistics;
  nextActions: string[];
}
const string = (maxLength: number) => ({ type: 'string', minLength: 1, maxLength });
const array = (items: unknown, minItems: number, maxItems: number) => ({ type: 'array', items, minItems, maxItems });
const object = (properties: Record<string, unknown>) => ({ type: 'object', additionalProperties: false, required: Object.keys(properties), properties });
const references = array(string(80), 0, 12);
const logistics = object({
  requirement: { type: ['string', 'null'], minLength: 1, maxLength: 1200 },
  jobQuote: { type: ['string', 'null'], minLength: 1, maxLength: 2000 },
  status: { type: 'string', enum: ['compatible', 'incompatible', 'needs_confirmation', 'not_stated'] },
  rationale: string(2000), references,
});
// The provider contract deliberately has no score or numerical weights.
export const FIT_RESULT_SCHEMA = object({
  summary: string(3000),
  requirements: array(object({
    requirement: string(1200), jobQuote: string(2000),
    category: { type: 'string', enum: FIT_CATEGORIES.map(group => group.category) },
    status: { type: 'string', enum: ['supported', 'partially_supported', 'unsupported_evidence'] },
    rationale: string(2000), references,
  }), 0, 80),
  location: logistics, workArrangement: logistics,
  nextActions: array(string(1000), 3, 3),
});
export class FitResultValidationError extends ModelOutputValidationError {
  constructor(detail: string) { super('fit-analysis', detail); this.name = 'FitResultValidationError'; }
}
function fail(message: string): never { throw new FitResultValidationError(message); }
function record(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) fail('unexpected object fields');
  return value as Record<string, unknown>;
}
function text(value: unknown, max = 2000): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) fail('empty or oversized text');
  return value.trim();
}
function list(value: unknown, min: number, max: number): unknown[] {
  if (!Array.isArray(value) || value.length < min || value.length > max) fail('invalid array bounds');
  return value;
}
function choice<T extends string>(value: unknown, choices: readonly T[]): T {
  if (typeof value !== 'string' || !choices.includes(value as T)) fail('unknown classification');
  return value as T;
}
const requirementKeys = ['requirement', 'jobQuote', 'category', 'status', 'rationale', 'references'];
const logisticsKeys = ['requirement', 'jobQuote', 'status', 'rationale', 'references'];
const assessmentKeys = ['summary', 'requirements', 'location', 'workArrangement', 'nextActions'];
const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();

/** Checks source IDs and verbatim posting excerpts before any scoring happens. */
export function parseFitAssessment(value: unknown, referenceIds: ReadonlySet<string>, jobDescription?: string): FitAssessment {
  if ((JSON.stringify(value)?.length ?? 0) > 100_000) fail('assessment exceeds 100,000 characters');
  const root = record(value, assessmentKeys);
  function readReferences(value: unknown, required: boolean): string[] {
    const refs = list(value, required ? 1 : 0, 12).map(ref => text(ref, 80));
    if (new Set(refs).size !== refs.length || refs.some(ref => !referenceIds.has(ref))) fail('unknown or duplicate profile reference');
    return refs;
  }
  function readQuote(value: unknown): string {
    const quote = text(value);
    if (jobDescription !== undefined && !normalize(jobDescription).includes(normalize(quote))) fail('requirement quote is absent from the job description');
    return quote;
  }
  const requirements = list(root.requirements, 0, 80).map(value => {
    const item = record(value, requirementKeys);
    const status = choice<EvidenceStatus>(item.status, ['supported', 'partially_supported', 'unsupported_evidence']);
    return {
      requirement: text(item.requirement, 1200), jobQuote: readQuote(item.jobQuote),
      category: choice<FitCategory>(item.category, FIT_CATEGORIES.map(group => group.category)), status,
      rationale: text(item.rationale), references: readReferences(item.references, status !== 'unsupported_evidence'),
    };
  });
  const names = requirements.map(item => normalize(item.requirement).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim());
  if (new Set(names).size !== names.length) fail('duplicate requirement');
  function readLogistics(value: unknown): ModelLogistics {
    const item = record(value, logisticsKeys);
    const status = choice<LogisticsStatus>(item.status, ['compatible', 'incompatible', 'needs_confirmation', 'not_stated']);
    if (status === 'not_stated') {
      if (item.requirement !== null || item.jobQuote !== null || list(item.references, 0, 0).length) fail('unstated logistics must have no requirement, quote, or references');
      return { requirement: null, jobQuote: null, status, rationale: text(item.rationale), references: [] };
    }
    return {
      requirement: text(item.requirement, 1200), jobQuote: readQuote(item.jobQuote), status,
      rationale: text(item.rationale), references: readReferences(item.references, status === 'compatible' || status === 'incompatible'),
    };
  }
  return {
    summary: text(root.summary, 3000), requirements,
    location: readLogistics(root.location), workArrangement: readLogistics(root.workArrangement),
    nextActions: list(root.nextActions, 3, 3).map(action => text(action, 1000)),
  };
}

export function assembleFitResult(assessment: FitAssessment, sources: readonly FitReference[]): FitResult {
  const byId = new Map(sources.map(source => [source.id, source]));
  const resolve = (refs: string[]) => refs.map(id => {
    const source = byId.get(id);
    if (!source) fail('unknown profile reference');
    return { id: source.id, label: source.label, text: source.text };
  });
  return {
    version: 2, summary: assessment.summary,
    requirements: assessment.requirements.map(item => ({ ...item, references: resolve(item.references) })),
    location: { ...assessment.location, references: resolve(assessment.location.references) },
    workArrangement: { ...assessment.workArrangement, references: resolve(assessment.workArrangement.references) },
    nextActions: assessment.nextActions, ...scoreFitRequirements(assessment.requirements),
  };
}

/** Validate the API envelope and recompute its arithmetic before displaying it. */
export function parseFitResult(value: unknown): FitResult {
  if ((JSON.stringify(value)?.length ?? 0) > 1_000_000) fail('result is oversized');
  const root = record(value, [...assessmentKeys, 'version', 'score', 'breakdown']);
  if (root.version !== 2) fail('unsupported scoring version');
  const sources = new Map<string, FitReference>();
  function readSources(value: unknown): string[] {
    return list(value, 0, 12).map(value => {
      const item = record(value, ['id', 'label', 'text']);
      const source = { id: text(item.id, 80), label: text(item.label, 1200), text: text(item.text, 10_000) };
      const previous = sources.get(source.id);
      if (previous && (previous.label !== source.label || previous.text !== source.text)) fail('inconsistent profile reference');
      sources.set(source.id, source);
      return source.id;
    });
  }
  function readItem(value: unknown, keys: string[]) {
    const item = record(value, keys);
    return { ...item, references: readSources(item.references) };
  }
  const input = {
    summary: root.summary,
    requirements: list(root.requirements, 0, 80).map(item => readItem(item, requirementKeys)),
    location: readItem(root.location, logisticsKeys), workArrangement: readItem(root.workArrangement, logisticsKeys),
    nextActions: root.nextActions,
  };
  const assessment = parseFitAssessment(input, new Set(sources.keys()));
  const result = assembleFitResult(assessment, [...sources.values()]);
  if (root.score !== result.score) fail('score does not match requirement classifications');
  const actual = list(root.breakdown, 3, 3);
  result.breakdown.forEach((expected, index) => {
    const item = record(actual[index], Object.keys(expected));
    if (Object.entries(expected).some(([key, value]) => item[key] !== value)) fail('scoring breakdown does not match requirement classifications');
  });
  return result;
}
export function isFitResult(value: unknown): value is FitResult {
  try { parseFitResult(value); return true; } catch { return false; }
}
