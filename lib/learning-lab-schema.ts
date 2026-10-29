import { z } from "zod";

import {
  adaptiveAssessmentSchema,
  languageSchema,
  learnerQuestionSchema,
} from "./diagnostic-schema.ts";

export const LAB_TYPES = [
  "moon_phases",
  "compound_interest",
  "concept_comparison",
] as const;

export const labTypeSchema = z.enum(LAB_TYPES);

const predictionOptionSchema = z
  .object({
    id: z.string().min(1).max(24),
    text: z.string().min(1).max(240),
  })
  .strict();

const commonLabFields = {
  title: z.string().min(1).max(120),
  learningObjective: z.string().min(1).max(300),
  shortInstructions: z.string().min(1).max(400),
  predictionQuestion: z.string().min(1).max(300),
  observationPrompts: z.array(z.string().min(1).max(240)).min(1).max(4),
  explanation: z.string().min(1).max(1200),
  selectedLanguage: languageSchema,
};

const moonPhasesLabSchema = z
  .object({
    labType: z.literal("moon_phases"),
    ...commonLabFields,
    initialConfiguration: z
      .object({
        initialOrbitAngle: z.number().min(0).max(360),
        predictionOptions: z.array(predictionOptionSchema).min(2).max(4),
      })
      .strict(),
  })
  .strict();

const compoundInterestLabSchema = z
  .object({
    labType: z.literal("compound_interest"),
    ...commonLabFields,
    initialConfiguration: z
      .object({
        principal: z.number().min(100).max(1_000_000),
        annualRatePercent: z.number().min(0.1).max(50),
        years: z.number().int().min(1).max(50),
        predictionOptions: z.array(predictionOptionSchema).min(2).max(4),
      })
      .strict(),
  })
  .strict();

const comparisonScenarioSchema = z
  .object({
    title: z.string().min(1).max(100),
    setup: z.string().min(1).max(360),
    keyObservations: z.array(z.string().min(1).max(220)).min(1).max(4),
  })
  .strict();

const conceptComparisonLabSchema = z
  .object({
    labType: z.literal("concept_comparison"),
    ...commonLabFields,
    initialConfiguration: z
      .object({
        comparisonDimension: z.string().min(1).max(160),
        scenarioA: comparisonScenarioSchema,
        scenarioB: comparisonScenarioSchema,
        predictionOptions: z.array(predictionOptionSchema).min(2).max(4),
      })
      .strict(),
  })
  .strict();

export const learningLabSchema = z.discriminatedUnion("labType", [
  moonPhasesLabSchema,
  compoundInterestLabSchema,
  conceptComparisonLabSchema,
]);

// Structured Outputs requires an object at the root, so the discriminated
// union is intentionally nested inside this response envelope.
export const learningLabOutputSchema = z
  .object({
    lab: learningLabSchema,
  })
  .strict();

export const labRequestSchema = z
  .object({
    originalLearningGoal: learnerQuestionSchema,
    language: languageSchema,
    assessment: adaptiveAssessmentSchema,
    recommendedNextConcept: z.string().trim().min(1).max(500),
    recommendedNextAction: z.enum(["advance", "reteach", "clarify"]),
  })
  .strict()
  .superRefine((request, context) => {
    if (request.recommendedNextConcept !== request.assessment.recommendedNextConcept) {
      context.addIssue({
        code: "custom",
        path: ["recommendedNextConcept"],
        message: "The recommended concept must match the assessment.",
      });
    }

    if (request.recommendedNextAction !== request.assessment.recommendedNextAction) {
      context.addIssue({
        code: "custom",
        path: ["recommendedNextAction"],
        message: "The recommended action must match the assessment.",
      });
    }
  });

export const labSuccessSchema = z.object({ lab: learningLabSchema });

export type LabType = z.infer<typeof labTypeSchema>;
export type LearningLab = z.infer<typeof learningLabSchema>;
export type LabRequest = z.infer<typeof labRequestSchema>;

