import assert from "node:assert/strict";
import test from "node:test";

import {
  canSubmitEvaluation,
  cleanInterpretationPrefix,
  getJourneyStep,
} from "../lib/assessment-journey.ts";
import {
  adaptiveAssessmentSchema,
  evaluateRequestSchema,
  type DiagnosticPlan,
} from "../lib/diagnostic-schema.ts";

const plan: DiagnosticPlan = {
  intendedGoal: "Understand why seasons change.",
  prerequisiteConcepts: [
    { name: "Earth's tilt", relevance: "It changes sunlight angle." },
  ],
  misconceptionHypotheses: [
    {
      statement: "Distance from the Sun causes seasons.",
      rationale: "This is a common model worth checking.",
      status: "hypothesis",
    },
  ],
  diagnosticQuestion: {
    prompt: "What best explains opposite seasons across hemispheres?",
    whyUseful: "It distinguishes tilt from distance models.",
    options: [
      {
        label: "A",
        answer: "Earth's axial tilt",
        possibleInterpretation: "May suggest: the tilt model is available.",
      },
      {
        label: "B",
        answer: "Earth-Sun distance",
        possibleInterpretation: "Could indicate a distance-based model.",
      },
    ],
  },
};

test("journey advances only when plan and assessment state exist", () => {
  assert.equal(getJourneyStep(false, false), 1);
  assert.equal(getJourneyStep(true, false), 2);
  assert.equal(getJourneyStep(true, true), 3);
});

test("evaluation requires an option and meaningful explanation", () => {
  assert.equal(canSubmitEvaluation(null, "A sufficiently long explanation.", false), false);
  assert.equal(canSubmitEvaluation(0, "Too short", false), false);
  assert.equal(
    canSubmitEvaluation(0, "I chose this because the tilt changes sunlight angle.", false),
    true,
  );
  assert.equal(
    canSubmitEvaluation(0, "I chose this because the tilt changes sunlight angle.", true),
    false,
  );
});

test("duplicate tentative prefixes are removed before display", () => {
  assert.equal(
    cleanInterpretationPrefix("May suggest: a distance-based model."),
    "a distance-based model.",
  );
  assert.equal(
    cleanInterpretationPrefix("Could indicate conceptual consistency."),
    "conceptual consistency.",
  );
});

test("evaluation request rejects an option outside the supplied plan", () => {
  const baseRequest = {
    originalQuestion: "Why do seasons change on Earth?",
    language: "English",
    plan,
    explanation: "I think tilt changes the angle and duration of sunlight.",
  } as const;

  const invalidOption = evaluateRequestSchema.safeParse({
    ...baseRequest,
    selectedOptionIndex: 3,
  });
  const shortExplanation = evaluateRequestSchema.safeParse({
    ...baseRequest,
    selectedOptionIndex: 0,
    explanation: "Because tilt.",
  });
  const validRequest = evaluateRequestSchema.safeParse({
    ...baseRequest,
    selectedOptionIndex: 0,
  });

  assert.equal(invalidOption.success, false);
  assert.equal(shortExplanation.success, false);
  assert.equal(validRequest.success, true);
});

test("assessment schema accepts uncertainty without claiming correctness", () => {
  const result = adaptiveAssessmentSchema.safeParse({
    understandingLevel: "uncertain",
    isAnswerConsistentWithConcept: null,
    observedEvidence: ["The explanation does not identify a causal mechanism."],
    possibleKnowledgeGap: null,
    tailoredFeedback: "Your answer gives us a useful starting point.",
    recommendedNextAction: "clarify",
    recommendedNextConcept: "Earth's axial tilt",
    microLesson: "Axial tilt changes the angle and duration of incoming sunlight.",
    followUpQuestion: "How would this create opposite seasons across hemispheres?",
  });

  assert.equal(result.success, true);
});
