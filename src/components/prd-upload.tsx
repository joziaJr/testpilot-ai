"use client";

import { useEffect, useRef, useState } from "react";
import {
  extractionErrorMessages,
  type ExtractionErrorCode,
} from "@/lib/extraction/extraction-errors";
import {
  extensionOf,
  uploadMessages,
  validateMetadata,
  type FileMetadata,
  type UploadExtension,
  type UploadErrorCode,
} from "@/lib/upload-validation";

type SelectedDocument = FileMetadata & {
  fileType: UploadExtension;
  extraction:
    | { status: "extracting" }
    | { status: "success"; characterCount: number }
    | { status: "failed"; code: ExtractionErrorCode; message: string };
};

export function PrdUpload({
  maxSizeMB,
  maxBytes,
}: {
  maxSizeMB: number;
  maxBytes: number;
}) {
  const [selected, setSelected] = useState<SelectedDocument | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  const revision = useRef(0);
  const lifecycle = useRef(0);
  useEffect(() => {
    const lifecycleRef = lifecycle;
    const revisionRef = revision;
    const requestRef = request;
    const currentLifecycle = ++lifecycleRef.current;
    return () => {
      // Strict Mode immediately sets the effect up again. Only a real unmount
      // should cancel an upload that started during hydration.
      queueMicrotask(() => {
        if (lifecycleRef.current === currentLifecycle) {
          revisionRef.current++;
          requestRef.current?.abort();
        }
      });
    };
  }, []);

  function cancel() {
    revision.current++;
    request.current?.abort();
    setBusy(false);
  }

  async function choose(files: File[]) {
    cancel();
    setError("");
    if (files.length !== 1) {
      setError(uploadMessages.FILE_REQUIRED);
      return;
    }
    const file = files[0];
    const invalid = validateMetadata(file, maxBytes);
    if (invalid) {
      setError(uploadMessages[invalid]);
      return;
    }
    const id = revision.current;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    const timeout = setTimeout(() => controller.abort(), 60_000);
    const fileType = extensionOf(file.name)!;
    let validationPassed = false;
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/uploads/validate", {
        method: "POST",
        body,
        signal: controller.signal,
      });
      const result = await response.json();
      if (id !== revision.current) return;
      if (!response.ok) {
        const code = result.error?.code as UploadErrorCode;
        setError(
          Object.hasOwn(uploadMessages, code)
            ? uploadMessages[code]
            : uploadMessages.UPLOAD_FAILED,
        );
        return;
      }
      if (result.file?.name !== file.name || result.file?.size !== file.size)
        throw new Error("Invalid upload response");
      validationPassed = true;
      setSelected({
        name: file.name,
        size: file.size,
        type: file.type,
        fileType,
        extraction: { status: "extracting" },
      });
      setBusy(false);

      const extractionBody = new FormData();
      extractionBody.set("file", file);
      const extractionResponse = await fetch("/api/documents/extract", {
        method: "POST",
        body: extractionBody,
        signal: controller.signal,
      });
      const extractionResult = await extractionResponse.json();
      if (id !== revision.current) return;
      const extraction = extractionResult.extraction;
      if (
        extractionResult.validation?.status !== "passed" ||
        extraction?.fileName !== file.name ||
        extraction?.fileType !== fileType
      )
        throw new Error("Invalid extraction response");
      if (
        extractionResponse.ok &&
        extraction.status === "success" &&
        Number.isSafeInteger(extraction.characterCount) &&
        extraction.characterCount > 0
      ) {
        setSelected({
          name: file.name,
          size: file.size,
          type: file.type,
          fileType,
          extraction: {
            status: "success",
            characterCount: extraction.characterCount,
          },
        });
        return;
      }
      const code = extraction.error?.code as ExtractionErrorCode;
      if (
        extraction.status !== "failed" ||
        !Object.hasOwn(extractionErrorMessages, code)
      )
        throw new Error("Invalid extraction failure response");
      setSelected({
        name: file.name,
        size: file.size,
        type: file.type,
        fileType,
        extraction: {
          status: "failed",
          code,
          message: extractionErrorMessages[code],
        },
      });
    } catch {
      if (id === revision.current) {
        if (validationPassed) {
          setSelected({
            name: file.name,
            size: file.size,
            type: file.type,
            fileType,
            extraction: {
              status: "failed",
              code: "EXTRACTION_FAILED",
              message: extractionErrorMessages.EXTRACTION_FAILED,
            },
          });
        } else {
          setError(uploadMessages.UPLOAD_FAILED);
        }
      }
    } finally {
      clearTimeout(timeout);
      if (id === revision.current) setBusy(false);
    }
  }

  return (
    <div className="mt-10">
      <div
        data-testid="drop-zone"
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void choose(Array.from(event.dataTransfer.files));
        }}
        className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors sm:p-12 ${dragging ? "border-blue-600 bg-blue-50" : "border-slate-300 bg-white"}`}
      >
        <div
          aria-hidden="true"
          className="mx-auto mb-5 flex size-12 items-center justify-center rounded-xl bg-blue-50 text-2xl text-blue-600"
        >
          ↑
        </div>
        <h2 className="text-lg font-semibold">Drop your PRD here</h2>
        <p id="file-help" className="mt-2 text-sm text-[var(--muted)]">
          PDF, DOCX, or TXT · Up to {maxSizeMB} MB
        </p>
        <input
          ref={input}
          id="prd-file"
          className="sr-only"
          type="file"
          accept=".pdf,.docx,.txt"
          aria-label="Choose PRD file"
          aria-describedby="file-help"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            if (files.length) void choose(files);
          }}
        />
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="mt-6 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
        >
          {selected ? "Replace file" : "Choose file"}
        </button>
      </div>
      <div role="status" aria-live="polite" className="mt-5">
        {busy && (
          <p className="text-sm text-[var(--muted)]">Validating file…</p>
        )}
        {selected && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="font-semibold text-emerald-900">File accepted</p>
            <p className="mt-2 break-all font-medium">{selected.name}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {selected.size.toLocaleString("en-US")} bytes ·{" "}
              {selected.fileType.toUpperCase()}
            </p>
            <p className="mt-2 text-sm font-medium text-emerald-800">
              Validation: PASS
            </p>
            {selected.extraction.status === "extracting" && (
              <p className="mt-2 text-sm text-[var(--muted)]">
                Extraction: IN PROGRESS
              </p>
            )}
            {selected.extraction.status === "success" && (
              <p className="mt-2 text-sm text-emerald-800">
                Extraction: COMPLETE ·{" "}
                {selected.extraction.characterCount.toLocaleString("en-US")}{" "}
                characters
              </p>
            )}
            <button
              type="button"
              className="mt-4 rounded px-2 py-1 text-sm font-semibold underline underline-offset-4"
              onClick={() => {
                cancel();
                setSelected(null);
                setError("");
              }}
            >
              Remove file
            </button>
          </div>
        )}
      </div>
      {selected?.extraction.status === "failed" && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          Extraction: FAILED — {selected.extraction.message}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
          {selected ? " Your previously accepted file is unchanged." : ""}
        </p>
      )}
    </div>
  );
}
