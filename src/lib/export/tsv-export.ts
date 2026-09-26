import type { GeneratedTestCases } from "../generation/generation-contract";
import {
  exportColumnConfigurationSchema,
  exportColumns,
  type ExportColumnKey,
} from "./export-column-config";

export const TSV_MIME_TYPE = "text/tab-separated-values;charset=utf-8";
export const UTF8_BOM = "\uFEFF";
export const TSV_ROW_SEPARATOR = "\r\n";
export const STEP_SEPARATOR = " | ";

export const exportFilenames = {
  frontend: "testpilot_frontend.tsv",
  backend: "testpilot_backend.tsv",
} as const;

type GeneratedTestCase = GeneratedTestCases["frontend"][number];
export type ExportLayer = keyof GeneratedTestCases;

const labels = new Map(
  exportColumns.map((column) => [column.key, column.label]),
);

const valueReaders: Record<
  Exclude<ExportColumnKey, "steps">,
  (item: GeneratedTestCase) => string | null
> = {
  testCaseId: (item) => item.testCaseId,
  module: (item) => item.module,
  feature: (item) => item.feature,
  title: (item) => item.title,
  preconditions: (item) => item.preconditions,
  expectedResult: (item) => item.expectedResult,
  priority: (item) => item.priority,
  type: (item) => item.type,
  automation: (item) => item.automation,
  notes: (item) => item.notes,
};

export class TsvExportError extends Error {
  constructor(
    readonly code: "INVALID_COLUMNS" | "NO_CASES" | "DOWNLOAD_FAILED",
    message: string,
  ) {
    super(message);
    this.name = "TsvExportError";
  }
}

export function normalizeStructureBreakingCharacters(value: string) {
  return value.replace(/[ \t]*(?:\r\n|\r|\n|\t)+[ \t]*/g, " ");
}

export function protectSpreadsheetFormula(value: string) {
  return /^\s*[=+\-@]/u.test(value) ? `'${value}` : value;
}

export function serializeTsvCell(value: string | null) {
  if (value === null) return "-";
  return protectSpreadsheetFormula(normalizeStructureBreakingCharacters(value));
}

export function serializeSteps(steps: readonly string[]) {
  return steps
    .map(
      (step, index) =>
        `${index + 1}. ${normalizeStructureBreakingCharacters(step)}`,
    )
    .join(STEP_SEPARATOR);
}

function readValue(item: GeneratedTestCase, key: ExportColumnKey) {
  return key === "steps"
    ? serializeSteps(item.steps)
    : serializeTsvCell(valueReaders[key](item));
}

export function serializeTestCasesToTsv(
  cases: readonly GeneratedTestCase[],
  selectedColumns: readonly ExportColumnKey[],
) {
  const configuration = exportColumnConfigurationSchema.safeParse({
    selectedColumns,
  });
  if (!configuration.success)
    throw new TsvExportError(
      "INVALID_COLUMNS",
      "Select at least one column for export.",
    );
  if (cases.length === 0)
    throw new TsvExportError("NO_CASES", "No test cases available to export.");

  const columns = configuration.data.selectedColumns;
  const rows = [
    columns.map((key) => labels.get(key)!),
    ...cases.map((item) => columns.map((key) => readValue(item, key))),
  ];
  return rows.map((row) => row.join("\t")).join(TSV_ROW_SEPARATOR);
}

export function createTsvBlob(tsv: string) {
  return new Blob([UTF8_BOM, tsv], { type: TSV_MIME_TYPE });
}

export function triggerBrowserDownload(blob: Blob, filename: string) {
  let objectUrl: string | null = null;
  let anchor: HTMLAnchorElement | null = null;
  try {
    objectUrl = URL.createObjectURL(blob);
    anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.hidden = true;
    document.body.append(anchor);
    anchor.click();
  } catch {
    throw new TsvExportError("DOWNLOAD_FAILED", "Failed to export TSV.");
  } finally {
    anchor?.remove();
    if (objectUrl !== null) URL.revokeObjectURL(objectUrl);
  }
}

export function downloadTestCasesTsv(
  layer: ExportLayer,
  cases: readonly GeneratedTestCase[],
  selectedColumns: readonly ExportColumnKey[],
) {
  const tsv = serializeTestCasesToTsv(cases, selectedColumns);
  triggerBrowserDownload(createTsvBlob(tsv), exportFilenames[layer]);
}
