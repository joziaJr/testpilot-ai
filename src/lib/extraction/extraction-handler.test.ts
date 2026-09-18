import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { serverEnvironmentSchema } from "../../config/env-schema";
import { handleExtraction } from "./extraction-handler";
import { extractDocument } from "./document-extractor";

const maxBytes =
  serverEnvironmentSchema.parse({}).MAX_UPLOAD_SIZE_MB * 1_000_000;
const types = {
  txt: "text/plain",
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const;

function upload(name: string) {
  const extension = name.split(".").pop() as keyof typeof types;
  const form = new FormData();
  form.set(
    "file",
    new File([readFileSync(`qa/test-data/m2/${name}`)], name, {
      type: types[extension],
    }),
  );
  return new Request("http://localhost/api/documents/extract", {
    method: "POST",
    body: form,
  });
}

describe("M1 validation to M2 extraction integration", () => {
  it.each(["requirements.txt", "requirements.pdf", "requirements.docx"])(
    "extracts M1-accepted %s without returning raw text",
    async (name) => {
      const response = await handleExtraction(upload(name), maxBytes);
      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("no-store");
      const body = await response.json();
      expect(body).toMatchObject({
        validation: { status: "passed" },
        extraction: { status: "success", fileName: name },
      });
      expect(body.extraction.characterCount).toBeGreaterThan(0);
      expect(body.extraction).not.toHaveProperty("text");
    },
  );

  it("distinguishes accepted validation from unreadable extraction", async () => {
    const response = await handleExtraction(upload("image-only.pdf"), maxBytes);
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      validation: { status: "passed" },
      extraction: {
        status: "failed",
        characterCount: 0,
        error: {
          code: "UNREADABLE_DOCUMENT",
          message: "No readable text found.",
        },
      },
    });
  });

  it("never invokes extraction when M1 rejects the file", async () => {
    const extractor = vi.fn(extractDocument);
    const form = new FormData();
    form.set("file", new File(["unsupported"], "requirements.exe"));
    const response = await handleExtraction(
      new Request("http://localhost/api/documents/extract", {
        method: "POST",
        body: form,
      }),
      maxBytes,
      extractor,
    );
    expect(response.status).toBe(400);
    expect(extractor).not.toHaveBeenCalled();
  });
});
