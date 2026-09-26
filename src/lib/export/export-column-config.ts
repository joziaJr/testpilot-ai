import { z } from "zod";

export const EXPORT_COLUMN_SESSION_KEY = "testpilot.export-columns.v1";

export const exportColumns = [
  { key: "testCaseId", label: "Test Case ID" },
  { key: "module", label: "Module" },
  { key: "feature", label: "Feature" },
  { key: "title", label: "Title" },
  { key: "preconditions", label: "Preconditions" },
  { key: "steps", label: "Steps" },
  { key: "expectedResult", label: "Expected Result" },
  { key: "priority", label: "Priority" },
  { key: "type", label: "Type" },
  { key: "automation", label: "Automation" },
  { key: "notes", label: "Notes" },
] as const;

export const exportColumnKeys = exportColumns.map((column) => column.key) as [
  (typeof exportColumns)[number]["key"],
  ...(typeof exportColumns)[number]["key"][],
];

export type ExportColumnKey = (typeof exportColumns)[number]["key"];

export const defaultSelectedColumns: ExportColumnKey[] = exportColumnKeys.slice(
  0,
  9,
);

const exportColumnKeySchema = z.enum(exportColumnKeys);
const canonicalIndex = new Map(
  exportColumnKeys.map((key, index) => [key, index]),
);

export const exportColumnConfigurationSchema = z
  .object({
    selectedColumns: z
      .array(exportColumnKeySchema)
      .min(1, "Select at least one column for export.")
      .max(exportColumnKeys.length)
      .refine((items) => new Set(items).size === items.length, {
        message: "Export columns must be unique.",
      })
      .refine(
        (items) =>
          items.every(
            (item, index) =>
              index === 0 ||
              canonicalIndex.get(items[index - 1])! < canonicalIndex.get(item)!,
          ),
        { message: "Export columns must use canonical schema order." },
      ),
  })
  .strict();

export type ExportColumnConfiguration = z.infer<
  typeof exportColumnConfigurationSchema
>;

export function createDefaultExportColumnConfiguration(): ExportColumnConfiguration {
  return { selectedColumns: [...defaultSelectedColumns] };
}

export function setExportColumnSelected(
  selectedColumns: ExportColumnKey[],
  key: ExportColumnKey,
  selected: boolean,
) {
  const selectedKeys = new Set(selectedColumns);
  if (selected) selectedKeys.add(key);
  else selectedKeys.delete(key);
  return exportColumnKeys.filter((columnKey) => selectedKeys.has(columnKey));
}

export function parsePersistedExportColumnConfiguration(raw: string | null) {
  if (!raw) return createDefaultExportColumnConfiguration();
  try {
    const parsed = exportColumnConfigurationSchema.safeParse(JSON.parse(raw));
    return parsed.success
      ? parsed.data
      : createDefaultExportColumnConfiguration();
  } catch {
    return createDefaultExportColumnConfiguration();
  }
}
