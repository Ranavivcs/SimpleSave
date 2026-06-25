/**
 * Eligibility & repayment-capacity contracts — the typed objects in/out of the
 * eligibility engine (`src/lib/eligibility`). Pure data; no UI, no DB.
 *
 * The engine is config-driven: every regulatory limit is passed in as
 * `EligibilityLimits` (resolved from admin config / `GlobalParameters`), never
 * hardcoded in the logic — same pattern as the calc engine consuming resolved
 * rates. `DEFAULT_ELIGIBILITY_LIMITS` (in the engine index) mirrors the seeded
 * config defaults.
 *
 * Enum keys here are English (internal discriminants); user-facing labels are
 * resolved via i18n. (Domain *math* values stay Hebrew in the calc engine to
 * match the simulator — this is new platform logic, so English is clearer.)
 */

/** Purchase type — drives the LTV cap and equity rule. */
export type PurchaseType =
  | "single" // דירה יחידה
  | "additional" // דירה נוספת / משקיעים
  | "allPurpose" // כל מטרה
  | "housingImprovement" // שיפור דיור
  | "mechirLamishtaken"; // מחיר למשתכן

/** The eligibility-relevant subset of a borrower. */
export interface EligibilityBorrower {
  /** ISO date (YYYY-MM-DD). */
  birthDate: string;
  /** Net monthly income (₪). */
  netMonthlyIncome: number;
  /**
   * Is this borrower a mortgagor (ממשכן)? A non-mortgagor's income counts only
   * at `nonMortgagorIncomeFactor` (default 50%) toward repayment capacity.
   */
  isMortgagor: boolean;
}

/** Everything the engine needs to assess a request. */
export interface EligibilityInput {
  purchaseType: PurchaseType;
  /** Appraised / purchase value of the property (₪). */
  propertyValue: number;
  /** Desired loan amount (₪). */
  requestedLoan: number;
  /** Borrower's own funds toward the purchase (₪). */
  equity: number;
  borrowers: EligibilityBorrower[];
  /** Extra income beyond borrower salaries (₪/month). */
  extraMonthlyIncome?: number;
  /** Existing fixed obligations (₪/month) subtracted from capacity. */
  fixedMonthlyExpenses?: number;
}

/** Regulatory limits — resolved from config; the engine never hardcodes these. */
export interface EligibilityLimits {
  /** Max loan-to-value per purchase type (decimal, e.g. 0.75). */
  ltvByPurchase: Record<PurchaseType, number>;
  /** Max monthly repayment as a fraction of qualifying net income (e.g. 0.40). */
  maxRepaymentRatio: number;
  /** The loan must be repaid before the oldest borrower reaches this age. */
  loanTermAgeCap: number;
  /** Global minimum equity as a fraction of property value (e.g. 0.25). */
  minEquityRatio: number;
  /** Purchase types exempt from `minEquityRatio` (e.g. Mechir LaMishtaken). */
  minEquityExemptTypes: PurchaseType[];
  /** Absolute minimum equity (₪) per purchase type — a floor on requiredEquity. */
  minEquityAmountByPurchase?: Partial<Record<PurchaseType, number>>;
  /** Fraction of a non-mortgagor borrower's income that counts (e.g. 0.5). */
  nonMortgagorIncomeFactor: number;
  minBorrowers: number;
  maxBorrowers: number;
}

export type EligibilityViolationCode =
  | "borrowerCountOutOfRange"
  | "loanExceedsValue"
  | "ltvExceeded"
  | "insufficientEquity";

export interface EligibilityViolation {
  code: EligibilityViolationCode;
  /** i18n key, always `eligibility.<code>`. */
  messageKey: string;
  params?: Record<string, string | number>;
}

/**
 * The borrowing envelope + structural checks. Affordability of a *specific*
 * mix is checked at the dials phase (needs rates) via `maxMonthlyPayment`.
 */
export interface EligibilityResult {
  /** True when there are no structural violations. */
  eligible: boolean;
  violations: EligibilityViolation[];

  /** Applied LTV cap (decimal). */
  ltvCap: number;
  /** Loan ceiling from LTV: propertyValue × ltvCap (₪). */
  maxLoanByLtv: number;
  /** Minimum borrower equity required (₪). */
  requiredEquity: number;
  /** Binding loan ceiling: min(LTV ceiling, value − requiredEquity) (₪). */
  maxLoanAmount: number;

  /** Weighted net income that counts toward capacity (₪/month). */
  qualifyingMonthlyIncome: number;
  /** Capacity ceiling: qualifyingMonthlyIncome × maxRepaymentRatio (₪/month). */
  maxMonthlyPayment: number;

  /** Age of the oldest borrower at assessment. */
  oldestBorrowerAge: number;
  /** Max loan term in whole years, capped by `loanTermAgeCap`. */
  maxLoanTermYears: number;
}
