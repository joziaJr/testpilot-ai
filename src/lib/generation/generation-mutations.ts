import { z } from "zod";
import {
  generatedTestCaseSchema,
  generatedTestCasesSchema,
  type GeneratedTestCases,
  type GenerationLayer,
} from "./generation-contract";

export const editableGeneratedTestCaseSchema = generatedTestCaseSchema.pick({
  module: true,
  feature: true,
  title: true,
  preconditions: true,
  steps: true,
  expectedResult: true,
  priority: true,
  type: true,
  automation: true,
  notes: true,
});

export type EditableGeneratedTestCase = z.infer<
  typeof editableGeneratedTestCaseSchema
>;

export type GenerationMutationResult =
  | { success: true; result: GeneratedTestCases }
  | { success: false; message: string };

function normalize(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase()
    .replace(/\s+/g, " ");
}

function duplicateKey(item: EditableGeneratedTestCase) {
  return [
    item.module,
    item.feature,
    item.title,
    item.steps.join(" "),
    item.expectedResult,
  ]
    .map(normalize)
    .join(":");
}

export function editGeneratedTestCase(
  result: GeneratedTestCases,
  layer: GenerationLayer,
  testCaseId: string,
  fields: EditableGeneratedTestCase,
): GenerationMutationResult {
  const parsed = editableGeneratedTestCaseSchema.safeParse(fields);
  if (!parsed.success)
    return {
      success: false,
      message: "Correct the highlighted test case fields.",
    };

  const index = result[layer].findIndex(
    (item) => item.testCaseId === testCaseId,
  );
  if (index < 0)
    return { success: false, message: "The test case is no longer available." };

  const current = result[layer][index];
  if (
    parsed.data.module !== current.module ||
    parsed.data.feature !== current.feature
  )
    return {
      success: false,
      message:
        "Module and Feature are source-linked and cannot be changed for this test case.",
    };

  const editedKey = duplicateKey(parsed.data);
  if (
    result[layer].some(
      (item, itemIndex) =>
        itemIndex !== index && duplicateKey(item) === editedKey,
    )
  )
    return {
      success: false,
      message: "Another test case already has the same scenario.",
    };

  const nextLayer = [...result[layer]];
  nextLayer[index] = generatedTestCaseSchema.parse({
    ...result[layer][index],
    ...parsed.data,
  });
  const next = generatedTestCasesSchema.safeParse({
    ...result,
    [layer]: nextLayer,
  });
  return next.success
    ? { success: true, result: next.data }
    : { success: false, message: "The edited test case is invalid." };
}

export function deleteGeneratedTestCase(
  result: GeneratedTestCases,
  layer: GenerationLayer,
  testCaseId: string,
): GenerationMutationResult {
  if (!result[layer].some((item) => item.testCaseId === testCaseId))
    return { success: false, message: "The test case is no longer available." };

  const next = generatedTestCasesSchema.safeParse({
    ...result,
    [layer]: result[layer].filter((item) => item.testCaseId !== testCaseId),
  });
  return next.success
    ? { success: true, result: next.data }
    : { success: false, message: "The test case could not be deleted." };
}
