import { z } from "zod";
import { prdAnalysisSchema } from "../analysis/analysis-contract";
import { reviewSelectionStateSchema } from "../review/review-contract";
import type { TestCaseGenerator } from "./configured-generator";
import { buildGenerationContext } from "./generation-context";
import { generationErrorMessages } from "./generation-errors";

const MAX_GENERATION_REQUEST_BYTES = 1_000_000;
const identifier = z.string().trim().min(1).max(120);
export const generationRequestSchema = z
  .object({
    analysisId: identifier,
    analysis: prdAnalysisSchema,
    selection: reviewSelectionStateSchema,
  })
  .strict();

const statuses = {
  AI_CONFIGURATION_ERROR: 503,
  AI_PROVIDER_UNAVAILABLE: 503,
  AI_TIMEOUT: 504,
  AI_RATE_LIMITED: 429,
  AI_INVALID_RESPONSE: 502,
  AI_CONTEXT_LIMIT: 422,
  GENERATION_FAILED: 502,
  INVALID_SELECTION: 422,
} as const;

function invalidSelection() {
  return Response.json(
    {
      generation: {
        status: "failed",
        error: {
          code: "INVALID_SELECTION",
          message: generationErrorMessages.INVALID_SELECTION,
        },
        usage: [],
      },
    },
    { status: 422, headers: { "Cache-Control": "no-store" } },
  );
}

export async function handleGeneration(
  request: Request,
  generator: TestCaseGenerator,
) {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_GENERATION_REQUEST_BYTES)
    return invalidSelection();
  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return invalidSelection();
  }
  if (new TextEncoder().encode(raw).byteLength > MAX_GENERATION_REQUEST_BYTES)
    return invalidSelection();
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return invalidSelection();
  }
  const parsed = generationRequestSchema.safeParse(json);
  if (!parsed.success) return invalidSelection();
  const { analysisId, analysis, selection } = parsed.data;
  const context = buildGenerationContext(analysis, selection, analysisId);
  if (!context) return invalidSelection();
  const outcome = await generator(analysis, context, request.signal);
  return Response.json(
    { generation: outcome },
    {
      status: outcome.status === "success" ? 200 : statuses[outcome.error.code],
      headers: { "Cache-Control": "no-store" },
    },
  );
}
