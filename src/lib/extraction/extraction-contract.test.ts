import { describe, expect, it } from "vitest";
import {
  documentExtractionResultSchema,
  extractionFailure,
} from "./extraction-contract";

describe("documentExtractionResultSchema", () => {
  it("accepts a complete success contract", () => {
    expect(
      documentExtractionResultSchema.parse({
        fileName: "requirements.txt",
        fileType: "txt",
        status: "success",
        text: "Requirement",
        characterCount: 11,
      }),
    ).toEqual({
      fileName: "requirements.txt",
      fileType: "txt",
      status: "success",
      text: "Requirement",
      characterCount: 11,
    });
  });

  it("rejects extra or inconsistent fields", () => {
    expect(
      documentExtractionResultSchema.safeParse({
        fileName: "requirements.txt",
        fileType: "txt",
        status: "success",
        text: "Requirement",
        characterCount: 0,
        inventedMeaning: true,
      }).success,
    ).toBe(false);
  });

  it("builds a safe failure with no extracted text", () => {
    expect(extractionFailure("scan.pdf", "pdf", "UNREADABLE_DOCUMENT")).toEqual(
      {
        fileName: "scan.pdf",
        fileType: "pdf",
        status: "failed",
        text: "",
        characterCount: 0,
        error: {
          code: "UNREADABLE_DOCUMENT",
          message: "No readable text found.",
        },
      },
    );
  });
});
