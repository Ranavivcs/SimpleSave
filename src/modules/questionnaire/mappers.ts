/**
 * Maps a completed `QuestionnaireAnswer` onto the eligibility engine's typed
 * input. Shared across questionnaire variants — they follow the same field-id
 * convention (purchaseType / propertyValue / requestedLoan / equity / income /
 * expenses, and per-borrower birthDate / netMonthlyIncome / isMortgagor).
 *
 * This is the questionnaire→engine seam on OUR side. The dials (Phase 3C) will
 * consume the same shape via the resolver the 3C branch is building.
 */
import type { QuestionnaireAnswer } from "@/lib/questionnaire";
import type { EligibilityInput, PurchaseType } from "@/lib/eligibility";

export function answerToEligibilityInput(a: QuestionnaireAnswer): EligibilityInput {
  const num = (v: unknown) => (typeof v === "number" ? v : 0);
  return {
    purchaseType: (a.values.purchaseType as PurchaseType) ?? "single",
    propertyValue: num(a.values.propertyValue),
    requestedLoan: num(a.values.requestedLoan),
    equity: num(a.values.equity),
    extraMonthlyIncome: num(a.values.extraMonthlyIncome),
    fixedMonthlyExpenses: num(a.values.fixedMonthlyExpenses),
    borrowers: a.borrowers.map((b) => ({
      birthDate: (b.birthDate as string) ?? "",
      netMonthlyIncome: num(b.netMonthlyIncome),
      isMortgagor: b.isMortgagor !== false, // default: mortgagor unless explicitly "no"
    })),
  };
}
