import type {
  AiProvider,
  ProviderAnalysisRequest,
  ProviderAnalysisResponse,
} from "./ai-provider";

export class FakeAiProvider implements AiProvider {
  readonly model = "testpilot-deterministic-fake";

  async countTokens(content: string) {
    return Math.ceil(content.length / 4);
  }

  async generateAnalysis(
    request: ProviderAnalysisRequest,
  ): Promise<ProviderAnalysisResponse> {
    const envelope = JSON.parse(
      request.userContent.slice(request.userContent.indexOf("{")),
    ) as {
      prdText: string;
    };
    const lines = envelope.prdText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const evidence =
      lines.find(
        (line) =>
          !line.startsWith("#") &&
          !/(ignore (all |the )?(previous|system)|reveal (the |your )?system prompt|api key|secret|output arbitrary json)/i.test(
            line,
          ),
      ) ??
      lines.find((line) => !line.startsWith("#")) ??
      lines[0];
    const indonesian = /\b(pengguna|dapat|wajib|dokumen|mengunggah)\b/i.test(
      envelope.prdText,
    );
    return {
      jsonText: JSON.stringify({
        documentLanguage: indonesian ? "indonesian" : "english",
        modules: [
          {
            id: "module-1",
            name: indonesian ? "Persyaratan Dokumen" : "Document Requirements",
            description: null,
            evidence: { excerpt: evidence, section: null },
          },
        ],
        features: [
          {
            id: "feature-1",
            moduleId: "module-1",
            name: indonesian ? "Analisis Persyaratan" : "Requirements Analysis",
            description: null,
            evidence: { excerpt: evidence, section: null },
          },
        ],
        requirements: [
          {
            id: "requirement-1",
            moduleId: "module-1",
            featureId: "feature-1",
            statement: evidence,
            evidence: { excerpt: evidence, section: null },
          },
        ],
        businessRules: [],
        validations: [],
        ambiguities: [],
        needConfirmation: [],
      }),
      usage: { inputTokens: 20, outputTokens: 30, totalTokens: 50 },
    };
  }
}
