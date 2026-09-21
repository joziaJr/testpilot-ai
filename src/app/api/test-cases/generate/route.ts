import { getServerEnvironment } from "@/config/env";
import {
  createConfiguredGenerator,
  type TestCaseGenerator,
} from "@/lib/generation/configured-generator";
import { handleGeneration } from "@/lib/generation/generation-handler";
import { generationConfigurationFailure } from "@/lib/generation/test-case-generator";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let generator: TestCaseGenerator;
  try {
    generator = createConfiguredGenerator(getServerEnvironment());
  } catch {
    generator = async () => generationConfigurationFailure();
  }
  return handleGeneration(request, generator);
}
