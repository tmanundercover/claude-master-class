import { NextResponse } from "next/server";
import profile from "../../../../data/profile.json";
import { readJson, requireApiSession } from "@/lib/api";
import { analyzeJobFit } from "@/lib/fit-analysis";
import { modelFailureResponse } from "@/lib/model-response";
import { validateToolInput } from "@/lib/tools";

export async function POST(request: Request) {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;

  const body = await readJson(request);
  if (!body.ok) return body.response;
  const input = validateToolInput(body.value);
  if (!input.ok) return NextResponse.json({ error: input.error }, { status: 400 });

  try {
    return NextResponse.json(await analyzeJobFit(input.value.jobDescription, profile));
  } catch (error) {
    const failure = modelFailureResponse(error);
    if (failure) return failure;
    console.error("Job fit analysis failed:", error);
    return NextResponse.json({ error: "Job fit analysis failed unexpectedly. Try again." }, { status: 500 });
  }
}
