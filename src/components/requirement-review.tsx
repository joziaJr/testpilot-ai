"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TestCasePreview } from "@/components/test-case-preview";
import type { PrdAnalysis } from "@/lib/analysis/analysis-contract";
import {
  generatedTestCasesSchema,
  type GeneratedTestCases,
} from "@/lib/generation/generation-contract";
import {
  GENERATION_SESSION_KEY,
  parsePersistedGeneration,
} from "@/lib/generation/generation-session";
import {
  generationErrorMessages,
  type GenerationErrorCode,
} from "@/lib/generation/generation-errors";
import {
  buildReviewedSelection,
  canConfirmReview,
  confirmReviewSelection,
  createReviewSelectionState,
  getModuleSelectionStatus,
  getUnmappedAnalysisIds,
  setTestingScope,
  toggleFeatureSelection,
  toggleModuleSelection,
  validateReviewSelection,
  type ModuleSelectionStatus,
  type ReviewSelectionState,
  type TestingScope,
} from "@/lib/review/review-contract";
import {
  parsePersistedReviewSelection,
  REVIEW_SELECTION_SESSION_KEY,
} from "@/lib/review/review-session";

type Evidence = { excerpt: string; section: string | null };
type GenerationState =
  | { status: "idle" }
  | { status: "generating" }
  | { status: "success"; result: GeneratedTestCases }
  | { status: "failed"; message: string };

function selectionKey(state: ReviewSelectionState) {
  return JSON.stringify({
    analysisId: state.analysisId,
    selectedModuleIds: state.selectedModuleIds,
    selectedFeatureIds: state.selectedFeatureIds,
    testingScope: state.testingScope,
    confirmed: state.confirmed,
  });
}

function EvidencePanel({ evidence }: { evidence: Evidence }) {
  return (
    <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <summary className="cursor-pointer text-sm font-semibold text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
        Why did TestPilot identify this?
      </summary>
      {evidence.section && (
        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Section: {evidence.section}
        </p>
      )}
      <blockquote className="mt-2 border-l-2 border-blue-300 pl-3 text-sm leading-6 text-slate-700">
        {evidence.excerpt}
      </blockquote>
    </details>
  );
}

