/**
 * Repayment-capacity calculations — pure, no I/O.
 *
 * Qualifying income weights non-mortgagor (לא ממשכן) borrowers down to
 * `nonMortgagorIncomeFactor`, adds extra income, and subtracts fixed expenses.
 * The capacity ceiling is that income × `maxRepaymentRatio`.
 */

import type {
  EligibilityInput,
  EligibilityLimits,
} from "../contracts/eligibility";

/** Weighted net monthly income that counts toward repayment capacity (₪). */
export function qualifyingIncome(
  input: EligibilityInput,
  limits: EligibilityLimits,
): number {
  const fromBorrowers = input.borrowers.reduce((sum, b) => {
    const factor = b.isMortgagor ? 1 : limits.nonMortgagorIncomeFactor;
    return sum + b.netMonthlyIncome * factor;
  }, 0);
  const net =
    fromBorrowers +
    (input.extraMonthlyIncome ?? 0) -
    (input.fixedMonthlyExpenses ?? 0);
  return Math.max(0, net);
}

/** Maximum affordable monthly payment (₪) = qualifying income × ratio. */
export function maxMonthlyPayment(
  input: EligibilityInput,
  limits: EligibilityLimits,
): number {
  return qualifyingIncome(input, limits) * limits.maxRepaymentRatio;
}

/** Whether a candidate monthly payment fits within capacity (used at the dials phase). */
export function withinCapacity(
  monthlyPayment: number,
  input: EligibilityInput,
  limits: EligibilityLimits,
): boolean {
  return monthlyPayment <= maxMonthlyPayment(input, limits) + 1e-6;
}
