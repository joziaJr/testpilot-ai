"use client";

import { useEffect, useState } from "react";
import type { GeneratedTestCases } from "../lib/generation/generation-contract";
import type { TestingScope } from "../lib/review/review-contract";
import {
  createDefaultExportColumnConfiguration,
  EXPORT_COLUMN_SESSION_KEY,
  exportColumnConfigurationSchema,
  exportColumnKeys,
  exportColumns,
  parsePersistedExportColumnConfiguration,
  setExportColumnSelected,
  type ExportColumnKey,
} from "../lib/export/export-column-config";
import {
  downloadTestCasesTsv,
  type ExportLayer,
} from "../lib/export/tsv-export";

export function ExportColumnSelection({
  result,
  testingScope,
}: {
  result: GeneratedTestCases;
  testingScope: TestingScope;
}) {
  const [selectedColumns, setSelectedColumns] = useState<ExportColumnKey[]>(
    () => createDefaultExportColumnConfiguration().selectedColumns,
  );
  const [hydrated, setHydrated] = useState(false);
  const [exportMessage, setExportMessage] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);
  const valid = selectedColumns.length > 0;
  const layers: ExportLayer[] =
    testingScope === "both" ? ["frontend", "backend"] : [testingScope];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSelectedColumns(
        parsePersistedExportColumnConfiguration(
          sessionStorage.getItem(EXPORT_COLUMN_SESSION_KEY),
        ).selectedColumns,
      );
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const configuration = exportColumnConfigurationSchema.safeParse({
      selectedColumns,
    });
    if (configuration.success)
      sessionStorage.setItem(
        EXPORT_COLUMN_SESSION_KEY,
        JSON.stringify(configuration.data),
      );
    else sessionStorage.removeItem(EXPORT_COLUMN_SESSION_KEY);
  }, [hydrated, selectedColumns]);

  function download(layer: ExportLayer) {
    setExportMessage(null);
    if (!valid) return;
    if (result[layer].length === 0) {
      setExportMessage({
        kind: "error",
        text: "No test cases available to export.",
      });
      return;
    }
    try {
      downloadTestCasesTsv(layer, result[layer], selectedColumns);
      setExportMessage({
        kind: "success",
        text: `${layer === "frontend" ? "Frontend" : "Backend"} TSV download started.`,
      });
    } catch {
      setExportMessage({ kind: "error", text: "Failed to export TSV." });
    }
  }

  return (
    <section
      aria-labelledby="export-configuration-title"
      className="mt-6 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm"
    >
      <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
        M9 TSV export
      </p>
      <h3
        id="export-configuration-title"
        className="mt-2 text-2xl font-semibold tracking-tight text-slate-950"
      >
        Export Configuration
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Choose columns and download the current saved FE or BE cases. Columns
        always retain the approved schema order.
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold text-slate-900" role="status">
          {selectedColumns.length} of {exportColumns.length} columns selected
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedColumns([...exportColumnKeys])}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={() => setSelectedColumns([])}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Clear All
          </button>
        </div>
      </div>

      {!valid && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm font-medium text-amber-950"
        >
          Select at least one column for export.
        </p>
      )}

      <fieldset className="mt-4">
        <legend className="sr-only">Available export columns</legend>
        <ol className="grid gap-2 sm:grid-cols-2">
          {exportColumns.map((column, index) => {
            const selected = selectedColumns.includes(column.key);
            return (
              <li
                key={column.key}
                className={`rounded-xl border p-3 ${selected ? "border-blue-300 bg-blue-50" : "border-slate-300 bg-slate-50"}`}
              >
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    aria-label={column.label}
                    checked={selected}
                    onChange={(event) =>
                      setSelectedColumns((current) =>
                        setExportColumnSelected(
                          current,
                          column.key,
                          event.target.checked,
                        ),
                      )
                    }
                    className="mt-0.5 size-5 accent-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  />
                  <span>
                    <span className="block font-semibold text-slate-950">
                      {column.label}
                    </span>
                    <span className="block text-xs text-slate-600">
                      Canonical position {index + 1} ·{" "}
                      {selected ? "Selected" : "Not selected"}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ol>
      </fieldset>

      {valid && (
        <p className="mt-4 text-sm text-emerald-800">
          Configuration is valid for TSV export.
        </p>
      )}

      <div className="mt-5 border-t border-slate-200 pt-5">
        <h4 className="text-lg font-semibold text-slate-950">Export TSV</h4>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          {selectedColumns.length} columns selected. Frontend and Backend are
          always downloaded as separate files.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          {layers.map((layer) => {
            const label = layer === "frontend" ? "Frontend" : "Backend";
            const empty = result[layer].length === 0;
            return (
              <div key={layer} className="flex flex-col items-start gap-2">
                <button
                  type="button"
                  disabled={!hydrated || !valid || empty}
                  onClick={() => download(layer)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  Download {label} TSV
                </button>
                {empty && (
                  <p className="text-sm text-slate-600">
                    No test cases available to export.
                  </p>
                )}
              </div>
            );
          })}
        </div>
        {exportMessage && (
          <p
            role={exportMessage.kind === "error" ? "alert" : "status"}
            className={`mt-3 text-sm font-medium ${exportMessage.kind === "error" ? "text-red-700" : "text-emerald-800"}`}
          >
            {exportMessage.text}
          </p>
        )}
      </div>
    </section>
  );
}
