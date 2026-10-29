export type LabStage = "prediction" | "exploration";
export type LabEvent = "reveal" | "reset";

export function transitionLabStage(
  stage: LabStage,
  event: LabEvent,
  hasPrediction = false,
): LabStage {
  if (event === "reset") return "prediction";
  return stage === "prediction" && hasPrediction ? "exploration" : stage;
}

