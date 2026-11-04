import { ModelConfigurationError, ModelError } from "./model.ts";
import { ModelOutputValidationError } from "./output-validation.ts";

export function modelFailureResponse(error: unknown): Response | null {
  if (error instanceof ModelConfigurationError) {
    return Response.json({ error: error.message }, { status: 503 });
  }
  if (error instanceof ModelError) {
    return Response.json(
      { error: error.message },
      { status: error.status, headers: error.retryAfter ? { "Retry-After": error.retryAfter } : undefined },
    );
  }
  if (error instanceof ModelOutputValidationError) {
    return Response.json({ error: error.message }, { status: 502 });
  }
  return null;
}
