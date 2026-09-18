import { getUploadPolicy } from "@/config/upload";
import { handleExtraction } from "@/lib/extraction/extraction-handler";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleExtraction(request, getUploadPolicy().maxBytes);
}
