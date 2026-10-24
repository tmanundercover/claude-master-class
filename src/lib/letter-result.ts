import { ModelOutputValidationError } from "./output-validation.ts";
import type { LetterResult } from "./tools";

export const LETTER_RESULT_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["letter", "evidenceUsed", "factsToVerify"],
  properties: {
    letter: {
      type: "string",
      minLength: 1,
      description: "A complete 200-300 word cover-letter draft, including greeting and sign-off.",
    },
    evidenceUsed: {
      type: "array",
      minItems: 2,
      maxItems: 2,
      description: "Exactly two distinct profile-backed examples used in the draft.",
      items: { type: "string", minLength: 1 },
    },
    factsToVerify: {
      type: "array",
      description: "Unknown or ambiguous details to verify before using the draft. Never guesses.",
      items: { type: "string", minLength: 1 },
    },
  },
};

export class LetterResultValidationError extends ModelOutputValidationError {
  constructor(detail: string) {
    super("cover-letter", detail);
    this.name = "LetterResultValidationError";
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
    throw new LetterResultValidationError(`${path} must be a non-empty string.`);
  }
  return value.trim();
}

function textArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) {
    throw new LetterResultValidationError(`${path} must be an array.`);
  }
  return value.map((item, index) => text(item, `${path}[${index}]`));
}

export function countWords(value: string): number {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/u).length : 0;
}

export function parseLetterResult(value: unknown): LetterResult {
  if (!isRecord(value) || !hasExactKeys(value, ["letter", "evidenceUsed", "factsToVerify"])) {
    throw new LetterResultValidationError("the result must contain only letter, evidenceUsed, and factsToVerify.");
  }
  const letter = text(value.letter, "letter");
  const words = countWords(letter);
  if (words < 200 || words > 300) {
    throw new LetterResultValidationError(`letter must contain 200-300 words; received ${words}.`);
  }
  const evidenceUsed = textArray(value.evidenceUsed, "evidenceUsed");
  if (evidenceUsed.length !== 2) {
    throw new LetterResultValidationError("evidenceUsed must contain exactly two real examples.");
  }
  if (evidenceUsed[0].toLocaleLowerCase() === evidenceUsed[1].toLocaleLowerCase()) {
    throw new LetterResultValidationError("evidenceUsed must contain two distinct examples.");
  }
  return {
    letter,
    evidenceUsed,
    factsToVerify: textArray(value.factsToVerify, "factsToVerify"),
  };
}

export function isLetterResult(value: unknown): value is LetterResult {
  try {
    parseLetterResult(value);
    return true;
  } catch {
    return false;
  }
}
