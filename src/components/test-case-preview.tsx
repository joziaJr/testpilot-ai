"use client";

import { useEffect, useRef, useState } from "react";
import type {
  GeneratedTestCases,
  GenerationLayer,
} from "@/lib/generation/generation-contract";
import {
  deleteGeneratedTestCase,
  editGeneratedTestCase,
  editableGeneratedTestCaseSchema,
  type EditableGeneratedTestCase,
} from "../lib/generation/generation-mutations";
import type { TestingScope } from "@/lib/review/review-contract";

type PreviewLayer = GenerationLayer;
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
function optionalValue(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function EditTestCasePanel({
  item,
  onCancel,
  onSave,
}: {
  item: GeneratedTestCase;
  onCancel: () => void;
  onSave: (fields: EditableGeneratedTestCase) => string | null;
}) {
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(item.title);
  const [preconditions, setPreconditions] = useState(item.preconditions ?? "");
  const [steps, setSteps] = useState(item.steps);
  const [expectedResult, setExpectedResult] = useState(item.expectedResult);
  const [priority, setPriority] = useState(item.priority);
  const [type, setType] = useState(item.type);
  const [automation, setAutomation] = useState<string>(item.automation ?? "");
  const [notes, setNotes] = useState(item.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => titleRef.current?.focus(), []);

  function save() {
    const fields = {
      module: item.module,
      feature: item.feature,
      title,
      preconditions: optionalValue(preconditions),
      steps,
      expectedResult,
      priority,
      type,
      automation: automation || null,
      notes: optionalValue(notes),
    };
    const parsed = editableGeneratedTestCaseSchema.safeParse(fields);
    if (!parsed.success) {
      const field = parsed.error.issues[0]?.path[0];
      setError(
        field === "steps"
          ? "Every step must contain text, and at least one step is required."
          : `${field === "expectedResult" ? "Expected Result" : String(field ?? "Field")} is required.`,
      );
      return;
    }
    const mutationError = onSave(parsed.data);
    if (mutationError) setError(mutationError);
  }

  const fieldClass =
    "mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 font-normal";
  return (
    <section
      aria-labelledby={`edit-${item.testCaseId}-title`}
      className="mt-4 rounded-xl border border-blue-300 bg-blue-50 p-5"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">
        Manual edit · ID, Module, Feature, and source references are read-only
      </p>
      <h4
        id={`edit-${item.testCaseId}-title`}
        className="mt-1 text-lg font-semibold text-slate-950"
      >
        Edit {item.testCaseId}
      </h4>
      {error && (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold text-slate-800">
          Module (source-linked, read-only)
          <input
            value={item.module}
            readOnly
            maxLength={4000}
            className={fieldClass}
          />
        </label>
        <label className="text-sm font-semibold text-slate-800">
          Feature (source-linked, read-only)
          <input
            value={item.feature}
            readOnly
            maxLength={4000}
            className={fieldClass}
          />
        </label>
        <label className="text-sm font-semibold text-slate-800 md:col-span-2">
          Title
          <input
            ref={titleRef}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={4000}
            className={fieldClass}
          />
        </label>
        <label className="text-sm font-semibold text-slate-800 md:col-span-2">
          Preconditions (optional)
          <textarea
            value={preconditions}
            onChange={(event) => setPreconditions(event.target.value)}
            maxLength={4000}
            rows={3}
            className={fieldClass}
          />
        </label>
        <fieldset className="md:col-span-2">
          <legend className="text-sm font-semibold text-slate-800">
            Steps
          </legend>
          <div className="mt-1 space-y-2">
            {steps.map((step, index) => (
              <div
                key={`${item.testCaseId}-edit-step-${index}`}
                className="flex gap-2"
              >
                <textarea
                  aria-label={`Step ${index + 1}`}
                  value={step}
                  onChange={(event) =>
                    setSteps((current) =>
                      current.map((value, itemIndex) =>
                        itemIndex === index ? event.target.value : value,
                      ),
                    )
                  }
                  maxLength={4000}
                  rows={2}
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white p-2"
                />
                <button
                  type="button"
                  disabled={steps.length === 1}
                  onClick={() =>
                    setSteps((current) =>
                      current.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                  className="self-start rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  Remove step {index + 1}
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            disabled={steps.length >= 50}
            onClick={() => setSteps((current) => [...current, ""])}
            className="mt-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Add step
          </button>
        </fieldset>
        <label className="text-sm font-semibold text-slate-800 md:col-span-2">
          Expected Result
          <textarea
            value={expectedResult}
            onChange={(event) => setExpectedResult(event.target.value)}
            maxLength={4000}
            rows={3}
            className={fieldClass}
          />
        </label>
        <label className="text-sm font-semibold text-slate-800">
          Priority
          <select
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value as typeof priority)
            }
            className={fieldClass}
          >
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-800">
          Type
          <select
            value={type}
            onChange={(event) => setType(event.target.value as typeof type)}
            className={fieldClass}
          >
            <option>Positive</option>
            <option>Negative</option>
            <option>Edge</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-800">
          Automation (optional)
          <select
            value={automation}
            onChange={(event) => setAutomation(event.target.value)}
            className={fieldClass}
          >
            <option value="">Not set</option>
            <option>Yes</option>
            <option>No</option>
            <option>Candidate</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-800">
          Notes (optional)
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={4000}
            rows={3}
            className={fieldClass}
          />
        </label>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={save}
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          Save changes
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </section>
  );
}

function TestCaseTable({
  cases,
  layer,
  onEdit,
  onDelete,
}: {
  cases: GeneratedTestCase[];
  layer: PreviewLayer;
  onEdit: (item: GeneratedTestCase) => void;
  onDelete: (item: GeneratedTestCase) => void;
}) {
  const label = layer === "frontend" ? "Frontend" : "Backend";
  if (!cases.length)
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-700">
        No {label} test cases were generated from the selected documented
        requirements. All generated cases may also have been deleted from this
        session.
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
                <div className="mt-3 flex gap-2 font-sans">
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="rounded border border-blue-300 px-2 py-1 text-xs font-semibold text-blue-800"
                  >
                    Edit {item.testCaseId}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item)}
                    className="rounded border border-red-300 px-2 py-1 text-xs font-semibold text-red-800"
                  >
                    Delete {item.testCaseId}
                  </button>
                </div>
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

export function TestCasePreview({
  result,
  testingScope,
  onResultChange,
}: {
  result: GeneratedTestCases;
  testingScope: TestingScope;
  onResultChange: (result: GeneratedTestCases) => void;
}) {
  const layers: [PreviewLayer, ...PreviewLayer[]] =
    testingScope === "both" ? ["frontend", "backend"] : [testingScope];
  const [selectedLayer, setSelectedLayer] = useState<PreviewLayer>(layers[0]);
  const [editing, setEditing] = useState<{
    layer: PreviewLayer;
    item: GeneratedTestCase;
  } | null>(null);
  const activeLayer = layers.includes(selectedLayer)
    ? selectedLayer
    : layers[0];

  function selectAndFocus(layer: PreviewLayer) {
    setEditing(null);
    setSelectedLayer(layer);
    window.requestAnimationFrame(() =>
      document.getElementById(`test-case-tab-${layer}`)?.focus(),
    );
  }
  function saveEdit(fields: EditableGeneratedTestCase) {
    if (!editing) return "The test case is no longer available.";
    const outcome = editGeneratedTestCase(
      result,
      editing.layer,
      editing.item.testCaseId,
      fields,
    );
    if (!outcome.success) return outcome.message;
    onResultChange(outcome.result);
    setEditing(null);
    return null;
  }
  function deleteCase(layer: PreviewLayer, item: GeneratedTestCase) {
    if (
      !window.confirm(
        `Delete ${item.testCaseId}? This cannot be undone in this session.`,
      )
    )
      return;
    const outcome = deleteGeneratedTestCase(result, layer, item.testCaseId);
    if (outcome.success) {
      onResultChange(outcome.result);
      if (editing?.item.testCaseId === item.testCaseId) setEditing(null);
    }
  }
  const table = (layer: PreviewLayer) => (
    <TestCaseTable
      cases={result[layer]}
      layer={layer}
      onEdit={(item) => setEditing({ layer, item })}
      onDelete={(item) => deleteCase(layer, item)}
    />
  );

  return (
    <section
      aria-labelledby="generated-test-cases-title"
      className="mt-6 min-w-0 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm"
    >
      <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
        M7 manual review
      </p>
      <h3
        id="generated-test-cases-title"
        className="mt-2 text-2xl font-semibold tracking-tight text-slate-950"
      >
        Generated Test Cases
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Review, edit, or delete session-scoped cases. These actions do not call
        AI, regenerate cases, or renumber stable IDs.
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
                  onClick={() => {
                    setEditing(null);
                    setSelectedLayer(layer);
                  }}
                  onKeyDown={(event) => {
                    if (
                      ["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                        event.key,
                      )
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
          <div
            id={`test-case-panel-${activeLayer}`}
            role="tabpanel"
            aria-labelledby={`test-case-tab-${activeLayer}`}
            tabIndex={0}
            className="mt-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
          >
            {table(activeLayer)}
          </div>
        </>
      ) : (
        <div className="mt-5">
          <h4 className="mb-3 text-lg font-semibold text-slate-950">
            {activeLayer === "frontend" ? "Frontend" : "Backend"} (
            {result[activeLayer].length})
          </h4>
          {table(activeLayer)}
        </div>
      )}
      {editing && editing.layer === activeLayer && (
        <EditTestCasePanel
          key={`${editing.layer}-${editing.item.testCaseId}`}
          item={editing.item}
          onCancel={() => setEditing(null)}
          onSave={saveEdit}
        />
      )}
    </section>
  );
}
