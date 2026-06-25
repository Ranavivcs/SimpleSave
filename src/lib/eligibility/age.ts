/**
 * Age & loan-term calculations — pure, no I/O.
 *
 * The loan must be repaid before the OLDEST borrower reaches `loanTermAgeCap`
 * (default 85), so the term ceiling is `ageCap − oldestAge` (whole years).
 */

import type { EligibilityBorrower } from "../contracts/eligibility";

/** Whole years between `birthDate` and `asOf`. */
export function ageInYears(birthDate: string, asOf: Date): number {
  const b = new Date(birthDate);
  let age = asOf.getFullYear() - b.getFullYear();
  const monthDelta = asOf.getMonth() - b.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && asOf.getDate() < b.getDate())) {
    age--;
  }
  return age;
}

/** Age of the oldest borrower (0 if the list is empty). */
export function oldestAge(
  borrowers: EligibilityBorrower[],
  asOf: Date,
): number {
  return borrowers.reduce(
    (max, b) => Math.max(max, ageInYears(b.birthDate, asOf)),
    0,
  );
}

/** Max loan term in whole years, capped so the oldest reaches `ageCap` at payoff. */
export function maxLoanTermYears(
  borrowers: EligibilityBorrower[],
  ageCap: number,
  asOf: Date,
): number {
  return Math.max(0, Math.floor(ageCap - oldestAge(borrowers, asOf)));
}
