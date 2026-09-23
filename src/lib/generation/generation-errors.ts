export const generationErrorMessages = {
  INVALID_SELECTION:
    "The reviewed selection is no longer valid. Review and confirm it again.",
  AI_CONFIGURATION_ERROR:
    "AI generation is not configured. Ask an administrator to configure it.",
  AI_PROVIDER_UNAVAILABLE:
    "AI generation is temporarily unavailable. Try again.",
  AI_TIMEOUT: "AI generation timed out. Try again.",
  AI_RATE_LIMITED: "AI generation is temporarily busy. Try again later.",
  AI_INVALID_RESPONSE:
    "AI returned an invalid generation result. Try generating again.",
  AI_CONTEXT_LIMIT:
    "The selected requirement context is too large for AI generation.",
  GENERATION_FAILED: "Test case generation failed. Try again.",
} as const;

export type GenerationErrorCode = keyof typeof generationErrorMessages;
