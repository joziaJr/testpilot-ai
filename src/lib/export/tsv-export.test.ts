import { afterEach, describe, expect, it, vi } from "vitest";
import type { GeneratedTestCases } from "../generation/generation-contract";
import {
  createTsvBlob,
  exportFilenames,
  normalizeStructureBreakingCharacters,
  protectSpreadsheetFormula,
  serializeSteps,
  serializeTestCasesToTsv,
  serializeTsvCell,
  STEP_SEPARATOR,
  triggerBrowserDownload,
  TSV_MIME_TYPE,
  UTF8_BOM,
} from "./tsv-export";

type GeneratedCase = GeneratedTestCases["frontend"][number];

function generatedCase(
  testCaseId: string,
  overrides: Partial<GeneratedCase> = {},
): GeneratedCase {
  return {
    testCaseId,
    module: "Task Management",
    feature: "Create Task",
    title: "Create a task",
    preconditions: null,
    steps: ["Open the page.", "Submit valid data."],
    expectedResult: "Tugas berhasil dibuat.",
    priority: "Medium",
    type: "Positive",
    automation: "Candidate",
    notes: null,
    source: {
      moduleId: "internal-module-id",
      featureId: "internal-feature-id",
      requirementIds: ["internal-requirement-id"],
      businessRuleIds: [],
      validationIds: [],
    },
    ...overrides,
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("OQ-08 TSV serialization", () => {
  it("exports only selected approved columns in canonical order", () => {
    const output = serializeTestCasesToTsv(
      [generatedCase("TP-FE-001")],
      ["testCaseId", "title", "automation", "notes"],
    );
    expect(output).toBe(
      "Test Case ID\tTitle\tAutomation\tNotes\r\n" +
        "TP-FE-001\tCreate a task\tCandidate\t-",
    );
    expect(output).not.toContain("internal-module-id");
    expect(output).not.toContain("Expected Result");
  });

  it("preserves current row order, layer IDs, edits, and deleted ID gaps", () => {
    const output = serializeTestCasesToTsv(
      [
        generatedCase("TP-BE-001", { title: "Edited value" }),
        generatedCase("TP-BE-003", { title: "Remaining value" }),
      ],
      ["testCaseId", "title"],
    );
    expect(output.split("\r\n")).toEqual([
      "Test Case ID\tTitle",
      "TP-BE-001\tEdited value",
      "TP-BE-003\tRemaining value",
    ]);
    expect(output).not.toContain("TP-BE-002");
  });

  it("flattens ordered steps without mutating the source array", () => {
    const steps = [
      "Open\tlogin page",
      "Enter valid\r\ncredentials",
      "Click\nLogin",
    ];
    const before = [...steps];
    expect(serializeSteps(steps)).toBe(
      `1. Open login page${STEP_SEPARATOR}2. Enter valid credentials${STEP_SEPARATOR}3. Click Login`,
    );
    expect(steps).toEqual(before);
    expect(serializeSteps(["Only step"])).toBe("1. Only step");
  });

  it("normalizes tabs and every newline form without creating rows or columns", () => {
    expect(normalizeStructureBreakingCharacters("a\tb\nc\rd\r\ne")).toBe(
      "a b c d e",
    );
    expect(
      normalizeStructureBreakingCharacters("kept  spacing \t  normalized"),
    ).toBe("kept  spacing normalized");
    const output = serializeTestCasesToTsv(
      [
        generatedCase("TP-FE-001", {
          title: "Line one\nLine two\tvalue",
          steps: ["First\rstep", "Second\r\nstep"],
        }),
      ],
      ["testCaseId", "title", "steps"],
    );
    expect(output.split("\r\n")).toHaveLength(2);
    expect(output.split("\r\n")[1].split("\t")).toHaveLength(3);
  });

  it("preserves quotes, Unicode, Indonesian, and mixed-language text", () => {
    expect(
      serializeTestCasesToTsv(
        [
          generatedCase("TP-FE-001", {
            title: 'Pengguna membuat tugas "重要"',
            expectedResult: "Tugas saved dengan benar ✓",
          }),
        ],
        ["title", "expectedResult"],
      ),
    ).toBe(
      'Title\tExpected Result\r\nPengguna membuat tugas "重要"\tTugas saved dengan benar ✓',
    );
  });

  it("neutralizes all approved formula prefixes including leading whitespace", () => {
    for (const value of [
      "=SUM(A1:A2)",
      "+CMD",
      "-1+2",
      "@SUM(1,1)",
      "   =hidden",
    ])
      expect(serializeTsvCell(value)).toBe(`'${value}`);
    expect(serializeTsvCell(null)).toBe("-");
    for (const value of ["High", "Negative", "Login", "ordinary-hyphen"])
      expect(protectSpreadsheetFormula(value)).toBe(value);
  });

  it("is deterministic and rejects empty cases or invalid column drafts", () => {
    const cases = [generatedCase("TP-FE-001")];
    const first = serializeTestCasesToTsv(cases, ["testCaseId", "steps"]);
    expect(serializeTestCasesToTsv(cases, ["testCaseId", "steps"])).toBe(first);
    expect(() => serializeTestCasesToTsv(cases, [])).toThrow(
      "Select at least one column for export.",
    );
    expect(() => serializeTestCasesToTsv([], ["testCaseId"])).toThrow(
      "No test cases available to export.",
    );
  });

  it("creates a UTF-8 BOM TSV Blob and cleans up its object URL", async () => {
    const blob = createTsvBlob("Title\r\nTugas");
    expect(blob.type).toBe(TSV_MIME_TYPE);
    expect([...new Uint8Array(await blob.arrayBuffer()).slice(0, 3)]).toEqual([
      0xef, 0xbb, 0xbf,
    ]);
    expect(UTF8_BOM).toBe("\uFEFF");

    const click = vi.fn();
    const remove = vi.fn();
    const append = vi.fn();
    const anchor = { click, remove } as unknown as HTMLAnchorElement;
    const createObjectURL = vi.fn(() => "blob:testpilot");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    vi.stubGlobal("document", {
      createElement: vi.fn(() => anchor),
      body: { append },
    });

    triggerBrowserDownload(blob, exportFilenames.frontend);
    expect(anchor.download).toBe("testpilot_frontend.tsv");
    expect(anchor.href).toBe("blob:testpilot");
    expect(append).toHaveBeenCalledWith(anchor);
    expect(click).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:testpilot");
  });
});
