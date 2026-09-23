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
    if (request.systemInstruction.includes("test-case generator")) {
      const envelope = JSON.parse(
        request.userContent.slice(request.userContent.indexOf("{")),
      ) as {
        layer: "frontend" | "backend";
        documentLanguage: "indonesian" | "english";
        context: {
          modules: Array<{ id: string }>;
          features: Array<{ id: string; moduleId: string }>;
          requirements: Array<{
            id: string;
            moduleId: string | null;
            featureId: string | null;
            statement: string;
          }>;
          businessRules: Array<{ id: string; requirementIds: string[] }>;
          validations: Array<{ id: string; requirementIds: string[] }>;
          ambiguities: Array<{ requirementId: string | null }>;
        };
      };
      const ambiguous = new Set(
        envelope.context.ambiguities
          .map((item) => item.requirementId)
          .filter((id): id is string => id !== null),
      );
      const requirement = envelope.context.requirements.find(
        (item) => item.featureId !== null && !ambiguous.has(item.id),
      );
      const feature = envelope.context.features.find(
        (item) => item.id === requirement?.featureId,
      );
      if (!requirement || !feature)
        return {
          jsonText: JSON.stringify({ testCases: [] }),
          usage: { inputTokens: 30, outputTokens: 5, totalTokens: 35 },
        };
      const ruleIds = envelope.context.businessRules
        .filter((item) => item.requirementIds.includes(requirement.id))
        .map((item) => item.id);
      const validationIds = envelope.context.validations
        .filter((item) => item.requirementIds.includes(requirement.id))
        .map((item) => item.id);
      const base = {
        moduleId: feature.moduleId,
        featureId: feature.id,
        requirementIds: [requirement.id],
        businessRuleIds: ruleIds,
        validationIds,
        preconditions: null,
        priority: "Medium",
        automation: "Candidate",
        notes: null,
      } as const;
      const indonesian = envelope.documentLanguage === "indonesian";
      const testCases = [
        {
          ...base,
          title: indonesian
            ? envelope.layer === "frontend"
              ? "Selesaikan perilaku pengguna yang didukung"
              : "Proses perilaku bisnis yang didukung"
            : envelope.layer === "frontend"
              ? "Complete the supported user behavior"
              : "Process the supported business behavior",
          steps: [
            indonesian
              ? envelope.layer === "frontend"
                ? `Lakukan perilaku yang didokumentasikan: ${requirement.statement}`
                : `Kirim data yang memenuhi: ${requirement.statement}`
              : envelope.layer === "frontend"
                ? `Perform the documented behavior: ${requirement.statement}`
                : `Submit data that satisfies: ${requirement.statement}`,
          ],
          expectedResult: requirement.statement,
          type: "Positive",
        },
      ];
      if (validationIds.length) {
        testCases.push({
          ...base,
          title: indonesian
            ? "Biarkan nilai wajib yang didokumentasikan kosong"
            : envelope.layer === "frontend"
              ? "Leave the documented required value empty"
              : "Process data missing the documented required value",
          steps: [
            indonesian
              ? "Hilangkan nilai yang dinyatakan wajib oleh validasi."
              : "Omit the value identified as required by the validation.",
          ],
          expectedResult: indonesian
            ? "Validasi nilai wajib yang didokumentasikan diterapkan."
            : "The documented required-value validation is enforced.",
          type: "Negative",
        });
        testCases.push({
          ...base,
          title: indonesian
            ? "Gunakan spasi untuk nilai wajib yang didokumentasikan"
            : "Use whitespace for the documented required value",
          steps: [
            indonesian
              ? "Berikan hanya spasi untuk nilai wajib."
              : "Provide only whitespace for the required value.",
          ],
          expectedResult: indonesian
            ? "Spasi tidak memenuhi aturan nilai wajib yang didokumentasikan."
            : "Whitespace does not satisfy the documented required-value rule.",
          type: "Edge",
        });
      }
      return {
        jsonText: JSON.stringify({ testCases }),
        usage: { inputTokens: 60, outputTokens: 90, totalTokens: 150 },
      };
    }
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
    if (envelope.prdText.includes("# M4 Review Fixture")) {
      const [
        createTask,
        deleteTask,
        workspaceRule,
        titleValidation,
        adminRule,
      ] = [
        "Users can create tasks.",
        "Users can delete tasks.",
        "Every task belongs to a workspace.",
        "Task title is required.",
        "Admin can manage tasks.",
      ];
      return {
        jsonText: JSON.stringify({
          documentLanguage: "english",
          modules: [
            {
              id: "module-task-management",
              name: "Task Management",
              description: "Create and delete workspace tasks.",
              evidence: { excerpt: createTask, section: "M4 Review Fixture" },
            },
          ],
          features: [
            {
              id: "feature-create-task",
              moduleId: "module-task-management",
              name: "Create Task",
              description: null,
              evidence: { excerpt: createTask, section: "M4 Review Fixture" },
            },
            {
              id: "feature-delete-task",
              moduleId: "module-task-management",
              name: "Delete Task",
              description: null,
              evidence: { excerpt: deleteTask, section: "M4 Review Fixture" },
            },
          ],
          requirements: [
            {
              id: "requirement-create-task",
              moduleId: "module-task-management",
              featureId: "feature-create-task",
              statement: createTask,
              evidence: { excerpt: createTask, section: "M4 Review Fixture" },
            },
            {
              id: "requirement-delete-task",
              moduleId: "module-task-management",
              featureId: "feature-delete-task",
              statement: deleteTask,
              evidence: { excerpt: deleteTask, section: "M4 Review Fixture" },
            },
          ],
          businessRules: [
            {
              id: "rule-workspace-task",
              requirementIds: ["requirement-create-task"],
              rule: workspaceRule,
              evidence: {
                excerpt: workspaceRule,
                section: "M4 Review Fixture",
              },
            },
          ],
          validations: [
            {
              id: "validation-task-title",
              requirementIds: ["requirement-create-task"],
              validation: titleValidation,
              evidence: {
                excerpt: titleValidation,
                section: "M4 Review Fixture",
              },
            },
          ],
          ambiguities: [
            {
              id: "ambiguity-admin-management",
              requirementId: "requirement-delete-task",
              sourceText: adminRule,
              reason: "The permitted task operations are not specified.",
              evidence: { excerpt: adminRule, section: "M4 Review Fixture" },
            },
          ],
          needConfirmation: [
            {
              id: "confirmation-admin-management",
              status: "need_confirmation",
              ambiguityId: "ambiguity-admin-management",
              requirement:
                "Which task management operations may an admin perform?",
              reason: "The source does not enumerate the permitted operations.",
              missingDetails: ["Permitted admin task operations"],
              evidence: { excerpt: adminRule, section: "M4 Review Fixture" },
            },
          ],
        }),
        usage: { inputTokens: 40, outputTokens: 120, totalTokens: 160 },
      };
    }
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
