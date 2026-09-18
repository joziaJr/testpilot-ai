import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { extractDocument } from "./document-extractor";

const fixture = (name: string) => readFileSync(`qa/test-data/m2/${name}`);

describe("TXT extraction", () => {
  it.each([
    ["English", "Product requirements\n\nThe user can upload a PRD."],
    ["Bahasa Indonesia", "Kebutuhan Produk\n\nPengguna dapat mengunggah PRD."],
    [
      "mixed language",
      "Kebutuhan Produk\n\nThe upload harus bersifat private.",
    ],
  ])("extracts multiline %s UTF-8 without rewriting", async (_label, text) => {
    const result = await extractDocument(
      "requirements.txt",
      "txt",
      new TextEncoder().encode(text.replace(/\n/g, "\r\n")),
    );
    expect(result).toMatchObject({
      fileName: "requirements.txt",
      fileType: "txt",
      status: "success",
      text,
      characterCount: text.length,
    });
  });

  it("accepts UTF-8 BOM and extracts the committed mixed-language fixture", async () => {
    const bytes = Buffer.concat([
      Buffer.from([0xef, 0xbb, 0xbf]),
      fixture("requirements.txt"),
    ]);
    const result = await extractDocument("requirements.txt", "txt", bytes);
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.text).toContain("Pengguna dapat mengunggah dokumen.");
      expect(result.text).toContain("The upload must remain private.");
      expect(result.text).not.toContain("\r");
    }
  });

  it("rejects whitespace-only content", async () => {
    await expect(
      extractDocument("whitespace.txt", "txt", fixture("whitespace.txt")),
    ).resolves.toMatchObject({
      status: "failed",
      error: { code: "EMPTY_DOCUMENT" },
    });
  });

  it("rejects malformed UTF-8 without replacement characters", async () => {
    await expect(
      extractDocument("bad.txt", "txt", new Uint8Array([0xc3, 0x28])),
    ).resolves.toMatchObject({
      status: "failed",
      error: { code: "MALFORMED_DOCUMENT" },
    });
  });
});

describe("PDF extraction", () => {
  it("extracts ordered text with page separation from a multi-page PDF", async () => {
    const result = await extractDocument(
      "requirements.pdf",
      "pdf",
      fixture("requirements.pdf"),
    );
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.text).toContain(
        "Product Requirements\nUser can upload a PRD.",
      );
      expect(result.text).toContain(
        "\n\nSecurity Requirements\nUploaded files remain private.",
      );
      expect(result.characterCount).toBe(result.text.length);
    }
  });

  it("returns an unreadable-document failure when a PDF has no text", async () => {
    await expect(
      extractDocument("scan.pdf", "pdf", fixture("image-only.pdf")),
    ).resolves.toMatchObject({
      status: "failed",
      error: { code: "UNREADABLE_DOCUMENT" },
    });
  });

  it("maps malformed PDF parser failures safely", async () => {
    await expect(
      extractDocument("bad.pdf", "pdf", fixture("malformed.pdf")),
    ).resolves.toMatchObject({
      status: "failed",
      error: { code: "MALFORMED_DOCUMENT" },
    });
  });
});

describe("DOCX extraction", () => {
  it("extracts the existing M1 accepted DOCX fixture", async () => {
    const result = await extractDocument(
      "requirements.docx",
      "docx",
      readFileSync("qa/test-data/m1/requirements.docx"),
    );
    expect(result.status).toBe("success");
    if (result.status === "success")
      expect(result.text).toContain("Synthetic requirements document");
  });

  it("extracts headings, paragraphs, list text and table text", async () => {
    const result = await extractDocument(
      "requirements.docx",
      "docx",
      fixture("requirements.docx"),
    );
    expect(result.status).toBe("success");
    if (result.status === "success") {
      expect(result.text).toContain("Product Requirements");
      expect(result.text).toContain("Pengguna dapat mengunggah dokumen.");
      expect(result.text).toContain("- Support English and Bahasa Indonesia");
      expect(result.text).toContain("Field");
      expect(result.text).toContain("Minimum 8 characters");
    }
  });

  it("rejects a whitespace-only DOCX", async () => {
    await expect(
      extractDocument("whitespace.docx", "docx", fixture("whitespace.docx")),
    ).resolves.toMatchObject({
      status: "failed",
      error: { code: "EMPTY_DOCUMENT" },
    });
  });

  it("maps malformed DOCX parser failures safely", async () => {
    await expect(
      extractDocument("bad.docx", "docx", fixture("malformed.docx")),
    ).resolves.toMatchObject({
      status: "failed",
      error: { code: "MALFORMED_DOCUMENT" },
    });
  });
});
