import { z } from "zod";

export const SUPPORTED_LANGUAGES = ["English", "Hindi", "Gujarati"] as const;

export const languageSchema = z.enum(SUPPORTED_LANGUAGES);

export const learnerQuestionSchema = z
  .string()
  .trim()
  .min(8, "Please enter a question with at least 8 characters.")
  .max(2000, "Please keep your question under 2,000 characters.");

export const diagnoseRequestSchema = z
  .object({
    question: learnerQuestionSchema,
    language: languageSchema,
  })
  .strict();

const prerequisiteConceptSchema = z.object({
  name: z.string().describe("The prerequisite concept name."),
  relevance: z
    .string()
    .describe("Why this prerequisite matters for the learner's stated goal."),
});

const misconceptionHypothesisSchema = z.object({
  statement: z
    .string()
    .describe("A possible misconception phrased as a tentative hypothesis."),
  rationale: z
    .string()
    .describe("Why this hypothesis is worth checking, without claiming it is true."),
  status: z.literal("hypothesis"),
});

const answerOptionSchema = z.object({
  label: z.string().describe("A short option label such as A, B, C, or D."),
  answer: z.string().describe("The answer option shown to the learner."),
  possibleInterpretation: z
    .string()
    .describe(
      "What choosing this option may suggest; it must remain tentative and non-judgmental.",
    ),
});

export const diagnosticPlanSchema = z.object({
  intendedGoal: z
    .string()
    .describe("A concise restatement of what the learner wants to understand."),
  prerequisiteConcepts: z
    .array(prerequisiteConceptSchema)
    .min(1)
    .max(3)
    .describe("The most relevant prerequisite concepts, ordered by importance."),
  misconceptionHypotheses: z
    .array(misconceptionHypothesisSchema)
    .max(2)
    .describe("Possible misconceptions to test, never confirmed misconceptions."),
  diagnosticQuestion: z.object({
    prompt: z
      .string()
      .describe("One targeted question that reveals the learner's current model."),
    whyUseful: z
      .string()
      .describe("Why this question is diagnostically useful."),
    options: z
      .array(answerOptionSchema)
      .min(2)
      .max(4)
      .describe("Distinct answer options with tentative interpretations."),
  }),
});

export const diagnoseSuccessSchema = z.object({
  plan: diagnosticPlanSchema,
});

export const diagnoseErrorSchema = z.object({
  error: z.string(),
});

export const learnerExplanationSchema = z
  .string()
  .trim()
  .min(20, "Please explain your reasoning in at least 20 characters.")
  .max(1000, "Please keep your explanation under 1,000 characters.");

const MAX_PLAN_CONTEXT_CHARACTERS = 20_000;

export const evaluateRequestSchema = z
  .object({
    originalQuestion: learnerQuestionSchema,
    language: languageSchema,
    plan: diagnosticPlanSchema,
    selectedOptionIndex: z.number().int().min(0).max(3),
    explanation: learnerExplanationSchema,
  })
  .strict()
  .superRefine((request, context) => {
    if (JSON.stringify(request.plan).length > MAX_PLAN_CONTEXT_CHARACTERS) {
      context.addIssue({
        code: "custom",
        path: ["plan"],
        message: "The diagnostic plan context is too large.",
      });
    }

    if (!request.plan.diagnosticQuestion.options[request.selectedOptionIndex]) {
      context.addIssue({
        code: "custom",
        path: ["selectedOptionIndex"],
        message: "The selected option does not exist in this diagnostic plan.",
      });
    }
  });

export const adaptiveAssessmentSchema = z.object({
  understandingLevel: z.enum([
    "strong",
    "partial",
    "needs_foundation",
    "uncertain",
  ]),
  isAnswerConsistentWithConcept: z.boolean().nullable(),
  observedEvidence: z
    .array(z.string())
    .min(1)
    .max(4)
    .describe(
      "Concise evidence drawn only from the learner's selected answer and explanation.",
    ),
  possibleKnowledgeGap: z
    .string()
    .nullable()
    .describe("A tentative knowledge gap, or null when evidence is insufficient."),
  tailoredFeedback: z
    .string()
    .describe("Concise, encouraging, technically accurate feedback."),
  recommendedNextAction: z.enum(["advance", "reteach", "clarify"]),
  recommendedNextConcept: z
    .string()
    .describe("The single best concept for the learner to address next."),
  microLesson: z
    .string()
    .describe("A short concrete explanation adapted to the demonstrated reasoning."),
  followUpQuestion: z
    .string()
    .describe("One suitable question that checks understanding after the micro-lesson."),
});

export const evaluateSuccessSchema = z.object({
  assessment: adaptiveAssessmentSchema,
});

export type SupportedLanguage = z.infer<typeof languageSchema>;
export type DiagnoseRequest = z.infer<typeof diagnoseRequestSchema>;
export type DiagnosticPlan = z.infer<typeof diagnosticPlanSchema>;
export type EvaluateRequest = z.infer<typeof evaluateRequestSchema>;
export type AdaptiveAssessment = z.infer<typeof adaptiveAssessmentSchema>;
