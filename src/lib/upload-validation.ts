export const uploadTypes = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
} as const;

export type UploadExtension = keyof typeof uploadTypes;
export type FileMetadata = { name: string; size: number; type: string };
export const uploadMessages = {
  FILE_REQUIRED: "Choose one PRD file.",
  INVALID_REQUEST: "Upload one file using the file picker or drop area.",
  UNSUPPORTED_TYPE: "Unsupported file format. Choose PDF, DOCX, or TXT.",
  TYPE_MISMATCH:
    "The file type does not match its extension. Choose the original file.",
  TOO_LARGE: "File exceeds maximum size. Choose a file of 10 MB or less.",
  EMPTY_FILE: "The file is empty. Choose a file with content.",
  INVALID_FILE:
    "File cannot be read. Choose an original PDF, DOCX, or UTF-8 TXT file.",
  UPLOAD_FAILED: "Unable to validate the file. Please try again.",
} as const;
export type UploadErrorCode = keyof typeof uploadMessages;

export function extensionOf(name: string): UploadExtension | undefined {
  const extension = name.split(".").pop()?.toLowerCase();
  return extension && Object.hasOwn(uploadTypes, extension)
    ? (extension as UploadExtension)
    : undefined;
}

export function validateMetadata(
  file: FileMetadata,
  maxBytes: number,
): UploadErrorCode | undefined {
  if (!file.name) return "FILE_REQUIRED";
  if (file.size === 0) return "EMPTY_FILE";
  if (file.size > maxBytes) return "TOO_LARGE";
  const extension = extensionOf(file.name);
  if (!extension) return "UNSUPPORTED_TYPE";
  // Browsers may omit MIME or use the generic binary MIME. Bytes are checked server-side.
  const mime = file.type.toLowerCase();
  if (mime && mime !== "application/octet-stream") {
    if (
      !Object.values(uploadTypes).includes(
        mime as (typeof uploadTypes)[UploadExtension],
      )
    )
      return "UNSUPPORTED_TYPE";
    if (mime !== uploadTypes[extension]) return "TYPE_MISMATCH";
  }
}

// Container inspection only: never inflate ZIP entries or extract document text.
function isDocx(bytes: Uint8Array): boolean {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 22 || view.getUint32(0, true) !== 0x04034b50) return false;
  let end = bytes.length - 22;
  const earliest = Math.max(0, end - 65535);
  while (end >= earliest && view.getUint32(end, true) !== 0x06054b50) end--;
  if (
    end < earliest ||
    end + 22 + view.getUint16(end + 20, true) !== bytes.length
  )
    return false;
  if (view.getUint32(end + 4, true) !== 0) return false; // no multi-disk archives
  const count = view.getUint16(end + 10, true);
  if (count !== view.getUint16(end + 8, true)) return false;
  let offset = view.getUint32(end + 16, true);
  if (offset + view.getUint32(end + 12, true) !== end) return false;
  const names = new Set<string>();
  for (let entry = 0; entry < count; entry++) {
    if (offset + 46 > end || view.getUint32(offset, true) !== 0x02014b50)
      return false;
    if (view.getUint16(offset + 8, true) & 1) return false;
    const length = view.getUint16(offset + 28, true);
    const next =
      offset +
      46 +
      length +
      view.getUint16(offset + 30, true) +
      view.getUint16(offset + 32, true);
    if (next > end) return false;
    const local = view.getUint32(offset + 42, true);
    if (local + 30 > offset || view.getUint32(local, true) !== 0x04034b50)
      return false;
    const localLength = view.getUint16(local + 26, true);
    const dataStart =
      local + 30 + localLength + view.getUint16(local + 28, true);
    if (
      dataStart + view.getUint32(offset + 20, true) > offset ||
      localLength !== length
    )
      return false;
    const nameBytes = bytes.subarray(offset + 46, offset + 46 + length);
    if (!nameBytes.every((value, i) => value === bytes[local + 30 + i]))
      return false;
    const name = new TextDecoder().decode(nameBytes);
    if (names.has(name)) return false;
    names.add(name);
    offset = next;
  }
  return (
    offset === end &&
    names.has("[Content_Types].xml") &&
    names.has("_rels/.rels") &&
    names.has("word/document.xml")
  );
}

export function validateFileBytes(
  bytes: Uint8Array,
  extension: UploadExtension,
): UploadErrorCode | undefined {
  if (extension === "pdf") {
    const header = new TextDecoder().decode(bytes.subarray(0, 8));
    const tail = new TextDecoder().decode(
      bytes.subarray(Math.max(0, bytes.length - 1024)),
    );
    if (!/^%PDF-\d\.\d/.test(header) || !/%%EOF\s*$/.test(tail))
      return "INVALID_FILE";
  } else if (extension === "docx") {
    if (!isDocx(bytes)) return "INVALID_FILE";
  } else {
    try {
      const signature = new TextDecoder().decode(bytes.subarray(0, 5));
      if (signature === "%PDF-" || signature.startsWith("PK\u0003\u0004"))
        return "INVALID_FILE";
      new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      if (
        bytes.some(
          (byte) => byte < 32 && byte !== 9 && byte !== 10 && byte !== 13,
        )
      )
        return "INVALID_FILE";
    } catch {
      return "INVALID_FILE";
    }
  }
}
