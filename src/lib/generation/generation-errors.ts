export const generationErrorMessages = {
  GENERATION_CONFIGURATION_ERROR:
    "AI generation is not configured. Add the server credential and try again.",
  GENERATION_PROVIDER_UNAVAILABLE:
    "AI generation is temporarily unavailable. Try again later.",
  GENERATION_TIMEOUT: "AI generation timed out. Try again.",
  GENERATION_RATE_LIMITED:
    "AI generation is temporarily busy. Try again later.",
  GENERATION_INVALID_REQUEST:
    "The reviewed selection is no longer valid. Review and confirm it again.",
  GENERATION_INVALID_RESPONSE:
    "AI generation returned an invalid result. Try again.",
  GENERATION_CONTEXT_LIMIT:
    "The reviewed selection is too large for the configured AI context.",
  GENERATION_FAILED: "Test case generation failed. Try again.",
} as const;

export type GenerationErrorCode = keyof typeof generationErrorMessages;
