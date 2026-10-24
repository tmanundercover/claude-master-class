import { NextResponse } from "next/server";
import { ModelConfigurationError, ModelError } from "./model";
import { ModelOutputValidationError } from "./output-validation";

export function modelFailureResponse(error: unknown): NextResponse | null {
  if (error instanceof ModelConfigurationError) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }
  if (error instanceof ModelError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status, headers: error.retryAfter ? { "Retry-After": error.retryAfter } : undefined },
    );
  }
  if (error instanceof ModelOutputValidationError) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }
  return null;
}
