import "server-only";
import { getServerEnvironment } from "./env";

export function getUploadPolicy() {
  const maxSizeMB = getServerEnvironment().MAX_UPLOAD_SIZE_MB;
  return { maxSizeMB, maxBytes: maxSizeMB * 1_000_000 };
}
