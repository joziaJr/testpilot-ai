import type { PrdAnalysis } from "./analysis-contract";

export const analysisSource = "Users can upload a PRD. Admin can manage users.";

export function validAnalysis(): PrdAnalysis {
  return {
    documentLanguage: "english",
    modules: [
      {
        id: "module-1",
        name: "PRD Upload",
        description: null,
        evidence: { excerpt: "Users can upload a PRD.", section: null },
      },
    ],
    features: [
      {
        id: "feature-1",
        moduleId: "module-1",
        name: "Upload",
        description: null,
        evidence: { excerpt: "Users can upload a PRD.", section: null },
      },
    ],
    requirements: [
      {
        id: "requirement-1",
        moduleId: "module-1",
        featureId: "feature-1",
        statement: "Users can upload a PRD.",
        evidence: { excerpt: "Users can upload a PRD.", section: null },
      },
    ],
    businessRules: [],
    validations: [],
    ambiguities: [
      {
        id: "ambiguity-1",
        requirementId: null,
        sourceText: "Admin can manage users.",
        reason: "Manage is not defined.",
        evidence: { excerpt: "Admin can manage users.", section: null },
      },
    ],
    needConfirmation: [
      {
        id: "confirmation-1",
        status: "need_confirmation",
        ambiguityId: "ambiguity-1",
        requirement: "Clarify user management operations.",
        reason: "The permitted operations are unspecified.",
        missingDetails: ["Which operations does manage include?"],
        evidence: { excerpt: "Admin can manage users.", section: null },
      },
    ],
  };
}
