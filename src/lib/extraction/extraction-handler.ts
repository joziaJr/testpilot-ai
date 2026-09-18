import { handleUpload } from "../upload-handler";
import { extractDocument } from "./document-extractor";

export type DocumentExtractor = typeof extractDocument;

export async function handleExtraction(
  request: Request,
  maxBytes: number,
  extractor: DocumentExtractor = extractDocument,
) {
  return handleUpload(request, maxBytes, async ({ file, bytes, extension }) => {
    const extraction = await extractor(file.name, extension, bytes);
    const publicExtraction =
      extraction.status === "success"
        ? {
            status: extraction.status,
            fileName: extraction.fileName,
            fileType: extraction.fileType,
            characterCount: extraction.characterCount,
          }
        : {
            status: extraction.status,
            fileName: extraction.fileName,
            fileType: extraction.fileType,
            characterCount: extraction.characterCount,
            error: extraction.error,
          };
    return Response.json(
      {
        validation: { status: "passed" },
        extraction: publicExtraction,
      },
      {
        status: extraction.status === "success" ? 200 : 422,
        headers: { "Cache-Control": "no-store" },
      },
    );
  });
}
