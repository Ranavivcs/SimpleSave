/**
 * SimpleSave eligibility & repayment-capacity engine — pure, framework-free,
 * fully testable. No UI, no DB, no I/O.
 *
 * Computes the borrowing envelope (LTV ceiling, required equity, capacity
 * ceiling, age-based term cap) from an `EligibilityInput` + resolved
 * `EligibilityLimits`, and flags structural violations of a requested loan.
 *
 * Affordability of a *specific* mix (its monthly payment) is checked at the
 * dials phase via `withinCapacity` / `maxMonthlyPayment`, since the payment
 * needs rates (Phase 2 config) the engine deliberately does not consume.
 */

import type {
  EligibilityInput,
  EligibilityLimits,
  EligibilityResult,
  EligibilityViolation,
  EligibilityViolationCode,
} from "../contracts/eligibility";
import { maxMonthlyPayment, qualifyingIncome, withinCapacity } from "./income";
import { ltvCapFor, maxLoanAmount, maxLoanByLtv, requiredEquity } from "./property";
import { maxLoanTermYears, oldestAge } from "./age";

export { qualifyingIncome, maxMonthlyPayment, withinCapacity } from "./income";
export { ltvCapFor, maxLoanByLtv, requiredEquity, maxLoanAmount } from "./property";
export { ageInYears, oldestAge, maxLoanTermYears } from "./age";
export type {
  EligibilityInput,
  EligibilityLimits,
  EligibilityResult,
  EligibilityViolation,
  EligibilityViolationCode,
  EligibilityBorrower,
  PurchaseType,
} from "../contracts/eligibility";

/**
 * Default limits — mirror the seeded `GlobalParameters` config (Phase 2B) and
 * the confirmed business rules (rules.MD §4). Admin overrides these via config;
 * the engine always takes them as a parameter.
 *
 * NOTE: the ₪100k Mechir-LaMishtaken floor is read as a minimum-equity amount
 * ("min ₪100k ≈ 10% equity") — confirm with the client if it means min loan.
 */
export const DEFAULT_ELIGIBILITY_LIMITS: EligibilityLimits = {
  ltvByPurchase: {
    single: 0.75,
    additional: 0.5,
    allPurpose: 0.5,
    housingImprovement: 0.7,
    mechirLamishtaken: 0.9,
  },
  maxRepaymentRatio: 0.4,
  loanTermAgeCap: 85,
  minEquityRatio: 0.25,
  minEquityExemptTypes: ["mechirLamishtaken"],
  minEquityAmountByPurchase: { mechirLamishtaken: 100000 },
  nonMortgagorIncomeFactor: 0.5,
  minBorrowers: 1,
  maxBorrowers: 5,
};

function violation(
  code: EligibilityViolationCode,
  params?: Record<string, string | number>,
): EligibilityViolation {
  return { code, messageKey: `eligibility.${code}`, params };
}

/**
 * Assess a request against the limits. `asOf` (default now) anchors age
 * calculation — pass an explicit date for deterministic results/tests.
 */
export function assessEligibility(
  input: EligibilityInput,
  limits: EligibilityLimits = DEFAULT_ELIGIBILITY_LIMITS,
  asOf: Date = new Date(),
): EligibilityResult {
  const ltvCap = ltvCapFor(input.purchaseType, limits);
  const ltvCeiling = maxLoanByLtv(input, limits);
  const equityNeeded = requiredEquity(input, limits);
  const loanCeiling = maxLoanAmount(input, limits);
  const income = qualifyingIncome(input, limits);
  const paymentCeiling = maxMonthlyPayment(input, limits);
  const age = oldestAge(input.borrowers, asOf);
  const termCap = maxLoanTermYears(input.borrowers, limits.loanTermAgeCap, asOf);

  const violations: EligibilityViolation[] = [];

  const count = input.borrowers.length;
  if (count < limits.minBorrowers || count > limits.maxBorrowers) {
    violations.push(
      violation("borrowerCountOutOfRange", {
        min: limits.minBorrowers,
        max: limits.maxBorrowers,
      }),
    );
  }
  if (input.requestedLoan > input.propertyValue) {
    violations.push(violation("loanExceedsValue"));
  }
  if (input.requestedLoan > ltvCeiling) {
    violations.push(
      violation("ltvExceeded", {
        ltvPct: Math.round(ltvCap * 100),
        maxLoan: ltvCeiling,
      }),
    );
  }
  if (input.equity < equityNeeded) {
    violations.push(violation("insufficientEquity", { requiredEquity: equityNeeded }));
  }

  return {
    eligible: violations.length === 0,
    violations,
    ltvCap,
    maxLoanByLtv: ltvCeiling,
    requiredEquity: equityNeeded,
    maxLoanAmount: loanCeiling,
    qualifyingMonthlyIncome: income,
    maxMonthlyPayment: paymentCeiling,
    oldestBorrowerAge: age,
    maxLoanTermYears: termCap,
  };
}
