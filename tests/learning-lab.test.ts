import assert from "node:assert/strict";
import test from "node:test";

import {
  buildInterestTable,
  compoundInterestBalance,
  simpleInterestBalance,
} from "../lib/interest-calculations.ts";
import {
  labRequestSchema,
  learningLabSchema,
} from "../lib/learning-lab-schema.ts";
import { selectLabType } from "../lib/learning-lab-selection.ts";
import { transitionLabStage } from "../lib/learning-lab-state.ts";
import {
  compareMoonPrediction,
  getMoonPhaseKey,
  getMoonPredictionPhaseKeys,
  getOrbitPosition,
  illuminatedFraction,
} from "../lib/moon-phases.ts";

const commonLab = {
  title: "Explore the concept",
  learningObjective: "Notice how one variable changes the outcome.",
  shortInstructions: "Predict first, then change the control.",
  predictionQuestion: "What do you expect to observe?",
  observationPrompts: ["What changes?"],
  explanation: "The model links the changing variable to the outcome.",
  selectedLanguage: "English" as const,
};

test("moon phase geometry matches the four key positions", () => {
  assert.equal(illuminatedFraction(0), 0);
  assert.ok(Math.abs(illuminatedFraction(90) - 0.5) < 1e-12);
  assert.equal(illuminatedFraction(180), 1);
  assert.ok(Math.abs(illuminatedFraction(270) - 0.5) < 1e-12);
  assert.equal(getMoonPhaseKey(0), "new_moon");
  assert.equal(getMoonPhaseKey(90), "first_quarter");
  assert.equal(getMoonPhaseKey(180), "full_moon");
  assert.equal(getMoonPhaseKey(270), "third_quarter");

  const position = getOrbitPosition(90, 100, 100, 40);
  assert.ok(Math.abs(position.x - 100) < 1e-12);
  assert.equal(position.y, 60);
});

test("moon prediction choices are deterministic, distinct, and include the observed phase", () => {
  const first = getMoonPredictionPhaseKeys(135);
  const second = getMoonPredictionPhaseKeys(135);

  assert.deepEqual(first, second);
  assert.equal(first.length, 4);
  assert.equal(new Set(first).size, 4);
  assert.ok(first.includes(getMoonPhaseKey(135)));
  assert.notEqual(first.indexOf(getMoonPhaseKey(90)), getMoonPredictionPhaseKeys(90).indexOf(getMoonPhaseKey(90)));
});

test("moon prediction comparison reports both correct and incorrect observations", () => {
  assert.deepEqual(compareMoonPrediction("full_moon", 180), {
    predicted: "full_moon",
    observed: "full_moon",
    isCorrect: true,
  });
  assert.deepEqual(compareMoonPrediction("new_moon", 180), {
    predicted: "new_moon",
    observed: "full_moon",
    isCorrect: false,
  });
});

test("interest calculations use deterministic simple and annual compound formulas", () => {
  assert.equal(simpleInterestBalance(1000, 10, 2), 1200);
  assert.ok(Math.abs(compoundInterestBalance(1000, 10, 2) - 1210) < 1e-9);

  const table = buildInterestTable(1000, 10, 2);
  assert.equal(table.length, 3);
  assert.equal(table[0]?.compoundBalance, 1000);
  assert.ok(Math.abs((table[2]?.difference ?? 0) - 10) < 1e-9);
});

test("lab schema accepts every trusted lab and rejects arbitrary configuration", () => {
  const options = [
    { id: "a", text: "The first outcome" },
    { id: "b", text: "The second outcome" },
  ];

  const moon = learningLabSchema.safeParse({
    ...commonLab,
    labType: "moon_phases",
    initialConfiguration: { initialOrbitAngle: 90, predictionOptions: options },
  });
  const interest = learningLabSchema.safeParse({
    ...commonLab,
    labType: "compound_interest",
    initialConfiguration: {
      principal: 1000,
      annualRatePercent: 8,
      years: 10,
      predictionOptions: options,
    },
  });
  const comparison = learningLabSchema.safeParse({
    ...commonLab,
    labType: "concept_comparison",
    initialConfiguration: {
      comparisonDimension: "Cause and effect",
      scenarioA: { title: "A", setup: "First setup", keyObservations: ["One result"] },
      scenarioB: { title: "B", setup: "Second setup", keyObservations: ["Another result"] },
      predictionOptions: options,
    },
  });
  const executablePayload = learningLabSchema.safeParse({
    ...commonLab,
    labType: "concept_comparison",
    initialConfiguration: {
      comparisonDimension: "Unsafe",
      scenarioA: { title: "A", setup: "First", keyObservations: ["One"] },
      scenarioB: { title: "B", setup: "Second", keyObservations: ["Two"] },
      predictionOptions: options,
      javascript: "alert('unsafe')",
    },
  });

  assert.equal(moon.success, true);
  assert.equal(interest.success, true);
  assert.equal(comparison.success, true);
  assert.equal(executablePayload.success, false);
});

test("lab selection routes supported topics and safely falls back to comparison", () => {
  assert.equal(selectLabType("Why does the Moon have phases?", "Lunar illumination"), "moon_phases");
  assert.equal(selectLabType("How does compound interest work?", "Interest on interest"), "compound_interest");
  assert.equal(selectLabType("Why do supply curves slope upward?", "Opportunity cost"), "concept_comparison");
});

test("lab request binds recommendations to the supplied assessment", () => {
  const assessment = {
    understandingLevel: "partial" as const,
    isAnswerConsistentWithConcept: true,
    observedEvidence: ["The learner identified the main relationship."],
    possibleKnowledgeGap: "The mechanism is not yet explicit.",
    tailoredFeedback: "You have the core relationship.",
    recommendedNextAction: "advance" as const,
    recommendedNextConcept: "Lunar illumination",
    microLesson: "Half of the Moon is always lit by the Sun.",
    followUpQuestion: "What changes as the Moon orbits Earth?",
  };
  const base = {
    originalLearningGoal: "Why does the Moon appear to change shape?",
    language: "English",
    assessment,
    recommendedNextAction: "advance",
    recommendedNextConcept: "Lunar illumination",
  };

  assert.equal(labRequestSchema.safeParse(base).success, true);
  assert.equal(
    labRequestSchema.safeParse({ ...base, recommendedNextConcept: "Unrelated concept" }).success,
    false,
  );
});

test("lab state requires prediction reveal and can reset deterministically", () => {
  assert.equal(transitionLabStage("prediction", "reveal", false), "prediction");
  assert.equal(transitionLabStage("prediction", "reveal", true), "exploration");
  assert.equal(transitionLabStage("exploration", "reveal", true), "exploration");
  assert.equal(transitionLabStage("exploration", "reset"), "prediction");
});

