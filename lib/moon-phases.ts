export type MoonPhaseKey =
  | "new_moon"
  | "waxing_crescent"
  | "first_quarter"
  | "waxing_gibbous"
  | "full_moon"
  | "waning_gibbous"
  | "third_quarter"
  | "waning_crescent";

const MOON_PHASE_SEQUENCE: readonly MoonPhaseKey[] = [
  "new_moon",
  "waxing_crescent",
  "first_quarter",
  "waxing_gibbous",
  "full_moon",
  "waning_gibbous",
  "third_quarter",
  "waning_crescent",
];

export function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

export function illuminatedFraction(angle: number): number {
  const radians = (normalizeAngle(angle) * Math.PI) / 180;
  return (1 - Math.cos(radians)) / 2;
}

export function getMoonPhaseKey(angle: number): MoonPhaseKey {
  const normalized = normalizeAngle(angle);

  if (normalized < 22.5 || normalized >= 337.5) return "new_moon";
  if (normalized < 67.5) return "waxing_crescent";
  if (normalized < 112.5) return "first_quarter";
  if (normalized < 157.5) return "waxing_gibbous";
  if (normalized < 202.5) return "full_moon";
  if (normalized < 247.5) return "waning_gibbous";
  if (normalized < 292.5) return "third_quarter";
  return "waning_crescent";
}

/**
 * Builds four deterministic, evenly spaced choices for a prediction gate.
 * The correct answer changes position so its placement does not become a cue.
 */
export function getMoonPredictionPhaseKeys(angle: number): MoonPhaseKey[] {
  const observed = getMoonPhaseKey(angle);
  const observedIndex = MOON_PHASE_SEQUENCE.indexOf(observed);
  const candidates = [0, 2, 4, 6].map(
    (offset) => MOON_PHASE_SEQUENCE[(observedIndex + offset) % MOON_PHASE_SEQUENCE.length],
  );
  const correctSlot = Math.floor(normalizeAngle(angle) / 22.5) % candidates.length;

  return candidates.map(
    (_, index) => candidates[(index - correctSlot + candidates.length) % candidates.length],
  );
}

export function compareMoonPrediction(prediction: MoonPhaseKey, angle: number) {
  const observed = getMoonPhaseKey(angle);
  return {
    predicted: prediction,
    observed,
    isCorrect: prediction === observed,
  };
}

export function getOrbitPosition(
  angle: number,
  centerX: number,
  centerY: number,
  radius: number,
) {
  const radians = (normalizeAngle(angle) * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(radians),
    y: centerY - radius * Math.sin(radians),
  };
}

export function getIlluminatedDiscPath(angle: number, radius = 48): string {
  const normalized = normalizeAngle(angle);
  const waxing = normalized <= 180;
  const phaseAngle = waxing ? normalized : 360 - normalized;
  const terminatorScale = Math.cos((phaseAngle * Math.PI) / 180);
  const steps = 32;
  const points: Array<{ x: number; y: number }> = [];

  for (let index = 0; index <= steps; index += 1) {
    const y = -radius + (index / steps) * radius * 2;
    const limbX = Math.sqrt(Math.max(0, radius * radius - y * y));
    points.push({ x: waxing ? limbX : terminatorScale * -limbX, y });
  }

  for (let index = steps; index >= 0; index -= 1) {
    const y = -radius + (index / steps) * radius * 2;
    const limbX = Math.sqrt(Math.max(0, radius * radius - y * y));
    points.push({ x: waxing ? terminatorScale * limbX : -limbX, y });
  }

  return `${points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ")} Z`;
}

