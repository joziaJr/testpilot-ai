"use client";

import { useState } from "react";
import type { GeneratedTestCases } from "@/lib/generation/generation-contract";
import type { TestingScope } from "@/lib/review/review-contract";

type PreviewLayer = "frontend" | "backend";
type GeneratedTestCase = GeneratedTestCases["frontend"][number];

export const testCaseColumns = [
  "Test Case ID",
  "Module",
  "Feature",
  "Title",
  "Preconditions",
  "Steps",
  "Expected Result",
  "Priority",
  "Type",
  "Automation",
  "Notes",
] as const;

function displayOptional(value: string | null) {
  return value ?? "-";
}

function TestCaseTable({
  cases,
  layer,
}: {
  cases: GeneratedTestCase[];
  layer: PreviewLayer;
}) {
  const label = layer === "frontend" ? "Frontend" : "Backend";
  if (!cases.length)
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-700">
        No {label} test cases were generated from the selected documented
        requirements.
      </p>
    );

  return (
    <div
      className="max-w-full overflow-x-auto rounded-xl border border-slate-300 bg-white"
      tabIndex={0}
      aria-label={`${label} test case table. Scroll horizontally to review all columns.`}
    >
      <table className="min-w-[1900px] border-collapse text-left text-sm">
        <caption className="sr-only">
          {label} generated test cases in stable generation order
        </caption>
        <thead className="bg-slate-100 text-slate-900">
          <tr>
            {testCaseColumns.map((column) => (
              <th
                key={column}
                scope="col"
                className="border-b border-r border-slate-300 px-4 py-3 font-semibold last:border-r-0"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="align-top text-slate-800">
          {cases.map((item) => (
            <tr key={item.testCaseId} className="border-b last:border-b-0">
              <td className="whitespace-nowrap border-r border-slate-200 px-4 py-4 font-mono font-semibold text-blue-800">
                {item.testCaseId}
              </td>
              <td className="min-w-40 border-r border-slate-200 px-4 py-4">
                {item.module}
              </td>
              <td className="min-w-40 border-r border-slate-200 px-4 py-4">
                {item.feature}
              </td>
              <td className="min-w-56 border-r border-slate-200 px-4 py-4 font-medium text-slate-950">
                {item.title}
              </td>
              <td className="min-w-56 border-r border-slate-200 px-4 py-4 whitespace-pre-wrap">
                {displayOptional(item.preconditions)}
              </td>
              <td className="min-w-72 border-r border-slate-200 px-4 py-4">
                <ol className="list-decimal space-y-2 pl-5">
                  {item.steps.map((step, index) => (
                    <li key={`${item.testCaseId}-step-${index}`}>{step}</li>
                  ))}
                </ol>
              </td>
              <td className="min-w-64 border-r border-slate-200 px-4 py-4 whitespace-pre-wrap">
                {item.expectedResult}
              </td>
              <td className="whitespace-nowrap border-r border-slate-200 px-4 py-4">
                {item.priority}
              </td>
              <td className="whitespace-nowrap border-r border-slate-200 px-4 py-4">
                {item.type}
              </td>
              <td className="whitespace-nowrap border-r border-slate-200 px-4 py-4">
                {displayOptional(item.automation)}
              </td>
              <td className="min-w-56 px-4 py-4 whitespace-pre-wrap">
                {displayOptional(item.notes)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LayerPanel({
  layer,
  cases,
}: {
  layer: PreviewLayer;
  cases: GeneratedTestCase[];
}) {
  const label = layer === "frontend" ? "Frontend" : "Backend";
  return (
    <div
      id={`test-case-panel-${layer}`}
      role="tabpanel"
      aria-labelledby={`test-case-tab-${layer}`}
      tabIndex={0}
      className="mt-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
    >
      <h4 className="sr-only">{label} test cases</h4>
      <TestCaseTable cases={cases} layer={layer} />
    </div>
  );
}

export function TestCasePreview({
  result,
  testingScope,
}: {
  result: GeneratedTestCases;
  testingScope: TestingScope;
}) {
  const layers: [PreviewLayer, ...PreviewLayer[]] =
    testingScope === "both" ? ["frontend", "backend"] : [testingScope];
  const [selectedLayer, setSelectedLayer] = useState<PreviewLayer>(layers[0]);
  const activeLayer = layers.includes(selectedLayer)
    ? selectedLayer
    : layers[0];

  function selectAndFocus(layer: PreviewLayer) {
    setSelectedLayer(layer);
    window.requestAnimationFrame(() => {
      document.getElementById(`test-case-tab-${layer}`)?.focus();
    });
  }

  return (
    <section
      aria-labelledby="generated-test-cases-title"
      className="mt-6 min-w-0 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm"
    >
      <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
        M6 preview
      </p>
      <h3
        id="generated-test-cases-title"
        className="mt-2 text-2xl font-semibold tracking-tight text-slate-950"
      >
        Generated Test Cases
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Review the validated generated cases below. Preview does not edit,
        delete, regenerate, or export test cases.
      </p>

      {testingScope === "both" ? (
        <>
          <div
            role="tablist"
            aria-label="Generated test case layers"
            className="mt-5 flex flex-wrap gap-2 border-b border-slate-200"
          >
            {layers.map((layer) => {
              const label = layer === "frontend" ? "Frontend" : "Backend";
              const selected = activeLayer === layer;
              return (
                <button
                  key={layer}
                  id={`test-case-tab-${layer}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`test-case-panel-${layer}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setSelectedLayer(layer)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "ArrowLeft" ||
                      event.key === "ArrowRight" ||
                      event.key === "Home" ||
                      event.key === "End"
                    ) {
                      event.preventDefault();
                      selectAndFocus(
                        event.key === "Home"
                          ? layers[0]
                          : event.key === "End"
                            ? layers[layers.length - 1]
                            : layer === "frontend"
                              ? "backend"
                              : "frontend",
                      );
                    }
                  }}
                  className={`rounded-t-lg border border-b-0 px-4 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${selected ? "border-slate-300 bg-white text-blue-800" : "border-transparent bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                >
                  {label} ({result[layer].length})
                </button>
              );
            })}
          </div>
          <LayerPanel layer={activeLayer} cases={result[activeLayer]} />
        </>
      ) : (
        <div className="mt-5">
          <h4 className="mb-3 text-lg font-semibold text-slate-950">
            {activeLayer === "frontend" ? "Frontend" : "Backend"} (
            {result[activeLayer].length})
          </h4>
          <TestCaseTable cases={result[activeLayer]} layer={activeLayer} />
        </div>
      )}
    </section>
  );
}
