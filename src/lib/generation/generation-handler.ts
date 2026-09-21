import {
  buildGenerationContext,
  validateReviewedSelectionAgainstAnalysis,
} from "./generation-context";
import type { TestCaseGenerator } from "./configured-generator";
import { generationErrorMessages } from "./generation-errors";
import {
  generationRequestSchema,
  generationResultSchema,
  selectionFingerprint,
  type GenerationLayer,
} from "./test-case-contract";

export const MAX_GENERATION_REQUEST_BYTES = 1_500_000;

const statuses = {
  GENERATION_CONFIGURATION_ERROR: 503,
  GENERATION_PROVIDER_UNAVAILABLE: 503,
  GENERATION_TIMEOUT: 504,
  GENERATION_RATE_LIMITED: 429,
  GENERATION_INVALID_REQUEST: 422,
  GENERATION_INVALID_RESPONSE: 502,
  GENERATION_CONTEXT_LIMIT: 422,
  GENERATION_FAILED: 502,
} as const;

function safeFailure(
  code: keyof typeof statuses,
  status: number = statuses[code],
) {
  return Response.json(
    {
      generation: {
        status: "failed",
        error: { code, message: generationErrorMessages[code] },
        usage: { frontend: [], backend: [] },
      },
    },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function handleGeneration(
  request: Request,
  generator: TestCaseGenerator,
) {
  const declared = request.headers.get("content-length");
  if (declared && Number(declared) > MAX_GENERATION_REQUEST_BYTES)
    return safeFailure("GENERATION_INVALID_REQUEST", 413);
  let parsed: unknown;
  try {
    const body = await request.text();
    if (
      new TextEncoder().encode(body).byteLength > MAX_GENERATION_REQUEST_BYTES
    )
      return safeFailure("GENERATION_INVALID_REQUEST", 413);
    parsed = JSON.parse(body);
  } catch {
    return safeFailure("GENERATION_INVALID_REQUEST", 400);
  }
  const input = generationRequestSchema.safeParse(parsed);
  if (
    !input.success ||
    !validateReviewedSelectionAgainstAnalysis(
      input.data.analysis,
      input.data.selection,
    )
  )
    return safeFailure("GENERATION_INVALID_REQUEST");

  const context = buildGenerationContext(
    input.data.analysis,
    input.data.selection,
  );
  if (!context.features.length || !context.requirements.length)
    return safeFailure("GENERATION_INVALID_REQUEST");
  const layers: GenerationLayer[] =
    input.data.selection.testingScope === "both"
      ? ["frontend", "backend"]
      : [input.data.selection.testingScope];
  const outcomes = await Promise.all(
    layers.map((layer) => generator(context, layer, request.signal)),
  );
  const failed = outcomes.find((outcome) => outcome.status === "failed");
  if (failed?.status === "failed")
    return Response.json(
      {
        generation: {
          status: "failed",
          error: failed.error,
          usage: {
            frontend:
              layers[0] === "frontend" ? (outcomes[0]?.usage ?? []) : [],
            backend:
              layers[0] === "backend"
                ? (outcomes[0]?.usage ?? [])
                : (outcomes[1]?.usage ?? []),
          },
        },
      },
      {
        status: statuses[failed.error.code],
        headers: { "Cache-Control": "no-store" },
      },
    );
  const frontendIndex = layers.indexOf("frontend");
  const backendIndex = layers.indexOf("backend");
  const frontend =
    frontendIndex >= 0 && outcomes[frontendIndex]?.status === "success"
      ? outcomes[frontendIndex].cases
      : [];
  const backend =
    backendIndex >= 0 && outcomes[backendIndex]?.status === "success"
      ? outcomes[backendIndex].cases
      : [];
  const result = generationResultSchema.parse({
    analysisId: input.data.selection.analysisId,
    selectionFingerprint: selectionFingerprint(input.data.selection),
    frontend,
    backend,
  });
  return Response.json(
    {
      generation: {
        status: "success",
        result,
        usage: {
          frontend:
            frontendIndex >= 0 ? (outcomes[frontendIndex]?.usage ?? []) : [],
          backend:
            backendIndex >= 0 ? (outcomes[backendIndex]?.usage ?? []) : [],
        },
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
