import type {
  AiProvider,
  ProviderAnalysisRequest,
  ProviderAnalysisResponse,
  ProviderGenerationRequest,
  ProviderGenerationResponse,
  TestCaseGenerationProvider,
} from "./ai-provider";

export class FakeAiProvider implements AiProvider, TestCaseGenerationProvider {
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

  async generateTestCases(
    request: ProviderGenerationRequest,
  ): Promise<ProviderGenerationResponse> {
    const envelope = JSON.parse(
      request.userContent.slice(request.userContent.indexOf("{")),
    ) as {
      layer: "frontend" | "backend";
      context: {
        documentLanguage: "indonesian" | "english";
        features: Array<{ id: string; moduleId: string; name: string }>;
        requirements: Array<{
          id: string;
          featureId: string | null;
        }>;
        validations: Array<{ id: string; requirementIds: string[] }>;
        businessRules: Array<{ id: string; requirementIds: string[] }>;
        ambiguities: Array<{ id: string; requirementId: string | null }>;
        needConfirmation: Array<{ id: string; ambiguityId: string }>;
      };
    };
    const feature = envelope.context.features[0];
    const requirement = envelope.context.requirements.find(
      (item) => item.featureId === feature?.id,
    );
    if (!feature || !requirement) throw new Error("Invalid fake context");
    const rules = envelope.context.businessRules.filter((item) =>
      item.requirementIds.includes(requirement.id),
    );
    const validations = envelope.context.validations.filter((item) =>
      item.requirementIds.includes(requirement.id),
    );
    const ambiguityIds = new Set(
      envelope.context.ambiguities
        .filter((item) => item.requirementId === requirement.id)
        .map((item) => item.id),
    );
    const confirmations = envelope.context.needConfirmation.filter((item) =>
      ambiguityIds.has(item.ambiguityId),
    );
    const indonesian = envelope.context.documentLanguage === "indonesian";
    const frontend = envelope.layer === "frontend";
    const references = {
      requirementIds: [requirement.id],
      businessRuleIds: rules.map((item) => item.id),
      validationIds: validations.map((item) => item.id),
      needConfirmationIds: confirmations.map((item) => item.id),
    };
    const cases = [
      {
        moduleId: feature.moduleId,
        featureId: feature.id,
        title: indonesian
          ? `Verifikasi ${feature.name} dengan kondisi valid`
          : `Verify ${feature.name} with a documented valid condition`,
        preconditions: null,
        steps: indonesian
          ? frontend
            ? [
                `Buka ${feature.name}.`,
                "Lakukan tindakan yang didokumentasikan.",
              ]
            : [
                "Berikan input valid.",
                "Terapkan perilaku yang didokumentasikan.",
              ]
          : frontend
            ? [`Open ${feature.name}.`, "Perform the documented action."]
            : [
                "Provide valid input.",
                "Apply the documented business behavior.",
              ],
        expectedResult: indonesian
          ? "Perilaku yang didokumentasikan berhasil dilakukan."
          : "The documented behavior completes successfully.",
        type: "Positive",
        ...references,
      },
    ];
    if (validations.length)
      cases.push(
        {
          moduleId: feature.moduleId,
          featureId: feature.id,
          title: indonesian
            ? `Tolak ${feature.name} ketika nilai wajib kosong`
            : `Reject ${feature.name} when the required value is empty`,
          preconditions: null,
          steps: indonesian
            ? frontend
              ? [
                  `Buka ${feature.name}.`,
                  "Biarkan nilai wajib kosong.",
                  "Kirim tindakan.",
                ]
              : ["Biarkan nilai wajib kosong.", "Terapkan aturan bisnis."]
            : frontend
              ? [
                  `Open ${feature.name}.`,
                  "Leave the required value empty.",
                  "Submit the action.",
                ]
              : [
                  "Leave the required value empty.",
                  "Apply the documented business validation.",
                ],
          expectedResult: indonesian
            ? "Tindakan ditolak sesuai validasi wajib."
            : "The documented required-field rule rejects the action.",
          type: "Negative",
          ...references,
        },
        {
          moduleId: feature.moduleId,
          featureId: feature.id,
          title: indonesian
            ? `Validasi ${feature.name} dengan spasi saja`
            : `Validate ${feature.name} with whitespace only`,
          preconditions: null,
          steps: indonesian
            ? frontend
              ? [
                  `Buka ${feature.name}.`,
                  "Isi nilai wajib hanya dengan spasi.",
                  "Kirim tindakan.",
                ]
              : [
                  "Berikan nilai wajib yang hanya berisi spasi.",
                  "Terapkan validasi bisnis.",
                ]
            : frontend
              ? [
                  `Open ${feature.name}.`,
                  "Enter only whitespace in the required value.",
                  "Submit the action.",
                ]
              : [
                  "Provide a whitespace-only required value.",
                  "Apply the documented business validation.",
                ],
          expectedResult: indonesian
            ? "Nilai spasi saja tidak memenuhi validasi wajib."
            : "A whitespace-only value does not satisfy the documented required-field validation.",
          type: "Edge",
          ...references,
        },
      );
    return {
      jsonText: JSON.stringify({ cases }),
      usage: { inputTokens: 80, outputTokens: 160, totalTokens: 240 },
    };
  }
}
