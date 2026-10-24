import type { FitResult } from "./tools";
import { ModelOutputValidationError } from "./output-validation.ts";

export const FIT_RESULT_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["score", "summary", "matches", "gaps", "nextActions"],
  properties: {
    score: {
      type: "number",
      minimum: 0,
      maximum: 100,
      description: "An evidence-fit score, not a hiring probability.",
    },
    summary: { type: "string", minLength: 1 },
    matches: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["requirement", "evidence"],
        properties: {
          requirement: {
            type: "string",
            minLength: 1,
            pattern: "^(Required|Preferred):\\s+\\S",
            description: "Start with exactly 'Required:' or 'Preferred:'.",
          },
          evidence: { type: "string", minLength: 1 },
        },
      },
    },
    gaps: {
      type: "array",
      items: {
        type: "string",
        minLength: 1,
        pattern: "^(Required \\(absent evidence\\)|Preferred \\(absent evidence\\)|Known gap):\\s+\\S",
      },
    },
    nextActions: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: { type: "string", minLength: 1 },
    },
  },
};

export class FitResultValidationError extends ModelOutputValidationError {
  constructor(detail: string) {
    super("fit-analysis", detail);
    this.name = "FitResultValidationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function text(value: unknown, path: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new FitResultValidationError(`${path} must be a non-empty string.`);
  }
  return value.trim();
}

export function parseFitResult(value: unknown): FitResult {
  if (!isRecord(value) || !hasExactKeys(value, ["score", "summary", "matches", "gaps", "nextActions"])) {
    throw new FitResultValidationError("the result must contain only score, summary, matches, gaps, and nextActions.");
  }
  if (typeof value.score !== "number" || !Number.isFinite(value.score) || value.score < 0 || value.score > 100) {
    throw new FitResultValidationError("score must be a finite number from 0 through 100.");
  }
  if (!Array.isArray(value.matches)) {
    throw new FitResultValidationError("matches must be an array.");
  }
  const matches = value.matches.map((item, index) => {
    if (!isRecord(item) || !hasExactKeys(item, ["requirement", "evidence"])) {
      throw new FitResultValidationError(`matches[${index}] must contain only requirement and evidence strings.`);
    }
    const requirement = text(item.requirement, `matches[${index}].requirement`);
    if (!/^(Required|Preferred):\s+\S/.test(requirement)) {
      throw new FitResultValidationError(`matches[${index}].requirement must identify Required or Preferred.`);
    }
    return { requirement, evidence: text(item.evidence, `matches[${index}].evidence`) };
  });
  if (!Array.isArray(value.gaps)) {
    throw new FitResultValidationError("gaps must be an array.");
  }
  const gaps = value.gaps.map((item, index) => {
    const gap = text(item, `gaps[${index}]`);
    if (!/^(Required \(absent evidence\)|Preferred \(absent evidence\)|Known gap):\s+\S/.test(gap)) {
      throw new FitResultValidationError(`gaps[${index}] must distinguish absent evidence from a known gap.`);
    }
    return gap;
  });
  if (!Array.isArray(value.nextActions) || value.nextActions.length !== 3) {
    throw new FitResultValidationError("nextActions must contain exactly three items.");
  }
  return {
    score: value.score,
    summary: text(value.summary, "summary"),
    matches,
    gaps,
    nextActions: value.nextActions.map((item, index) => text(item, `nextActions[${index}]`)),
  };
}

export function isFitResult(value: unknown): value is FitResult {
  try {
    parseFitResult(value);
    return true;
  } catch {
    return false;
  }
}
