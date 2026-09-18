import { getUploadPolicy } from "@/config/upload";
import { handleUpload } from "@/lib/upload-handler";
export const runtime = "nodejs";
export async function POST(request: Request) {
  return handleUpload(request, getUploadPolicy().maxBytes);
}
