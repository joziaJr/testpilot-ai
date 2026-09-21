import { z } from "zod";
import { prdAnalysisSchema } from "../analysis/analysis-contract";
import { reviewSelectionStateSchema } from "./review-contract";

export const ANALYSIS_SESSION_KEY = "testpilot.active-analysis.v1";
export const REVIEW_SELECTION_SESSION_KEY = "testpilot.review-selection.v1";

export const persistedAnalysisSessionSchema = z
  .object({
    analysisId: z.string().trim().min(1).max(120),
    file: z
      .object({
        name: z.string().min(1).max(1_024),
        size: z.number().int().nonnegative(),
        type: z.string().max(200),
        fileType: z.enum(["pdf", "docx", "txt"]),
        characterCount: z.number().int().positive(),
      })
      .strict(),
    analysis: prdAnalysisSchema,
  })
  .strict();

export type PersistedAnalysisSession = z.infer<
  typeof persistedAnalysisSessionSchema
>;

function parseStored<T>(raw: string | null, schema: z.ZodType<T>): T | null {
  if (!raw) return null;
  try {
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function parsePersistedAnalysisSession(raw: string | null) {
  return parseStored(raw, persistedAnalysisSessionSchema);
}

export function parsePersistedReviewSelection(raw: string | null) {
  return parseStored(raw, reviewSelectionStateSchema);
}
