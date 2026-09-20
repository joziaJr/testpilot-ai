export const analysisErrorMessages = {
  AI_CONFIGURATION_ERROR: "AI analysis is not configured.",
  AI_PROVIDER_UNAVAILABLE: "AI analysis is temporarily unavailable. Try again.",
  AI_TIMEOUT: "AI analysis timed out. Try again.",
  AI_RATE_LIMITED: "AI analysis is temporarily busy. Try again later.",
  AI_INVALID_RESPONSE: "AI analysis returned an invalid result. Try again.",
  AI_CONTEXT_LIMIT: "This document is too large for safe AI analysis.",
  ANALYSIS_FAILED: "PRD analysis failed. Try again.",
} as const;

export type AnalysisErrorCode = keyof typeof analysisErrorMessages;
