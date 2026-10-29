import type { LabType } from "@/lib/learning-lab-schema";

const MOON_TOPIC = /\b(moon|lunar|phase|waxing|waning|crescent|gibbous)\b/i;
const COMPOUND_TOPIC = /\b(compound interest|compounding|interest on interest|savings growth)\b/i;

export function selectLabType(goal: string, nextConcept: string): LabType {
  const topic = `${goal} ${nextConcept}`;

  if (MOON_TOPIC.test(topic)) {
    return "moon_phases";
  }

  if (COMPOUND_TOPIC.test(topic)) {
    return "compound_interest";
  }

  return "concept_comparison";
}

