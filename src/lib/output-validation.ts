export class ModelOutputValidationError extends Error {
  constructor(contract: string, detail: string) {
    super(`The AI provider returned JSON that did not match the ${contract} contract: ${detail}`);
    this.name = "ModelOutputValidationError";
  }
}
