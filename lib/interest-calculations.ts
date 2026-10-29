export type InterestRow = {
  year: number;
  simpleBalance: number;
  compoundBalance: number;
  difference: number;
};

function assertInputs(principal: number, annualRatePercent: number, years: number) {
  if (
    !Number.isFinite(principal) ||
    !Number.isFinite(annualRatePercent) ||
    !Number.isInteger(years) ||
    principal < 0 ||
    annualRatePercent < 0 ||
    years < 0
  ) {
    throw new RangeError("Interest inputs must be finite, non-negative values.");
  }
}

export function simpleInterestBalance(
  principal: number,
  annualRatePercent: number,
  years: number,
): number {
  assertInputs(principal, annualRatePercent, years);
  return principal * (1 + (annualRatePercent / 100) * years);
}

export function compoundInterestBalance(
  principal: number,
  annualRatePercent: number,
  years: number,
): number {
  assertInputs(principal, annualRatePercent, years);
  return principal * (1 + annualRatePercent / 100) ** years;
}

export function buildInterestTable(
  principal: number,
  annualRatePercent: number,
  years: number,
): InterestRow[] {
  assertInputs(principal, annualRatePercent, years);

  return Array.from({ length: years + 1 }, (_, year) => {
    const simpleBalance = simpleInterestBalance(principal, annualRatePercent, year);
    const compoundBalance = compoundInterestBalance(principal, annualRatePercent, year);

    return {
      year,
      simpleBalance,
      compoundBalance,
      difference: compoundBalance - simpleBalance,
    };
  });
}

