import { z } from "zod";
import { generatedTestCasesSchema } from "./generation-contract";

export const GENERATION_SESSION_KEY = "testpilot.generated-test-cases.v1";

export const persistedGenerationSchema = z
  .object({
    analysisId: z.string().trim().min(1).max(120),
    selectionKey: z.string().min(1).max(5_000),
    result: generatedTestCasesSchema,
  })
  .strict();

export type PersistedGeneration = z.infer<typeof persistedGenerationSchema>;

export function parsePersistedGeneration(raw: string | null) {
  if (!raw) return null;
  try {
    const parsed = persistedGenerationSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
