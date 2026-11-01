import profile from "../../../data/profile.json";
import { readJson, requireApiSession } from "@/lib/api";
import { generateCoverLetter } from "@/lib/letter-analysis";
import { modelFailureResponse } from "@/lib/model-response";
import { validateToolInput } from "@/lib/tools";

export async function POST(request: Request) {
  const unauthorized = await requireApiSession(request);
  if (unauthorized) return unauthorized;

  const body = await readJson(request);
  if (!body.ok) return body.response;
  const input = validateToolInput(body.value);
  if (!input.ok) return Response.json({ error: input.error }, { status: 400 });

  try {
    return Response.json(await generateCoverLetter(
      input.value.jobDescription,
      input.value.tone,
      profile,
    ));
  } catch (error) {
    const failure = modelFailureResponse(error);
    if (failure) return failure;
    console.error("Cover letter generation failed:", error);
    return Response.json({ error: "Cover letter generation failed unexpectedly. Try again." }, { status: 500 });
  }
}
