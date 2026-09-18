export function normalizeExtractedText(value: string): string {
  return value
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u2028\u2029\f]/g, "\n")
    .replace(/\u00a0/g, " ")
    .split("\n")
    .map((line) => line.replace(/ {2,}/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
