import { Worker } from "node:worker_threads";
import {
  getDocument,
  InvalidPDFException,
  PasswordException,
  VerbosityLevel,
} from "pdfjs-dist/legacy/build/pdf.mjs";
import { type UploadExtension } from "../upload-validation";
import {
  documentExtractionResultSchema,
  extractionFailure,
  type DocumentExtractionResult,
} from "./extraction-contract";
import { normalizeExtractedText } from "./normalize-text";

export const EXTRACTION_TIMEOUT_MS = 20_000;
export const MAX_DOCX_EXPANDED_BYTES = 50_000_000;
export const MAX_DOCX_ENTRIES = 5_000;
export const MAX_DOCX_WORKER_MEMORY_MB = 96;

class ExtractionLimitError extends Error {}

function inspectDocxLimits(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = bytes.length - 22;
  const earliest = Math.max(0, end - 65_535);
  while (end >= earliest && view.getUint32(end, true) !== 0x06054b50) end--;
  if (end < earliest) throw new Error("Missing ZIP directory");
  const count = view.getUint16(end + 10, true);
  if (count > MAX_DOCX_ENTRIES) throw new ExtractionLimitError();
  let offset = view.getUint32(end + 16, true);
  let expanded = 0;
  for (let entry = 0; entry < count; entry++) {
    if (offset + 46 > end || view.getUint32(offset, true) !== 0x02014b50)
      throw new Error("Invalid ZIP directory");
    expanded += view.getUint32(offset + 24, true);
    if (expanded > MAX_DOCX_EXPANDED_BYTES) throw new ExtractionLimitError();
    offset +=
      46 +
      view.getUint16(offset + 28, true) +
      view.getUint16(offset + 30, true) +
      view.getUint16(offset + 32, true);
  }
  if (offset !== end) throw new Error("Invalid ZIP directory size");
}

async function withTimeout<T>(work: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new ExtractionLimitError("Extraction deadline exceeded")),
      EXTRACTION_TIMEOUT_MS,
    );
  });
  try {
    return await Promise.race([work, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

function pageText(
  items: Array<{ str: string; hasEOL: boolean } | { type: string }>,
): string {
  let result = "";
  for (const item of items) {
    if (!("str" in item)) continue;
    if (result && !/\s$/.test(result) && item.str && !/^\s/.test(item.str))
      result += " ";
    result += item.str;
    if (item.hasEOL) result += "\n";
  }
  return result;
}

async function extractPdf(bytes: Uint8Array): Promise<string> {
  const loadingTask = getDocument({
    data: new Uint8Array(bytes),
    disableAutoFetch: true,
    disableFontFace: true,
    disableStream: true,
    stopAtErrors: true,
    useWorkerFetch: false,
    verbosity: VerbosityLevel.ERRORS,
  });
  const work = (async () => {
    const document = await loadingTask.promise;
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
      const page = await document.getPage(pageNumber);
      try {
        const content = await page.getTextContent();
        pages.push(pageText(content.items));
      } finally {
        page.cleanup();
      }
    }
    return pages.join("\n\n");
  })();
  try {
    return await withTimeout(work);
  } finally {
    await loadingTask.destroy();
  }
}

async function extractDocx(bytes: Uint8Array): Promise<string> {
  inspectDocxLimits(bytes);
  return new Promise<string>((resolve, reject) => {
    const worker = new Worker(
      `
        const { parentPort, workerData } = require("node:worker_threads");
        const mammoth = require("mammoth");
        mammoth.extractRawText({ buffer: Buffer.from(workerData) })
          .then((result) => parentPort.postMessage({ ok: true, value: result.value }))
          .catch(() => parentPort.postMessage({ ok: false }));
      `,
      {
        eval: true,
        workerData: new Uint8Array(bytes),
        resourceLimits: {
          maxOldGenerationSizeMb: MAX_DOCX_WORKER_MEMORY_MB,
          stackSizeMb: 4,
        },
      },
    );
    let settled = false;
    const finish = (action: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      action();
    };
    const timer = setTimeout(() => {
      finish(() => {
        void worker.terminate();
        reject(new ExtractionLimitError("Extraction deadline exceeded"));
      });
    }, EXTRACTION_TIMEOUT_MS);
    worker.once("message", (message: { ok: boolean; value?: string }) => {
      finish(() => {
        void worker.terminate();
        if (message.ok && typeof message.value === "string")
          resolve(message.value);
        else reject(new Error("DOCX parser rejected input"));
      });
    });
    worker.once("error", () =>
      finish(() => reject(new Error("DOCX worker failed"))),
    );
    worker.once("exit", (code) => {
      if (code !== 0)
        finish(() => reject(new Error("DOCX worker exited unexpectedly")));
    });
  });
}

function extractTxt(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export async function extractDocument(
  fileName: string,
  fileType: UploadExtension,
  bytes: Uint8Array,
): Promise<DocumentExtractionResult> {
  try {
    const raw =
      fileType === "txt"
        ? extractTxt(bytes)
        : fileType === "pdf"
          ? await extractPdf(bytes)
          : await extractDocx(bytes);
    const text = normalizeExtractedText(raw);
    if (!text) {
      return extractionFailure(
        fileName,
        fileType,
        fileType === "pdf" ? "UNREADABLE_DOCUMENT" : "EMPTY_DOCUMENT",
      );
    }
    return documentExtractionResultSchema.parse({
      fileName,
      fileType,
      text,
      characterCount: text.length,
      status: "success",
    });
  } catch (error) {
    const code =
      error instanceof PasswordException
        ? "UNREADABLE_DOCUMENT"
        : error instanceof InvalidPDFException ||
            (error instanceof TypeError && fileType === "txt")
          ? "MALFORMED_DOCUMENT"
          : error instanceof ExtractionLimitError
            ? "EXTRACTION_FAILED"
            : "MALFORMED_DOCUMENT";
    return extractionFailure(fileName, fileType, code);
  }
}
