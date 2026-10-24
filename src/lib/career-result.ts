import { ModelOutputValidationError } from "./output-validation.ts";
import type { CareerMode, CareerResult } from "./tools";

const textSchema = { type: "string", minLength: 1 } as const;

const interviewSchema: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["mode", "stagesToConfirm", "questions", "stories", "questionsToAsk", "notesTemplate"],
  properties: {
    mode: { const: "interview" },
    stagesToConfirm: {
      type: "array",
      minItems: 1,
      items: { ...textSchema, pattern: "^Assumption to confirm with recruiter:\\s+\\S" },
    },
    questions: { type: "array", minItems: 5, maxItems: 5, items: textSchema },
    stories: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["situation", "task", "action", "result"],
        properties: { situation: textSchema, task: textSchema, action: textSchema, result: textSchema },
      },
    },
    questionsToAsk: { type: "array", minItems: 3, maxItems: 3, items: textSchema },
    notesTemplate: {
      type: "array",
      minItems: 1,
      description: "Blank note prompts only; never fabricated post-interview observations.",
      items: textSchema,
    },
  },
};

export function careerResultSchema(mode: CareerMode, weeklyHours: number): Record<string, unknown> {
  if (mode === "interview") return interviewSchema;
  return {
    type: "object",
    additionalProperties: false,
    required: ["mode", "roleSummary", "prioritySkills", "weeks", "readinessCheck"],
    properties: {
      mode: { const: "study" },
      roleSummary: textSchema,
      prioritySkills: { type: "array", minItems: 3, maxItems: 3, items: textSchema },
      weeks: {
        type: "array",
        minItems: 4,
        maxItems: 4,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["week", "tasks", "hours", "deliverable", "check"],
          properties: {
            week: { type: "integer", minimum: 1, maximum: 4 },
            tasks: { type: "array", minItems: 1, items: textSchema },
            hours: { type: "number", exclusiveMinimum: 0, maximum: weeklyHours },
            deliverable: textSchema,
            check: { ...textSchema, description: "A measurable demonstration or explanation check." },
          },
        },
      },
      readinessCheck: {
        ...textSchema,
        pattern: "^Self-assessment, not a guarantee:\\s+\\S",
      },
    },
  };
}

export class CareerResultValidationError extends ModelOutputValidationError {
  constructor(detail: string) {
    super("career-plan", detail);
    this.name = "CareerResultValidationError";
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
    throw new CareerResultValidationError(`${path} must be a non-empty string.`);
  }
  return value.trim();
}

function textArray(value: unknown, path: string, exactLength?: number): string[] {
  if (!Array.isArray(value)) {
    throw new CareerResultValidationError(`${path} must be an array.`);
  }
  if (exactLength !== undefined && value.length !== exactLength) {
    throw new CareerResultValidationError(`${path} must contain exactly ${exactLength} items.`);
  }
  return value.map((item, index) => text(item, `${path}[${index}]`));
}

function parseInterview(value: Record<string, unknown>): Extract<CareerResult, { mode: "interview" }> {
  if (!hasExactKeys(value, ["mode", "stagesToConfirm", "questions", "stories", "questionsToAsk", "notesTemplate"])) {
    throw new CareerResultValidationError("the interview result contains missing or unexpected fields.");
  }
  const stagesToConfirm = textArray(value.stagesToConfirm, "stagesToConfirm");
  if (stagesToConfirm.length === 0 || stagesToConfirm.some((stage) => !/^Assumption to confirm with recruiter:\s+\S/.test(stage))) {
    throw new CareerResultValidationError("each interview stage must be labeled as an assumption to confirm with a recruiter.");
  }
  if (!Array.isArray(value.stories) || value.stories.length !== 3) {
    throw new CareerResultValidationError("stories must contain exactly three STAR outlines.");
  }
  const stories = value.stories.map((story, index) => {
    if (!isRecord(story) || !hasExactKeys(story, ["situation", "task", "action", "result"])) {
      throw new CareerResultValidationError(`stories[${index}] must contain only situation, task, action, and result.`);
    }
    return {
      situation: text(story.situation, `stories[${index}].situation`),
      task: text(story.task, `stories[${index}].task`),
      action: text(story.action, `stories[${index}].action`),
      result: text(story.result, `stories[${index}].result`),
    };
  });
  const notesTemplate = textArray(value.notesTemplate, "notesTemplate");
  if (notesTemplate.length === 0) {
    throw new CareerResultValidationError("notesTemplate must contain at least one blank note prompt.");
  }
  return {
    mode: "interview",
    stagesToConfirm,
    questions: textArray(value.questions, "questions", 5),
    stories,
    questionsToAsk: textArray(value.questionsToAsk, "questionsToAsk", 3),
    notesTemplate,
  };
}

