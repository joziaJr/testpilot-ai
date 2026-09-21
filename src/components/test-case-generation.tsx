"use client";

import { useEffect, useRef, useState } from "react";
import type { PrdAnalysis } from "@/lib/analysis/analysis-contract";
import {
  generationErrorMessages,
  type GenerationErrorCode,
} from "@/lib/generation/generation-errors";
import {
  GENERATION_SESSION_KEY,
  parsePersistedGenerationResult,
} from "@/lib/generation/generation-session";
import {
  generationResultSchema,
  selectionFingerprint,
  type GeneratedTestCaseRecord,
  type GenerationResult,
} from "@/lib/generation/test-case-contract";
import type { ReviewedSelection } from "@/lib/review/review-contract";

type GenerationState =
  | { status: "ready" }
  | { status: "generating" }
  | { status: "success"; result: GenerationResult }
  | { status: "failed"; code: GenerationErrorCode; message: string };

function CaseCollection({
  title,
  cases,
}: {
  title: string;
  cases: GeneratedTestCaseRecord[];
}) {
  if (!cases.length) return null;
  return (
    <section aria-labelledby={`${title.toLowerCase()}-cases-title`}>
      <h4
        id={`${title.toLowerCase()}-cases-title`}
        className="text-lg font-semibold text-slate-950"
      >
        {title} Test Cases ({cases.length})
      </h4>
      <div className="mt-3 space-y-3">
        {cases.map(({ testCase, traceability }) => (
          <article
            key={testCase.testCaseId}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="rounded-full bg-slate-900 px-2 py-1 text-white">
                {testCase.testCaseId}
              </span>
              <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-900">
                {testCase.type}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">
                {testCase.priority}
              </span>
            </div>
            <h5 className="mt-3 font-semibold text-slate-950">
              {testCase.title}
            </h5>
            <p className="mt-1 text-sm text-slate-600">
              {testCase.module} / {testCase.feature}
            </p>
            {testCase.preconditions && (
              <p className="mt-3 text-sm text-slate-700">
                <strong>Preconditions:</strong> {testCase.preconditions}
              </p>
            )}
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-700">
              {testCase.steps.map((step, index) => (
                <li key={`${testCase.testCaseId}-step-${index}`}>{step}</li>
              ))}
            </ol>
            <p className="mt-3 text-sm text-slate-800">
              <strong>Expected Result:</strong> {testCase.expectedResult}
            </p>
            {testCase.notes && (
              <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-950">
                <strong>Notes:</strong> {testCase.notes}
              </p>
            )}
            <details className="mt-3 text-sm text-slate-600">
              <summary className="cursor-pointer font-semibold">
                Internal grounding references
              </summary>
              <p className="mt-2 break-words">
                Requirements: {traceability.requirementIds.join(", ")}
              </p>
            </details>
          </article>
        ))}
      </div>
    </section>
  );
}

export function TestCaseGeneration({
  analysis,
  selection,
}: {
  analysis: PrdAnalysis;
  selection: ReviewedSelection;
}) {
  const [state, setState] = useState<GenerationState>({ status: "ready" });
  const request = useRef<AbortController | null>(null);
  const revision = useRef(0);
  const fingerprint = selectionFingerprint(selection);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const restored = parsePersistedGenerationResult(
        sessionStorage.getItem(GENERATION_SESSION_KEY),
      );
      if (
        restored?.analysisId === selection.analysisId &&
        restored.selectionFingerprint === fingerprint
      )
        setState({ status: "success", result: restored });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fingerprint, selection.analysisId]);

  useEffect(
    () => () => {
      revision.current++;
      request.current?.abort();
    },
    [],
  );

  async function generate() {
    revision.current++;
    request.current?.abort();
    sessionStorage.removeItem(GENERATION_SESSION_KEY);
    const id = revision.current;
    const controller = new AbortController();
    request.current = controller;
    setState({ status: "generating" });
    const timeout = window.setTimeout(() => controller.abort(), 130_000);
    try {
      const response = await fetch("/api/test-cases/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis, selection }),
        signal: controller.signal,
      });
      const body = await response.json();
      if (id !== revision.current) return;
      if (response.ok && body.generation?.status === "success") {
        const parsed = generationResultSchema.safeParse(body.generation.result);
        if (
          !parsed.success ||
          parsed.data.analysisId !== selection.analysisId ||
          parsed.data.selectionFingerprint !== fingerprint
        )
          throw new Error("Invalid generation response");
        sessionStorage.setItem(
          GENERATION_SESSION_KEY,
          JSON.stringify(parsed.data),
        );
        setState({ status: "success", result: parsed.data });
        return;
      }
      const code = body.generation?.error?.code as GenerationErrorCode;
      if (
        body.generation?.status !== "failed" ||
        !Object.hasOwn(generationErrorMessages, code)
      )
        throw new Error("Invalid generation failure");
      setState({
        status: "failed",
        code,
        message: generationErrorMessages[code],
      });
    } catch {
      if (id === revision.current)
        setState({
          status: "failed",
          code: "GENERATION_FAILED",
          message: generationErrorMessages.GENERATION_FAILED,
        });
    } finally {
      window.clearTimeout(timeout);
    }
  }

  return (
    <section
      aria-labelledby="generation-title"
      className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5"
    >
      <h3
        id="generation-title"
        className="text-xl font-semibold text-slate-950"
      >
        Generate Test Cases
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-700">
        Generation uses only this confirmed selection. It starts only when you
        choose the button below.
      </p>
      <button
        type="button"
        disabled={state.status === "generating"}
        onClick={() => void generate()}
        className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        {state.status === "generating"
          ? "Generating…"
          : state.status === "failed"
            ? "Retry generation"
            : "Generate Test Cases"}
      </button>
      {state.status === "generating" && (
        <p className="mt-3 text-sm text-slate-600" role="status">
          Generation: IN PROGRESS
        </p>
      )}
      {state.status === "failed" && (
        <p
          className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          role="alert"
        >
          Generation: FAILED — {state.message}
        </p>
      )}
      {state.status === "success" && (
        <div className="mt-5">
          <p className="font-semibold text-emerald-800" role="status">
            Generation: COMPLETE · {state.result.frontend.length} frontend ·{" "}
            {state.result.backend.length} backend
          </p>
          <div className="mt-5 grid gap-6 xl:grid-cols-2">
            <CaseCollection title="Frontend" cases={state.result.frontend} />
            <CaseCollection title="Backend" cases={state.result.backend} />
          </div>
          <p className="mt-5 text-sm text-slate-600">
            This is the M5 structured result. Editing, deletion, and the full
            preview workflow begin in a later milestone.
          </p>
        </div>
      )}
    </section>
  );
}
