/**
 * New-mortgage questionnaire — the production config for the "משכנתא חדשה" guest
 * flow (Phase 3). Pure data + pure mapping/validation; no UI, no DB.
 *
 * Question content/order follows the client spec. All user-facing text is an
 * i18n key (`newMortgage.*` in messages/he.json) — nothing inlined.
 *
 * The two product questions — loan TYPE and property SOURCE — combine into the
 * single `PurchaseType` the eligibility engine consumes; that engine
 * (src/lib/eligibility) remains the single source of truth for every LTV cap,
 * the equity rules, and the 40% repayment ratio. We add no numeric constants.
 */

import type {
  Questionnaire,
  QuestionnaireAnswer,
  ValidationError,
} from "@/lib/questionnaire";
import {
  DEFAULT_ELIGIBILITY_LIMITS,
  maxMonthlyPayment,
  requiredEquity,
  type EligibilityInput,
  type EligibilityLimits,
  type PurchaseType,
} from "@/lib/eligibility";

/** Loan types the customer picks (each maps 1:1 onto a PurchaseType). */
const LOAN_TYPES = ["single", "housingImprovement", "additional", "allPurpose"] as const;
/** Where the property comes from. Only "mechirLamishtaken" changes the LTV. */
const PROPERTY_SOURCES = ["contractor", "secondHand", "mechirLamishtaken", "selfBuild"] as const;

export const newMortgageQuestionnaire: Questionnaire = {
  id: "new-mortgage",
  variant: "new",
  titleKey: "newMortgage.title",
  minBorrowers: 1,
  maxBorrowers: 5,
  sections: [
    {
      id: "loanProperty",
      titleKey: "newMortgage.sections.loanProperty",
      fields: [
        {
          id: "loanType",
          type: "choice",
          labelKey: "newMortgage.fields.loanType",
          helpKey: "newMortgage.help.loanType",
          required: true,
          options: LOAN_TYPES.map((v) => ({ value: v, labelKey: `newMortgage.loanType.${v}` })),
        },
        {
          id: "propertySource",
          type: "choice",
          labelKey: "newMortgage.fields.propertySource",
          helpKey: "newMortgage.help.propertySource",
          required: true,
          options: PROPERTY_SOURCES.map((v) => ({ value: v, labelKey: `newMortgage.propertySource.${v}` })),
        },
        {
          id: "propertyValue",
          type: "number",
          labelKey: "newMortgage.fields.propertyValue",
          helpKey: "newMortgage.help.propertyValue",
          required: true,
          min: 0,
          step: 10000,
        },
        {
          id: "equity",
          type: "number",
          labelKey: "newMortgage.fields.equity",
          helpKey: "newMortgage.help.equity",
          required: true,
          min: 0,
          step: 10000,
        },
      ],
    },
    {
      id: "borrowers",
      titleKey: "newMortgage.sections.borrowers",
      fields: [
        {
          id: "borrowerName",
          type: "text",
          labelKey: "newMortgage.fields.borrowerName",
          helpKey: "newMortgage.help.borrowerName",
          required: true,
          perBorrower: true,
        },
        {
          id: "birthDate",
          type: "date",
          labelKey: "newMortgage.fields.birthDate",
          helpKey: "newMortgage.help.birthDate",
          required: true,
          perBorrower: true,
        },
        {
          id: "netMonthlyIncome",
          type: "number",
          labelKey: "newMortgage.fields.netMonthlyIncome",
          helpKey: "newMortgage.help.netMonthlyIncome",
          required: true,
          perBorrower: true,
          min: 0,
          step: 500,
        },
        {
          id: "isPropertyOwner",
          type: "yesno",
          labelKey: "newMortgage.fields.isPropertyOwner",
          helpKey: "newMortgage.help.isPropertyOwner",
          required: true,
          perBorrower: true,
        },
      ],
    },
    {
      id: "capacity",
      titleKey: "newMortgage.sections.capacity",
      fields: [
        {
          id: "additionalIncome",
          type: "number",
          labelKey: "newMortgage.fields.additionalIncome",
          helpKey: "newMortgage.help.additionalIncome",
          min: 0,
          step: 500,
        },
        {
          id: "fixedExpenses",
          type: "number",
          labelKey: "newMortgage.fields.fixedExpenses",
          helpKey: "newMortgage.help.fixedExpenses",
          min: 0,
          step: 500,
        },
        {
          id: "desiredPaymentMin",
          type: "number",
          labelKey: "newMortgage.fields.desiredPaymentMin",
          helpKey: "newMortgage.help.desiredPayment",
          required: true,
          min: 0,
          step: 100,
        },
        {
          id: "desiredPaymentMax",
          type: "number",
          labelKey: "newMortgage.fields.desiredPaymentMax",
          required: true,
          min: 0,
          step: 100,
        },
      ],
    },
  ],
};

