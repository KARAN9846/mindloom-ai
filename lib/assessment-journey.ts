export type JourneyStep = 1 | 2 | 3;

export function getJourneyStep(
  hasDiagnosticPlan: boolean,
  hasAssessment: boolean,
): JourneyStep {
  if (hasAssessment) {
    return 3;
  }

  return hasDiagnosticPlan ? 2 : 1;
}

export function canSubmitEvaluation(
  selectedOptionIndex: number | null,
  explanation: string,
  isLoading: boolean,
): boolean {
  const explanationLength = explanation.trim().length;

  return (
    selectedOptionIndex !== null &&
    explanationLength >= 20 &&
    explanationLength <= 1000 &&
    !isLoading
  );
}

export function cleanInterpretationPrefix(value: string): string {
  return value
    .replace(/^(may|might)\s+suggest\s*:?\s*/i, "")
    .replace(/^could\s+indicate\s*:?\s*/i, "")
    .trim();
}
