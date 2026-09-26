"use client";

import { useEffect, useState } from "react";
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

export function ExportColumnSelection() {
  const [selectedColumns, setSelectedColumns] = useState<ExportColumnKey[]>(
    () => createDefaultExportColumnConfiguration().selectedColumns,
  );
  const [hydrated, setHydrated] = useState(false);
  const valid = selectedColumns.length > 0;

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

  return (
    <section
      aria-labelledby="export-configuration-title"
      className="mt-6 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm"
    >
      <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
        M8 export preparation
      </p>
      <h3
        id="export-configuration-title"
        className="mt-2 text-2xl font-semibold tracking-tight text-slate-950"
      >
        Export Configuration
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Choose columns for future FE and BE exports. Columns always retain the
        approved schema order. M8 does not create or download a file.
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
          Configuration is valid for future M9 export.
        </p>
      )}
    </section>
  );
}
