import { authConfiguration, currentSessionRole } from "./auth.ts";
import { isSameOrigin } from "./origin.ts";
import { JOB_DESCRIPTION_MAX_LENGTH } from './tools.ts';

export async function requireApiSession(request: Request): Promise<Response | null> {
  let role;
  try {
    authConfiguration();
    role = await currentSessionRole(request);
  } catch (error) {
    console.error("Private API configuration error:", error);
    return Response.json({ error: "Login is not securely configured. Check the server authentication settings." }, { status: 503 });
  }
  if (!role) {
    return Response.json({ error: "Sign in before using private tools." }, { status: 401 });
  }
  if (role !== "terrell") {
    return Response.json({ error: "This tool is available only to the portfolio owner." }, { status: 403 });
  }
  return null;
}

export async function readJson(request: Request, maxLength = 20000): Promise<
  { ok: true; value: unknown } | { ok: false; response: Response }
> {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return { ok: false, response: Response.json({ error: "Send JSON with Content-Type: application/json." }, { status: 415 }) };
  }
  if (!isSameOrigin(request)) {
    return { ok: false, response: Response.json({ error: "Cross-origin requests are not allowed." }, { status: 403 }) };
  }
  const text = await request.text();
  if (text.length > maxLength) {
    return { ok: false, response: Response.json({ error: "Request is too large." }, { status: 413 }) };
  }
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    return { ok: false, response: Response.json({ error: "Request body is not valid JSON." }, { status: 400 }) };
  }
}

// JSON may encode each description character as a six-character Unicode escape.
export function readToolJson(request: Request) {
  return readJson(request, JOB_DESCRIPTION_MAX_LENGTH * 6 + 1024);
}
