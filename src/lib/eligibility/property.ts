/**
 * LTV & equity calculations — pure, no I/O.
 *
 * The LTV cap depends on the purchase type. Required equity is the larger of:
 * the LTV complement (1 − cap), the global minimum-equity ratio (unless the
 * type is exempt, e.g. Mechir LaMishtaken), and any absolute ₪ floor.
 */

import type {
  EligibilityInput,
  EligibilityLimits,
  PurchaseType,
} from "../contracts/eligibility";

/** Max loan-to-value (decimal) for a purchase type. */
export function ltvCapFor(
  purchaseType: PurchaseType,
  limits: EligibilityLimits,
): number {
  return limits.ltvByPurchase[purchaseType];
}

/** Loan ceiling from LTV: propertyValue × cap (₪), rounded to the shekel. */
export function maxLoanByLtv(
  input: EligibilityInput,
  limits: EligibilityLimits,
): number {
  return Math.round(input.propertyValue * ltvCapFor(input.purchaseType, limits));
}

/** Minimum borrower equity required (₪), rounded to the shekel. */
export function requiredEquity(
  input: EligibilityInput,
  limits: EligibilityLimits,
): number {
  const cap = ltvCapFor(input.purchaseType, limits);
  let req = input.propertyValue * (1 - cap);
  if (!limits.minEquityExemptTypes.includes(input.purchaseType)) {
    req = Math.max(req, input.propertyValue * limits.minEquityRatio);
  }
  const minAmount = limits.minEquityAmountByPurchase?.[input.purchaseType];
  if (minAmount !== undefined) req = Math.max(req, minAmount);
  return Math.round(req);
}

/** Binding loan ceiling: min(LTV ceiling, value − requiredEquity) (₪). */
export function maxLoanAmount(
  input: EligibilityInput,
  limits: EligibilityLimits,
): number {
  return Math.min(
    maxLoanByLtv(input, limits),
    Math.round(input.propertyValue - requiredEquity(input, limits)),
  );
}
