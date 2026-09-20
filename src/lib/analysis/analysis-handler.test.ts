import { expect, it, vi } from "vitest";
import { validAnalysis } from "./analysis-test-fixture";
import { handleAnalysis } from "./analysis-handler";
import type { PrdAnalyzer } from "./configured-analyzer";

const maxBytes = 10_000_000;

function uploadRequest() {
  const form = new FormData();
  form.set(
    "file",
    new File(["Valid PRD"], "requirements.txt", { type: "text/plain" }),
  );
  return new Request("http://localhost/api/documents/analyze", {
    method: "POST",
    body: form,
  });
}

it("runs analysis only after successful M1 validation and M2 extraction", async () => {
  const extractor = vi.fn().mockResolvedValue({
    fileName: "requirements.txt",
    fileType: "txt",
    text: "Users can upload a PRD. Admin can manage users.",
    characterCount: 49,
    status: "success",
  });
  const analyzer = vi.fn<PrdAnalyzer>().mockResolvedValue({
    status: "success",
    analysis: validAnalysis(),
    usage: [],
  });
  const response = await handleAnalysis(
    uploadRequest(),
    maxBytes,
    analyzer,
    extractor,
  );
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(extractor).toHaveBeenCalledOnce();
  expect(analyzer).toHaveBeenCalledWith(
    "Users can upload a PRD. Admin can manage users.",
    expect.any(AbortSignal),
  );
  const body = await response.json();
  expect(body.analysis.analysis.needConfirmation).toHaveLength(1);
  expect(body.extraction).not.toHaveProperty("text");
});

it("does not invoke the analyzer when extraction fails", async () => {
  const extractor = vi.fn().mockResolvedValue({
    fileName: "requirements.txt",
    fileType: "txt",
    text: "",
    characterCount: 0,
    status: "failed",
    error: { code: "EMPTY_DOCUMENT", message: "No readable text found." },
  });
  const analyzer = vi.fn<PrdAnalyzer>();
  const response = await handleAnalysis(
    uploadRequest(),
    maxBytes,
    analyzer,
    extractor,
  );
  expect(response.status).toBe(422);
  expect(analyzer).not.toHaveBeenCalled();
  expect(await response.json()).toMatchObject({
    extraction: { status: "failed", error: { code: "EMPTY_DOCUMENT" } },
  });
});

it("returns only safe application errors for provider failure", async () => {
  const extractor = vi.fn().mockResolvedValue({
    fileName: "requirements.txt",
    fileType: "txt",
    text: "secret source body",
    characterCount: 18,
    status: "success",
  });
  const analyzer = vi.fn<PrdAnalyzer>().mockResolvedValue({
    status: "failed",
    error: {
      code: "AI_PROVIDER_UNAVAILABLE",
      message: "AI analysis is temporarily unavailable. Try again.",
    },
    usage: [],
  });
  const response = await handleAnalysis(
    uploadRequest(),
    maxBytes,
    analyzer,
    extractor,
  );
  const serialized = JSON.stringify(await response.json());
  expect(response.status).toBe(503);
  expect(serialized).not.toContain("secret source body");
  expect(serialized).toContain("AI_PROVIDER_UNAVAILABLE");
});

it("rejects M1-invalid input before extraction or analysis", async () => {
  const form = new FormData();
  form.set("file", new File(["bad"], "requirements.exe"));
  const extractor = vi.fn();
  const analyzer = vi.fn<PrdAnalyzer>();
  const response = await handleAnalysis(
    new Request("http://localhost/api/documents/analyze", {
      method: "POST",
      body: form,
    }),
    maxBytes,
    analyzer,
    extractor,
  );
  expect(response.status).toBe(400);
  expect(extractor).not.toHaveBeenCalled();
  expect(analyzer).not.toHaveBeenCalled();
});
