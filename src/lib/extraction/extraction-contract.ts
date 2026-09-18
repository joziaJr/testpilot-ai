import { z } from "zod";
import { type UploadExtension } from "../upload-validation";
import {
  extractionErrorMessages,
  type ExtractionErrorCode,
} from "./extraction-errors";

const baseShape = {
  fileName: z.string().min(1),
  fileType: z.enum(["pdf", "docx", "txt"]),
};

export const documentExtractionResultSchema = z.discriminatedUnion("status", [
  z
    .object({
      ...baseShape,
      status: z.literal("success"),
      text: z.string().min(1),
      characterCount: z.number().int().positive(),
    })
    .strict(),
  z
    .object({
      ...baseShape,
      status: z.literal("failed"),
      text: z.literal(""),
      characterCount: z.literal(0),
      error: z
        .object({
          code: z.enum([
            "EMPTY_DOCUMENT",
            "UNREADABLE_DOCUMENT",
            "MALFORMED_DOCUMENT",
            "EXTRACTION_FAILED",
          ]),
          message: z.string().min(1),
        })
        .strict(),
    })
    .strict(),
]);

export type DocumentExtractionResult = z.infer<
  typeof documentExtractionResultSchema
>;

export { extractionErrorMessages, type ExtractionErrorCode };

export function extractionFailure(
  fileName: string,
  fileType: UploadExtension,
  code: ExtractionErrorCode,
): DocumentExtractionResult {
  return documentExtractionResultSchema.parse({
    fileName,
    fileType,
    status: "failed",
    text: "",
    characterCount: 0,
    error: { code, message: extractionErrorMessages[code] },
  });
}
