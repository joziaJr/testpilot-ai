import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { serverEnvironmentSchema } from "../config/env-schema";
import {
  handleUpload,
  MULTIPART_OVERHEAD_BYTES,
  UPLOAD_TIMEOUT_MS,
} from "./upload-handler";
import { uploadTypes } from "./upload-validation";
const max = serverEnvironmentSchema.parse({}).MAX_UPLOAD_SIZE_MB * 1_000_000;
function request(form: FormData) {
  return new Request("http://localhost/api/uploads/validate", {
    method: "POST",
    body: form,
  });
}
function form(file: File) {
  const data = new FormData();
  data.set("file", file);
  return data;
}

describe("server upload contract", () => {
  it.each(["pdf", "docx", "txt"] as const)(
    "accepts %s and returns metadata only",
    async (ext) => {
      const bytes = new Uint8Array(
        readFileSync(`qa/test-data/m1/requirements.${ext}`),
      );
      const response = await handleUpload(
        request(
          form(new File([bytes], `prd.${ext}`, { type: uploadTypes[ext] })),
        ),
        max,
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(await response.json()).toEqual({
        file: { name: `prd.${ext}`, size: bytes.length, extension: ext },
      });
    },
  );
  it.each([max - 1, max, max + 1])(
    "enforces actual file size %i",
    async (size) => {
      const response = await handleUpload(
        request(
          form(new File(["a".repeat(size)], "prd.txt", { type: "text/plain" })),
        ),
        max,
      );
      expect(response.status).toBe(size > max ? 413 : 200);
    },
  );
  it.each([
    [new File([], "empty.txt"), "EMPTY_FILE"],
    [
      new File(["fake"], "fake.pdf", { type: "application/pdf" }),
      "INVALID_FILE",
    ],
    [new File(["text"], "prd.exe"), "UNSUPPORTED_TYPE"],
    [new File(["text"], "prd.txt", { type: "image/png" }), "UNSUPPORTED_TYPE"],
    [
      new File(["text"], "prd.txt", { type: "application/pdf" }),
      "TYPE_MISMATCH",
    ],
  ])("rejects client-bypassed file checks", async (file, code) => {
    const response = await handleUpload(request(form(file as File)), max);
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe(code);
  });
  it("rejects missing file, string field, duplicate files and unexpected fields", async () => {
    const missing = await handleUpload(request(new FormData()), max);
    expect((await missing.json()).error.code).toBe("FILE_REQUIRED");
    const text = new FormData();
    text.set("file", "not a file");
    const duplicate = form(new File(["ok"], "prd.txt"));
    duplicate.append("file", new File(["ok"], "other.txt"));
    const extra = form(new File(["ok"], "prd.txt"));
    extra.set("extra", "value");
    for (const data of [text, duplicate, extra])
      expect((await handleUpload(request(data), max)).status).toBe(400);
  });
  it.each([
    "application/json",
    "multipart/form-data",
    "multipart/form-data; boundary=missing",
  ])("safely rejects malformed %s", async (type) => {
    const response = await handleUpload(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Content-Type": type },
        body: "broken",
      }),
      max,
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: {
        code: "INVALID_REQUEST",
        message: "Upload one file using the file picker or drop area.",
      },
    });
  });
  it("bounds the streamed body without trusting Content-Length", async () => {
    for (const length of [
      undefined,
      "1",
      String(max + MULTIPART_OVERHEAD_BYTES + 1),
    ]) {
      const headers: Record<string, string> = {
        "Content-Type": "multipart/form-data; boundary=x",
      };
      if (length) headers["Content-Length"] = length;
      const response = await handleUpload(
        new Request("http://localhost", {
          method: "POST",
          headers,
          body: new Uint8Array(max + MULTIPART_OVERHEAD_BYTES + 1),
        }),
        max,
      );
      expect(response.status).toBe(413);
    }
  });
  it("cancels a stalled body", async () => {
    vi.useFakeTimers();
    try {
      const cancel = vi.fn();
      const body = new ReadableStream({ cancel });
      const pending = handleUpload(
        new Request("http://localhost", {
          method: "POST",
          body,
          headers: { "Content-Type": "multipart/form-data; boundary=x" },
          duplex: "half",
        } as RequestInit),
        max,
      );
      await vi.advanceTimersByTimeAsync(UPLOAD_TIMEOUT_MS);
      expect((await pending).status).toBe(400);
      expect(cancel).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });
});