const num = (v: unknown) => (typeof v === "number" ? v : 0);
const grouped = new Intl.NumberFormat("he-IL", { maximumFractionDigits: 0 });

/**
 * Map a completed new-mortgage answer onto the eligibility engine's input.
 * Effective purchase type: Mechir LaMishtaken (a property *source*) overrides
 * to the 90% program; otherwise the chosen loan type drives the cap. The loan
 * amount is derived (value − equity) since the spec has no separate loan field.
 */
export function answerToEligibilityInput(a: QuestionnaireAnswer): EligibilityInput {
  const source = a.values.propertySource as string | undefined;
  const loanType = (a.values.loanType as PurchaseType) ?? "single";
  const purchaseType: PurchaseType =
    source === "mechirLamishtaken" ? "mechirLamishtaken" : loanType;
  const propertyValue = num(a.values.propertyValue);
  const equity = num(a.values.equity);
  return {
    purchaseType,
    propertyValue,
    equity,
    requestedLoan: Math.max(0, propertyValue - equity),
    extraMonthlyIncome: num(a.values.additionalIncome),
    fixedMonthlyExpenses: num(a.values.fixedExpenses),
    borrowers: a.borrowers.map((b) => ({
      birthDate: (b.birthDate as string) ?? "",
      netMonthlyIncome: num(b.netMonthlyIncome),
      // Owner of the property = mortgagor (income counts fully). A non-owner's
      // income counts only at `nonMortgagorIncomeFactor` (default 50%).
      isMortgagor: b.isPropertyOwner !== false,
    })),
  };
}

/**
 * Cross-field rules the generic per-field engine can't express. Returns errors
 * keyed by answer path (the wizard merges them with static validation and shows
 * them live). All thresholds come from the eligibility engine — no constants.
 */
export function validateNewMortgage(
  a: QuestionnaireAnswer,
  limits: EligibilityLimits = DEFAULT_ELIGIBILITY_LIMITS,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const input = answerToEligibilityInput(a);

  // Equity checks — only once a property value and an equity figure are present.
  if (input.propertyValue > 0 && a.values.equity != null) {
    if (input.equity >= input.propertyValue) {
      // Equity can't equal/exceed the property value (loan would be ≤ 0).
      errors.push({
        path: "values.equity",
        fieldId: "equity",
        code: "max",
        messageKey: "newMortgage.errors.equityExceedsValue",
      });
    } else {
      const needed = requiredEquity(input, limits);
      if (input.equity < needed) {
        errors.push({
          path: "values.equity",
          fieldId: "equity",
          code: "min",
          messageKey: "newMortgage.errors.minEquity",
          params: { pct: Math.round((needed / input.propertyValue) * 100), amount: grouped.format(needed) },
        });
      }
    }
  }

  // Desired monthly payment — max ≤ repayment ratio of net income; min ≤ max.
  const min = a.values.desiredPaymentMin;
  const max = a.values.desiredPaymentMax;
  const cap = maxMonthlyPayment(input, limits);
  if (typeof max === "number" && cap > 0 && max > cap) {
    errors.push({
      path: "values.desiredPaymentMax",
      fieldId: "desiredPaymentMax",
      code: "max",
      messageKey: "newMortgage.errors.maxPayment",
      params: { ratioPct: Math.round(limits.maxRepaymentRatio * 100), cap: grouped.format(cap) },
    });
  }
  if (typeof min === "number" && typeof max === "number" && min > max) {
    errors.push({
      path: "values.desiredPaymentMin",
      fieldId: "desiredPaymentMin",
      code: "max",
      messageKey: "newMortgage.errors.rangeOrder",
    });
  }
  return errors;
}
