import { describe, expect, it } from "vitest";
import {
  createDefaultExportColumnConfiguration,
  defaultSelectedColumns,
  exportColumnConfigurationSchema,
  exportColumnKeys,
  parsePersistedExportColumnConfiguration,
  setExportColumnSelected,
} from "./export-column-config";

describe("export column configuration", () => {
  it("uses the approved eleven-column allowlist and first-nine default", () => {
    expect(exportColumnKeys).toEqual([
      "testCaseId",
      "module",
      "feature",
      "title",
      "preconditions",
      "steps",
      "expectedResult",
      "priority",
      "type",
      "automation",
      "notes",
    ]);
    expect(createDefaultExportColumnConfiguration()).toEqual({
      selectedColumns: exportColumnKeys.slice(0, 9),
    });
    expect(defaultSelectedColumns).not.toContain("automation");
    expect(defaultSelectedColumns).not.toContain("notes");
  });

  it("deselects and reselects only in canonical schema order", () => {
    const withoutFeature = setExportColumnSelected(
      defaultSelectedColumns,
      "feature",
      false,
    );
    expect(withoutFeature).not.toContain("feature");
    expect(setExportColumnSelected(withoutFeature, "feature", true)).toEqual(
      defaultSelectedColumns,
    );
    expect(
      setExportColumnSelected(defaultSelectedColumns, "notes", true),
    ).toEqual([...defaultSelectedColumns, "notes"]);
  });

  it("rejects empty, unknown, duplicate, and reordered configurations", () => {
    expect(
      exportColumnConfigurationSchema.safeParse({ selectedColumns: [] })
        .success,
    ).toBe(false);
    expect(
      exportColumnConfigurationSchema.safeParse({
        selectedColumns: ["testCaseId", "unknown"],
      }).success,
    ).toBe(false);
    expect(
      exportColumnConfigurationSchema.safeParse({
        selectedColumns: ["title", "title"],
      }).success,
    ).toBe(false);
    expect(
      exportColumnConfigurationSchema.safeParse({
        selectedColumns: ["title", "module"],
      }).success,
    ).toBe(false);
    expect(
      exportColumnConfigurationSchema.safeParse({
        selectedColumns: ["title"],
        internalSourceId: "hidden",
      }).success,
    ).toBe(false);
  });

  it("restores valid active-session state and safely defaults malformed state", () => {
    expect(
      parsePersistedExportColumnConfiguration(
        JSON.stringify({ selectedColumns: ["title", "steps", "notes"] }),
      ),
    ).toEqual({ selectedColumns: ["title", "steps", "notes"] });
    for (const raw of [
      null,
      "not json",
      JSON.stringify({ selectedColumns: [] }),
      JSON.stringify({ selectedColumns: ["notes", "title"] }),
      JSON.stringify({ selectedColumns: ["privateSourceId"] }),
    ])
      expect(parsePersistedExportColumnConfiguration(raw)).toEqual(
        createDefaultExportColumnConfiguration(),
      );
  });
});
