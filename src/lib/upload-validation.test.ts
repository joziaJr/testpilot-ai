import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { serverEnvironmentSchema } from "../config/env-schema";
import {
  validateFileBytes,
  validateMetadata,
  uploadTypes,
} from "./upload-validation";

const max = serverEnvironmentSchema.parse({}).MAX_UPLOAD_SIZE_MB * 1_000_000;
const metadata = { name: "requirements.txt", type: "text/plain", size: 10 };

describe("upload metadata", () => {
  it.each([max - 1, max])("accepts %i bytes", (size) =>
    expect(validateMetadata({ ...metadata, size }, max)).toBeUndefined(),
  );
  it.each([
    [{ size: max + 1 }, "TOO_LARGE"],
    [{ size: 0 }, "EMPTY_FILE"],
    [{ name: "" }, "FILE_REQUIRED"],
    [{ name: "evil.exe" }, "UNSUPPORTED_TYPE"],
    [{ type: "image/png" }, "UNSUPPORTED_TYPE"],
    [{ type: "application/pdf" }, "TYPE_MISMATCH"],
  ] as const)("rejects %j", (change, code) =>
    expect(validateMetadata({ ...metadata, ...change }, max)).toBe(code),
  );
  it.each(["My requirements.TXT", "prd.v2.txt", `${"a".repeat(180)}.txt`])(
    "accepts filename %s",
    (name) =>
      expect(validateMetadata({ ...metadata, name }, max)).toBeUndefined(),
  );
  it.each(["", "application/octet-stream"])(
    "permits unspecified MIME %s for byte validation",
    (type) =>
      expect(validateMetadata({ ...metadata, type }, max)).toBeUndefined(),
  );
});

describe("upload byte validation", () => {
  it("rejects PDF content renamed to TXT", () => {
    expect(
      validateFileBytes(
        readFileSync("qa/test-data/m1/requirements.pdf"),
        "txt",
      ),
    ).toBe("INVALID_FILE");
  });
  it.each(["pdf", "docx", "txt"] as const)("accepts synthetic %s", (ext) => {
    const bytes = readFileSync(`qa/test-data/m1/requirements.${ext}`);
    expect(
      validateMetadata(
        { name: `prd.${ext}`, size: bytes.length, type: uploadTypes[ext] },
        max,
      ),
    ).toBeUndefined();
    expect(validateFileBytes(bytes, ext)).toBeUndefined();
  });
  it("accepts UTF-8 BOM", () =>
    expect(
      validateFileBytes(new TextEncoder().encode("\ufeffrequirements"), "txt"),
    ).toBeUndefined());
  it.each(["pdf", "docx"] as const)("rejects a renamed TXT as %s", (ext) =>
    expect(validateFileBytes(new TextEncoder().encode("fake"), ext)).toBe(
      "INVALID_FILE",
    ),
  );
  it.each([new Uint8Array([0xff, 0xfe]), new Uint8Array([0, 1])])(
    "rejects binary TXT",
    (bytes) => expect(validateFileBytes(bytes, "txt")).toBe("INVALID_FILE"),
  );
  it("rejects truncated PDF", () =>
    expect(
      validateFileBytes(new TextEncoder().encode("%PDF-1.4\n"), "pdf"),
    ).toBe("INVALID_FILE"));
  it("rejects truncated and damaged DOCX directories safely", () => {
    const original = readFileSync("qa/test-data/m1/requirements.docx");
    for (const size of [0, 4, 21, 50, original.length - 1])
      expect(validateFileBytes(original.subarray(0, size), "docx")).toBe(
        "INVALID_FILE",
      );
    const damaged = Buffer.from(original);
    damaged.writeUInt32LE(0xffffffff, damaged.length - 6);
    expect(validateFileBytes(damaged, "docx")).toBe("INVALID_FILE");
  });
});
