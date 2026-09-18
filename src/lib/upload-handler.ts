import {
  extensionOf,
  uploadMessages,
  validateFileBytes,
  validateMetadata,
  type UploadExtension,
  type UploadErrorCode,
} from "./upload-validation";

// Multipart headers/boundary overhead is separate from the file's product limit.
export const MULTIPART_OVERHEAD_BYTES = 64 * 1024;
export const UPLOAD_TIMEOUT_MS = 30_000;

function reject(code: UploadErrorCode, status = 400) {
  return Response.json(
    { error: { code, message: uploadMessages[code] } },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export type ValidatedUpload = {
  file: File;
  bytes: Uint8Array;
  extension: UploadExtension;
};

type AcceptedUploadHandler = (upload: ValidatedUpload) => Promise<Response>;

async function uploadAccepted({ file, extension }: ValidatedUpload) {
  return Response.json(
    { file: { name: file.name, size: file.size, extension } },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function handleUpload(
  request: Request,
  maxBytes: number,
  onAccepted: AcceptedUploadHandler = uploadAccepted,
): Promise<Response> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!/^multipart\/form-data\s*;/i.test(contentType) || !request.body)
    return reject("INVALID_REQUEST");
  const limit = maxBytes + MULTIPART_OVERHEAD_BYTES;
  const length = request.headers.get("content-length");
  if (
    length &&
    (!/^\d+$/.test(length) || !Number.isSafeInteger(Number(length)))
  )
    return reject("INVALID_REQUEST");
  if (length && Number(length) > limit) return reject("TOO_LARGE", 413);
  const reader = request.body.getReader();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    void reader.cancel().catch(() => {});
  }, UPLOAD_TIMEOUT_MS);
  try {
    const chunks: Uint8Array<ArrayBuffer>[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (timedOut || request.signal.aborted) return reject("INVALID_REQUEST");
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        return reject("TOO_LARGE", 413);
      }
      chunks.push(new Uint8Array(value));
    }
    const form = await new Response(new Blob(chunks), {
      headers: { "Content-Type": contentType },
    }).formData();
    const entries = [...form.entries()];
    if (entries.length === 0) return reject("FILE_REQUIRED");
    if (
      entries.length !== 1 ||
      entries[0][0] !== "file" ||
      !(entries[0][1] instanceof File)
    )
      return reject("INVALID_REQUEST");
    const file = entries[0][1];
    const extension = extensionOf(file.name)!;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const error =
      validateMetadata(file, maxBytes) ?? validateFileBytes(bytes, extension);
    if (error) return reject(error, error === "TOO_LARGE" ? 413 : 400);
    return onAccepted({ file, bytes, extension });
  } catch {
    return reject("INVALID_REQUEST");
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }
}
