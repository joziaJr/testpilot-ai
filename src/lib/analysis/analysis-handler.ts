import { extractDocument } from "../extraction/document-extractor";
import { handleUpload } from "../upload-handler";
import type { PrdAnalyzer } from "./configured-analyzer";

type DocumentExtractor = typeof extractDocument;

const statuses = {
  AI_CONFIGURATION_ERROR: 503,
  AI_PROVIDER_UNAVAILABLE: 503,
  AI_TIMEOUT: 504,
  AI_RATE_LIMITED: 429,
  AI_INVALID_RESPONSE: 502,
  AI_CONTEXT_LIMIT: 422,
  ANALYSIS_FAILED: 502,
} as const;

export async function handleAnalysis(
  request: Request,
  maxBytes: number,
  analyzer: PrdAnalyzer,
  extractor: DocumentExtractor = extractDocument,
) {
  return handleUpload(request, maxBytes, async ({ file, bytes, extension }) => {
    const extraction = await extractor(file.name, extension, bytes);
    if (extraction.status === "failed")
      return Response.json(
        {
          validation: { status: "passed" },
          extraction: {
            status: extraction.status,
            fileName: extraction.fileName,
            fileType: extraction.fileType,
            characterCount: extraction.characterCount,
            error: extraction.error,
          },
        },
        { status: 422, headers: { "Cache-Control": "no-store" } },
      );
    const outcome = await analyzer(extraction.text, request.signal);
    if (outcome.status === "failed")
      return Response.json(
        {
          validation: { status: "passed" },
          extraction: {
            status: "success",
            fileName: extraction.fileName,
            fileType: extraction.fileType,
            characterCount: extraction.characterCount,
          },
          analysis: outcome,
        },
        {
          status: statuses[outcome.error.code],
          headers: { "Cache-Control": "no-store" },
        },
      );
    return Response.json(
      {
        validation: { status: "passed" },
        analysis: outcome,
        extraction: {
          status: "success",
          fileName: extraction.fileName,
          fileType: extraction.fileType,
          characterCount: extraction.characterCount,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  });
}
