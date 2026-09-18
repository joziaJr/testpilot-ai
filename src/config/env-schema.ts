import { z } from "zod";

const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalText = z.preprocess(
  blankToUndefined,
  z.string().trim().min(1).optional(),
);
const optionalPositiveInteger = z.preprocess(
  blankToUndefined,
  z.coerce.number().int().positive().optional(),
);

export const serverEnvironmentSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    AI_PROVIDER: z.string().trim().min(1).default("gemini"),
    AI_MODEL: optionalText,
    AI_API_KEY: optionalText,
    MAX_UPLOAD_SIZE_MB: z.coerce
      .number()
      .int()
      .refine((value) => value === 10, {
        message: "MAX_UPLOAD_SIZE_MB must match the approved 10 MB policy",
      })
      .default(10),
    AI_MAX_AUTOMATIC_RETRIES: z.coerce.number().int().min(0).max(1).default(1),
    AI_TIMEOUT_MS: optionalPositiveInteger,
    AI_CONTEXT_TOKEN_LIMIT: optionalPositiveInteger,
  })
  .strict();

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

export function selectServerEnvironment(source: NodeJS.ProcessEnv) {
  return {
    NODE_ENV: source.NODE_ENV,
    AI_PROVIDER: source.AI_PROVIDER,
    AI_MODEL: source.AI_MODEL,
    AI_API_KEY: source.AI_API_KEY,
    MAX_UPLOAD_SIZE_MB: source.MAX_UPLOAD_SIZE_MB,
    AI_MAX_AUTOMATIC_RETRIES: source.AI_MAX_AUTOMATIC_RETRIES,
    AI_TIMEOUT_MS: source.AI_TIMEOUT_MS,
    AI_CONTEXT_TOKEN_LIMIT: source.AI_CONTEXT_TOKEN_LIMIT,
  };
}
