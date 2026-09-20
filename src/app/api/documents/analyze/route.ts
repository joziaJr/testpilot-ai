import { getServerEnvironment } from "@/config/env";
import { getUploadPolicy } from "@/config/upload";
import { handleAnalysis } from "@/lib/analysis/analysis-handler";
import {
  createConfiguredAnalyzer,
  type PrdAnalyzer,
} from "@/lib/analysis/configured-analyzer";
import { configurationFailure } from "@/lib/analysis/prd-analyzer";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let analyzer: PrdAnalyzer;
  try {
    analyzer = createConfiguredAnalyzer(getServerEnvironment());
  } catch {
    analyzer = async () => configurationFailure();
  }
  return handleAnalysis(request, getUploadPolicy().maxBytes, analyzer);
}