function parseStudy(value: Record<string, unknown>, weeklyHours: number): Extract<CareerResult, { mode: "study" }> {
  if (!hasExactKeys(value, ["mode", "roleSummary", "prioritySkills", "weeks", "readinessCheck"])) {
    throw new CareerResultValidationError("the study result contains missing or unexpected fields.");
  }
  if (!Array.isArray(value.weeks) || value.weeks.length !== 4) {
    throw new CareerResultValidationError("weeks must contain exactly four weekly plans.");
  }
  const weeks = value.weeks.map((week, index) => {
    if (!isRecord(week) || !hasExactKeys(week, ["week", "tasks", "hours", "deliverable", "check"])) {
      throw new CareerResultValidationError(`weeks[${index}] contains missing or unexpected fields.`);
    }
    if (!Number.isInteger(week.week) || week.week !== index + 1) {
      throw new CareerResultValidationError("week numbers must be the ordered integers 1 through 4.");
    }
    if (typeof week.hours !== "number" || !Number.isFinite(week.hours) || week.hours <= 0 || week.hours > weeklyHours) {
      throw new CareerResultValidationError(`week ${index + 1} hours must be greater than 0 and no more than the ${weeklyHours}-hour weekly budget.`);
    }
    const tasks = textArray(week.tasks, `weeks[${index}].tasks`);
    if (tasks.length === 0) {
      throw new CareerResultValidationError(`weeks[${index}].tasks must contain at least one task.`);
    }
    return {
      week: index + 1,
      tasks,
      hours: week.hours,
      deliverable: text(week.deliverable, `weeks[${index}].deliverable`),
      check: text(week.check, `weeks[${index}].check`),
    };
  });
  const readinessCheck = text(value.readinessCheck, "readinessCheck");
  if (!/^Self-assessment, not a guarantee:\s+\S/.test(readinessCheck)) {
    throw new CareerResultValidationError("readinessCheck must be labeled as a self-assessment, not a guarantee.");
  }
  return {
    mode: "study",
    roleSummary: text(value.roleSummary, "roleSummary"),
    prioritySkills: textArray(value.prioritySkills, "prioritySkills", 3),
    weeks,
    readinessCheck,
  };
}

export function parseCareerResult(value: unknown, expectedMode: CareerMode, weeklyHours: number): CareerResult {
  if (!Number.isFinite(weeklyHours) || weeklyHours < 1 || weeklyHours > 40) {
    throw new CareerResultValidationError("weeklyHours must be between 1 and 40.");
  }
  if (!isRecord(value) || value.mode !== expectedMode) {
    throw new CareerResultValidationError(`result mode must be ${expectedMode}.`);
  }
  return expectedMode === "interview" ? parseInterview(value) : parseStudy(value, weeklyHours);
}

export function isCareerResult(value: unknown, expectedMode: CareerMode, weeklyHours: number): value is CareerResult {
  try {
    parseCareerResult(value, expectedMode, weeklyHours);
    return true;
  } catch {
    return false;
  }
}
