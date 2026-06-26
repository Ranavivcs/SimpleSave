import { describe, it, expect } from "vitest";
import {
  newMortgageQuestionnaire,
  answerToEligibilityInput,
  validateNewMortgage,
} from "./newMortgageQuestionnaire";
import {
  createEmptyAnswer,
  setBorrowerCount,
  type QuestionnaireAnswer,
  type AnswerValue,
} from "@/lib/questionnaire";
import { assessEligibility } from "@/lib/eligibility";

/** Build a new-mortgage answer with the given global values / borrowers. */
function build(p: {
  values?: Record<string, AnswerValue>;
  borrowers?: Record<string, AnswerValue>[];
}): QuestionnaireAnswer {
  let a = createEmptyAnswer(newMortgageQuestionnaire);
  if (p.borrowers) a = setBorrowerCount(newMortgageQuestionnaire, a, p.borrowers.length);
  a = { ...a, values: { ...a.values, ...(p.values ?? {}) } };
  if (p.borrowers) {
    a = { ...a, borrowers: p.borrowers.map((b, i) => ({ ...a.borrowers[i], ...b })) };
  }
  return a;
}

const property = { propertyValue: 1_000_000 };

describe("answerToEligibilityInput — effective LTV from loan type + source", () => {
  it("single + contractor → 75%", () => {
    const a = build({ values: { loanType: "single", propertySource: "contractor", ...property, equity: 250_000 } });
    const input = answerToEligibilityInput(a);
    expect(input.purchaseType).toBe("single");
    expect(assessEligibility(input).ltvCap).toBe(0.75);
  });

  it("single + Mechir LaMishtaken → 90% (source overrides)", () => {
    const a = build({ values: { loanType: "single", propertySource: "mechirLamishtaken", ...property, equity: 100_000 } });
    const input = answerToEligibilityInput(a);
    expect(input.purchaseType).toBe("mechirLamishtaken");
    expect(assessEligibility(input).ltvCap).toBe(0.9);
  });

  it("additional property → 50%", () => {
    const a = build({ values: { loanType: "additional", propertySource: "secondHand", ...property, equity: 500_000 } });
    expect(assessEligibility(answerToEligibilityInput(a)).ltvCap).toBe(0.5);
  });

  it("housing improvement → 70%", () => {
    const a = build({ values: { loanType: "housingImprovement", propertySource: "selfBuild", ...property, equity: 300_000 } });
    expect(assessEligibility(answerToEligibilityInput(a)).ltvCap).toBe(0.7);
  });

  it("derives requested loan = value − equity", () => {
    const a = build({ values: { loanType: "single", propertySource: "contractor", ...property, equity: 300_000 } });
    expect(answerToEligibilityInput(a).requestedLoan).toBe(700_000);
  });
});

describe("validateNewMortgage — equity gate", () => {
  it("blocks when equity < required % for the type (single = 25%)", () => {
    const a = build({ values: { loanType: "single", propertySource: "contractor", ...property, equity: 200_000 } });
    const e = validateNewMortgage(a).find((x) => x.fieldId === "equity");
    expect(e?.messageKey).toBe("newMortgage.errors.minEquity");
    expect(e?.params?.pct).toBe(25);
  });

  it("passes when equity meets the requirement", () => {
    const a = build({ values: { loanType: "single", propertySource: "contractor", ...property, equity: 250_000 } });
    expect(validateNewMortgage(a).some((x) => x.fieldId === "equity")).toBe(false);
  });

  it("additional property requires 50%", () => {
    const a = build({ values: { loanType: "additional", propertySource: "secondHand", ...property, equity: 300_000 } });
    const e = validateNewMortgage(a).find((x) => x.fieldId === "equity");
    expect(e?.params?.pct).toBe(50);
  });
});

describe("validateNewMortgage — desired payment", () => {
  const base = { loanType: "single", propertySource: "contractor", ...property, equity: 300_000 };

  it("blocks a desired max above 40% of net income", () => {
    const a = build({ values: { ...base, desiredPaymentMax: 5000 }, borrowers: [{ birthDate: "1990-01-01", netMonthlyIncome: 10000 }] });
    expect(validateNewMortgage(a).some((x) => x.fieldId === "desiredPaymentMax")).toBe(true); // cap = 4000
  });

  it("allows a desired max within 40%", () => {
    const a = build({ values: { ...base, desiredPaymentMax: 3500 }, borrowers: [{ birthDate: "1990-01-01", netMonthlyIncome: 10000 }] });
    expect(validateNewMortgage(a).some((x) => x.fieldId === "desiredPaymentMax")).toBe(false);
  });

  it("flags min > max", () => {
    const a = build({ values: { ...base, desiredPaymentMin: 4000, desiredPaymentMax: 3000 }, borrowers: [{ birthDate: "1990-01-01", netMonthlyIncome: 20000 }] });
    expect(validateNewMortgage(a).some((x) => x.messageKey === "newMortgage.errors.rangeOrder")).toBe(true);
  });
});

describe("validateNewMortgage — equity cannot exceed property value", () => {
  it("flags equity ≥ property value", () => {
    const a = build({ values: { loanType: "single", propertySource: "contractor", ...property, equity: 30_000_000 } });
    const e = validateNewMortgage(a).find((x) => x.fieldId === "equity");
    expect(e?.messageKey).toBe("newMortgage.errors.equityExceedsValue");
  });
});

describe("answerToEligibilityInput — owner vs non-owner income", () => {
  const common = { loanType: "single", propertySource: "contractor", ...property, equity: 300_000 };

  it("a non-owner borrower is a non-mortgagor (income counts 50%)", () => {
    const a = build({ values: common, borrowers: [{ birthDate: "1990-01-01", netMonthlyIncome: 10000, isPropertyOwner: false }] });
    const input = answerToEligibilityInput(a);
    expect(input.borrowers[0].isMortgagor).toBe(false);
    // 10000 × 0.5 weighting → qualifying income 5000.
    expect(assessEligibility(input).qualifyingMonthlyIncome).toBe(5000);
  });

  it("an owner (or unanswered) borrower counts fully", () => {
    const a = build({ values: common, borrowers: [{ birthDate: "1990-01-01", netMonthlyIncome: 10000, isPropertyOwner: true }] });
    expect(assessEligibility(answerToEligibilityInput(a)).qualifyingMonthlyIncome).toBe(10000);
  });
});