function ReviewItem({
  kind,
  title,
  detail,
  evidence,
  children,
}: {
  kind:
    | "Requirement"
    | "Business Rule"
    | "Validation"
    | "Ambiguity"
    | "Need Confirmation";
  title: string;
  detail?: string | null;
  evidence: Evidence;
  children?: React.ReactNode;
}) {
  const warning = kind === "Ambiguity" || kind === "Need Confirmation";
  return (
    <li
      className={`rounded-xl border p-4 ${warning ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"}`}
    >
      <span
        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${warning ? "bg-amber-200 text-amber-950" : "bg-blue-100 text-blue-900"}`}
      >
        {kind}
      </span>
      <p className="mt-2 font-medium leading-6 text-slate-950">{title}</p>
      {detail && (
        <p className="mt-1 text-sm leading-6 text-slate-700">{detail}</p>
      )}
      {children}
      <EvidencePanel evidence={evidence} />
    </li>
  );
}

function ModuleCheckbox({
  id,
  name,
  status,
  onChange,
}: {
  id: string;
  name: string;
  status: ModuleSelectionStatus;
  onChange: (checked: boolean) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = status === "partial";
  }, [status]);
  return (
    <div className="flex min-w-0 items-center gap-3">
      <input
        ref={ref}
        id={id}
        type="checkbox"
        checked={status === "all"}
        aria-label={`Select module ${name}`}
        onChange={(event) => onChange(event.target.checked)}
        className="size-5 shrink-0 accent-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      />
      <label htmlFor={id} className="truncate font-semibold text-slate-950">
        {name}
      </label>
    </div>
  );
}

function ContextItems({
  analysis,
  requirementIds,
}: {
  analysis: PrdAnalysis;
  requirementIds: Set<string>;
}) {
  const requirements = analysis.requirements.filter((item) =>
    requirementIds.has(item.id),
  );
  const businessRules = analysis.businessRules.filter((item) =>
    item.requirementIds.some((id) => requirementIds.has(id)),
  );
  const validations = analysis.validations.filter((item) =>
    item.requirementIds.some((id) => requirementIds.has(id)),
  );
  const ambiguities = analysis.ambiguities.filter(
    (item) =>
      item.requirementId !== null && requirementIds.has(item.requirementId),
  );
  const ambiguityIds = new Set(ambiguities.map((item) => item.id));
  const confirmations = analysis.needConfirmation.filter((item) =>
    ambiguityIds.has(item.ambiguityId),
  );

  if (
    !requirements.length &&
    !businessRules.length &&
    !validations.length &&
    !ambiguities.length &&
    !confirmations.length
  )
    return (
      <p className="mt-3 text-sm text-slate-600">
        No directly linked supporting analysis was returned.
      </p>
    );

  return (
    <ul className="mt-4 space-y-3">
      {requirements.map((item) => (
        <ReviewItem
          key={item.id}
          kind="Requirement"
          title={item.statement}
          evidence={item.evidence}
        />
      ))}
      {businessRules.map((item) => (
        <ReviewItem
          key={item.id}
          kind="Business Rule"
          title={item.rule}
          detail={`Linked requirements: ${item.requirementIds.join(", ")}`}
          evidence={item.evidence}
        />
      ))}
      {validations.map((item) => (
        <ReviewItem
          key={item.id}
          kind="Validation"
          title={item.validation}
          detail={`Linked requirements: ${item.requirementIds.join(", ")}`}
          evidence={item.evidence}
        />
      ))}
      {ambiguities.map((item) => (
        <ReviewItem
          key={item.id}
          kind="Ambiguity"
          title={item.sourceText}
          detail={item.reason}
          evidence={item.evidence}
        />
      ))}
      {confirmations.map((item) => (
        <ReviewItem
          key={item.id}
          kind="Need Confirmation"
          title={item.requirement}
          detail={item.reason}
          evidence={item.evidence}
        >
          <p className="mt-2 text-sm text-amber-950">
            Linked ambiguity: {item.ambiguityId}
          </p>
          <p className="mt-2 text-sm text-amber-950">
            Missing details: {item.missingDetails.join("; ")}
          </p>
        </ReviewItem>
      ))}
    </ul>
  );
}

function UnmappedAnalysis({ analysis }: { analysis: PrdAnalysis }) {
  const ids = new Set(getUnmappedAnalysisIds(analysis));
  if (!ids.size) return null;
  return (
    <section
      aria-labelledby="unmapped-analysis-title"
      className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5"
    >
      <h3 id="unmapped-analysis-title" className="text-lg font-semibold">
        General / Unmapped Analysis
      </h3>
      <p className="mt-2 text-sm leading-6 text-amber-950">
        These items have no safe module or feature relationship. They remain
        visible without an invented parent.
      </p>
      <ul className="mt-4 space-y-3">
        {analysis.requirements
          .filter((item) => ids.has(item.id))
          .map((item) => (
            <ReviewItem
              key={item.id}
              kind="Requirement"
              title={item.statement}
              evidence={item.evidence}
            />
          ))}
        {analysis.businessRules
          .filter((item) => ids.has(item.id))
          .map((item) => (
            <ReviewItem
              key={item.id}
              kind="Business Rule"
              title={item.rule}
              evidence={item.evidence}
            />
          ))}
        {analysis.validations
          .filter((item) => ids.has(item.id))
          .map((item) => (
            <ReviewItem
              key={item.id}
              kind="Validation"
              title={item.validation}
              evidence={item.evidence}
            />
          ))}
        {analysis.ambiguities
          .filter((item) => ids.has(item.id))
          .map((item) => (
            <ReviewItem
              key={item.id}
              kind="Ambiguity"
              title={item.sourceText}
              detail={item.reason}
              evidence={item.evidence}
            />
          ))}
        {analysis.needConfirmation
          .filter((item) => ids.has(item.id))
          .map((item) => (
            <ReviewItem
              key={item.id}
              kind="Need Confirmation"
              title={item.requirement}
              detail={item.reason}
              evidence={item.evidence}
            >
              <p className="mt-2 text-sm text-amber-950">
                Linked ambiguity: {item.ambiguityId}
              </p>
              <p className="mt-2 text-sm text-amber-950">
                Missing details: {item.missingDetails.join("; ")}
              </p>
            </ReviewItem>
          ))}
      </ul>
    </section>
  );
}

const scopeOptions: Array<{ value: TestingScope; label: string }> = [
  { value: "frontend", label: "Frontend" },
  { value: "backend", label: "Backend" },
  { value: "both", label: "Frontend + Backend" },
];

export function RequirementReview({
  analysisId,
  analysis,
}: {
  analysisId: string;
  analysis: PrdAnalysis;
}) {
  const [state, setState] = useState<ReviewSelectionState>(() =>
    createReviewSelectionState(analysisId),
  );
  const [hydrated, setHydrated] = useState(false);
  const [generation, setGeneration] = useState<GenerationState>({
    status: "idle",
  });
  const generationRequest = useRef<AbortController | null>(null);
  const generationRevision = useRef(0);
  const generationLifecycle = useRef(0);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    () => new Set(analysis.modules[0] ? [analysis.modules[0].id] : []),
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const restored = parsePersistedReviewSelection(
        sessionStorage.getItem(REVIEW_SELECTION_SESSION_KEY),
      );
      let activeState = createReviewSelectionState(analysisId);
      if (
        restored?.analysisId === analysisId &&
        validateReviewSelection(analysis, restored, analysisId).length === 0
      )
        activeState = restored;
      setState(activeState);
      const restoredGeneration = parsePersistedGeneration(
        sessionStorage.getItem(GENERATION_SESSION_KEY),
      );
      if (
        restoredGeneration?.analysisId === analysisId &&
        restoredGeneration.selectionKey === selectionKey(activeState)
      )
        setGeneration({
          status: "success",
          result: restoredGeneration.result,
        });
      else setGeneration({ status: "idle" });
      setHydrated(true);
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [analysis, analysisId]);

  useEffect(() => {
    if (hydrated)
      sessionStorage.setItem(
        REVIEW_SELECTION_SESSION_KEY,
        JSON.stringify(state),
      );
  }, [hydrated, state]);

  useEffect(() => {
    const lifecycle = generationLifecycle;
    const revision = generationRevision;
    const request = generationRequest;
    const currentLifecycle = ++lifecycle.current;
    return () => {
      queueMicrotask(() => {
        if (lifecycle.current === currentLifecycle) {
          revision.current++;
          request.current?.abort();
        }
      });
    };
  }, []);

  const canConfirm = canConfirmReview(analysis, state, analysisId);
  const contract = useMemo(
    () => buildReviewedSelection(analysis, state, analysisId),
    [analysis, analysisId, state],
  );
  const ready = state.confirmed && contract !== null;

  function toggleExpanded(moduleId: string) {
    setExpandedModules((current) => {
      const next = new Set(current);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  }

  function invalidateGeneration() {
    generationRevision.current++;
    generationRequest.current?.abort();
    generationRequest.current = null;
    setGeneration({ status: "idle" });
    sessionStorage.removeItem(GENERATION_SESSION_KEY);
  }

  function updateSelection(
    transition: (current: ReviewSelectionState) => ReviewSelectionState,
  ) {
    invalidateGeneration();
    setState(transition);
  }

  function updateGeneratedResult(result: GeneratedTestCases) {
    if (generation.status !== "success") return;
    sessionStorage.setItem(
      GENERATION_SESSION_KEY,
      JSON.stringify({
        analysisId,
        selectionKey: selectionKey(state),
        result,
      }),
    );
    setGeneration({ status: "success", result });
  }

  async function generate() {
    if (!ready || !contract || generation.status === "generating") return;
    invalidateGeneration();
    const revision = generationRevision.current;
    const controller = new AbortController();
    generationRequest.current = controller;
    setGeneration({ status: "generating" });
    try {
      const response = await fetch("/api/test-cases/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId, analysis, selection: state }),
        signal: controller.signal,
      });
      const body = await response.json();
      if (revision !== generationRevision.current) return;
      const outcome = body.generation;
      if (response.ok && outcome?.status === "success") {
        const parsed = generatedTestCasesSchema.safeParse(outcome.result);
        if (!parsed.success) throw new Error("Invalid generation response");
        const persisted = {
          analysisId,
          selectionKey: selectionKey(state),
          result: parsed.data,
        };
        sessionStorage.setItem(
          GENERATION_SESSION_KEY,
          JSON.stringify(persisted),
        );
        setGeneration({ status: "success", result: parsed.data });
        return;
      }
      const code = outcome?.error?.code as GenerationErrorCode;
      setGeneration({
        status: "failed",
        message: Object.hasOwn(generationErrorMessages, code)
          ? generationErrorMessages[code]
          : generationErrorMessages.GENERATION_FAILED,
      });
    } catch {
      if (revision === generationRevision.current)
        setGeneration({
          status: "failed",
          message: generationErrorMessages.GENERATION_FAILED,
        });
    }
  }

  return (
    <section
      aria-labelledby="requirement-review-title"
      className="mt-8 border-t border-slate-200 pt-8"
    >
      <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
        Human QA review
      </p>
      <h2
        id="requirement-review-title"
        className="mt-2 text-3xl font-semibold tracking-tight text-slate-950"
      >
        Review AI analysis
      </h2>
      <p className="mt-3 max-w-3xl leading-7 text-slate-600">
        Inspect the grounded analysis, choose modules or features, then select
        the future testing scope. No test cases are generated in this step.
      </p>

      <dl
        aria-label="Analysis and selection summary"
        className="mt-5 flex flex-wrap gap-2 text-sm"
      >
        <div className="rounded-full bg-blue-100 px-3 py-1 text-blue-950">
          <dt className="sr-only">Modules detected</dt>
          <dd>{analysis.modules.length} modules detected</dd>
        </div>
        <div className="rounded-full bg-blue-100 px-3 py-1 text-blue-950">
          <dt className="sr-only">Features detected</dt>
          <dd>{analysis.features.length} features detected</dd>
        </div>
        <div className="rounded-full bg-blue-100 px-3 py-1 text-blue-950">
          <dt className="sr-only">Requirements detected</dt>
          <dd>{analysis.requirements.length} requirements detected</dd>
        </div>
        <div className="rounded-full bg-blue-100 px-3 py-1 text-blue-950">
          <dt className="sr-only">Business rules detected</dt>
          <dd>{analysis.businessRules.length} business rules detected</dd>
        </div>
        <div className="rounded-full bg-blue-100 px-3 py-1 text-blue-950">
          <dt className="sr-only">Validations detected</dt>
          <dd>{analysis.validations.length} validations detected</dd>
        </div>
        <div className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">
          <dt className="sr-only">Ambiguities detected</dt>
          <dd>{analysis.ambiguities.length} ambiguities detected</dd>
        </div>
        <div className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">
          <dt className="sr-only">Need Confirmation items</dt>
          <dd>{analysis.needConfirmation.length} need confirmation</dd>
        </div>
        <div className="rounded-full bg-slate-200 px-3 py-1">
          <dt className="sr-only">Modules selected</dt>
          <dd>{state.selectedModuleIds.length} modules selected</dd>
        </div>
        <div className="rounded-full bg-slate-200 px-3 py-1">
          <dt className="sr-only">Features selected</dt>
          <dd>{state.selectedFeatureIds.length} features selected</dd>
        </div>
      </dl>

      <div className="mt-6 space-y-5">
        {analysis.modules.map((module) => {
          const features = analysis.features.filter(
            (feature) => feature.moduleId === module.id,
          );
          const moduleRequirements = new Set(
            analysis.requirements
              .filter(
                (requirement) =>
                  requirement.moduleId === module.id &&
                  requirement.featureId === null,
              )
              .map((requirement) => requirement.id),
          );
          const status = getModuleSelectionStatus(analysis, state, module.id);
          const expanded = expandedModules.has(module.id);
          return (
            <article
              key={module.id}
              className="rounded-2xl border border-slate-300 bg-white shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 p-5">
                <ModuleCheckbox
                  id={`module-${module.id}`}
                  name={module.name}
                  status={status}
                  onChange={(checked) =>
                    updateSelection((current) =>
                      toggleModuleSelection(
                        analysis,
                        current,
                        module.id,
                        checked,
                      ),
                    )
                  }
                />
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-600">
                    {features.length}{" "}
                    {features.length === 1 ? "feature" : "features"}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {status === "partial"
                      ? "Partially selected"
                      : status === "all"
                        ? "Selected"
                        : "Not selected"}
                  </span>
                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={`module-panel-${module.id}`}
                    onClick={() => toggleExpanded(module.id)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    {expanded ? "Collapse" : "Expand"}
                  </button>
                </div>
              </div>
              {expanded && (
                <div
                  id={`module-panel-${module.id}`}
                  className="border-t border-slate-200 p-5"
                >
                  {module.description && (
                    <p className="leading-6 text-slate-700">
                      {module.description}
                    </p>
                  )}
                  <EvidencePanel evidence={module.evidence} />

                  {moduleRequirements.size > 0 && (
                    <div className="mt-5">
                      <h3 className="font-semibold">Module-level analysis</h3>
                      <ContextItems
                        analysis={analysis}
                        requirementIds={moduleRequirements}
                      />
                    </div>
                  )}

                  <div className="mt-5 space-y-4">
                    {features.map((feature) => {
                      const selected = state.selectedFeatureIds.includes(
                        feature.id,
                      );
                      const requirementIds = new Set(
                        analysis.requirements
                          .filter(
                            (requirement) =>
                              requirement.featureId === feature.id,
                          )
                          .map((requirement) => requirement.id),
                      );
                      return (
                        <div
                          key={feature.id}
                          className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="flex items-start gap-3">
                            <input
                              id={`feature-${feature.id}`}
                              type="checkbox"
                              checked={selected}
                              onChange={(event) =>
                                updateSelection((current) =>
                                  toggleFeatureSelection(
                                    analysis,
                                    current,
                                    feature.id,
                                    event.target.checked,
                                  ),
                                )
                              }
                              className="mt-1 size-5 shrink-0 accent-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                            />
                            <div className="min-w-0 flex-1">
                              <label
                                htmlFor={`feature-${feature.id}`}
                                className="font-semibold text-slate-950"
                              >
                                {feature.name}
                              </label>
                              <p className="mt-1 text-xs font-semibold text-slate-600">
                                {requirementIds.size}{" "}
                                {requirementIds.size === 1
                                  ? "requirement"
                                  : "requirements"}
                              </p>
                              {feature.description && (
                                <p className="mt-1 text-sm leading-6 text-slate-700">
                                  {feature.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <EvidencePanel evidence={feature.evidence} />
                          <ContextItems
                            analysis={analysis}
                            requirementIds={requirementIds}
                          />
                        </div>
                      );
                    })}
                    {!features.length && (
                      <p className="text-sm text-slate-600">
                        This module has no mapped feature. Select the module to
                        include its module-level analysis.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </article>
          );
        })}
        {!analysis.modules.length && (
          <p className="rounded-2xl border border-slate-300 bg-white p-5 text-sm text-slate-700">
            No modules were returned in this analysis. Review any unmapped
            analysis below; there is currently nothing available to select.
          </p>
        )}
      </div>

      <UnmappedAnalysis analysis={analysis} />

      <fieldset className="mt-8 rounded-2xl border border-slate-300 bg-white p-5">
        <legend className="px-2 text-lg font-semibold">Testing scope</legend>
        <p className="text-sm leading-6 text-slate-600">
          Choose exactly one scope for future M5 generation.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {scopeOptions.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-300 p-4 font-medium hover:bg-slate-50 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-blue-600"
            >
              <input
                type="radio"
                name={`testing-scope-${analysisId}`}
                value={option.value}
                checked={state.testingScope === option.value}
                onChange={() =>
                  updateSelection((current) =>
                    setTestingScope(current, option.value),
                  )
                }
                className="size-5 accent-blue-600"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <section
        aria-labelledby="review-summary-title"
        className={`mt-6 rounded-2xl border p-5 ${ready ? "border-emerald-300 bg-emerald-50" : "border-slate-300 bg-white"}`}
      >
        <h3 id="review-summary-title" className="text-lg font-semibold">
          Review summary
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          {ready
            ? "Ready for Test Case Generation"
            : canConfirm
              ? "Selection is valid. Confirm it to finish M4 review."
              : "Select at least one module or feature and choose a testing scope."}
        </p>
        {analysis.needConfirmation.length > 0 && (
          <p className="mt-2 text-sm font-medium text-amber-900">
            {analysis.needConfirmation.length} unresolved confirmation item(s)
            remain visible and will stay as context. They do not block unrelated
            source-backed coverage.
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() =>
              updateSelection((current) =>
                confirmReviewSelection(analysis, current, analysisId),
              )
            }
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Confirm reviewed selection
          </button>
          <button
            type="button"
            onClick={() =>
              updateSelection(() => createReviewSelectionState(analysisId))
            }
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Reset review
          </button>
        </div>
        {ready && contract && (
          <div className="mt-4">
            <p className="text-sm text-emerald-900" role="status">
              Reviewed selection saved for this browser session.
            </p>
            <button
              type="button"
              disabled={generation.status === "generating"}
              onClick={() => void generate()}
              className="mt-3 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              {generation.status === "generating"
                ? "Generating…"
                : generation.status === "failed"
                  ? "Retry Test Case Generation"
                  : "Generate Test Cases"}
            </button>
          </div>
        )}
        {generation.status === "generating" && (
          <p className="mt-4 text-sm font-medium text-blue-900" role="status">
            Generation: IN PROGRESS
          </p>
        )}
        {generation.status === "failed" && (
          <p
            className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
            role="alert"
          >
            Generation: FAILED — {generation.message}
          </p>
        )}
        {generation.status === "success" && (
          <>
            <div
              className="mt-4 rounded-xl border border-emerald-300 bg-white p-4 text-sm text-emerald-950"
              role="status"
            >
              <p className="font-semibold">Generation: COMPLETE</p>
              <p className="mt-2">
                Frontend test cases: {generation.result.frontend.length}
              </p>
              <p>Backend test cases: {generation.result.backend.length}</p>
            </div>
            {contract && (
              <TestCasePreview
                result={generation.result}
                testingScope={contract.testingScope}
                onResultChange={updateGeneratedResult}
              />
            )}
          </>
        )}
      </section>
    </section>
  );
}
