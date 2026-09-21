import { generationResultSchema } from "./test-case-contract";

export const GENERATION_SESSION_KEY = "testpilot.generation-result.v1";

export function parsePersistedGenerationResult(raw: string | null) {
  if (!raw) return null;
  try {
    const parsed = generationResultSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
