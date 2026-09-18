export const extractionErrorMessages = {
  EMPTY_DOCUMENT: "No readable text found.",
  UNREADABLE_DOCUMENT: "No readable text found.",
  MALFORMED_DOCUMENT: "Document is malformed and cannot be extracted.",
  EXTRACTION_FAILED: "Document extraction failed. Try another file.",
} as const;

export type ExtractionErrorCode = keyof typeof extractionErrorMessages;
