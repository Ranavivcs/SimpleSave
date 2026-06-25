import { describe, expect, it } from "vitest";
import type {
  EligibilityBorrower,
  EligibilityInput,
} from "../contracts/eligibility";
import {
  DEFAULT_ELIGIBILITY_LIMITS as L,
  assessEligibility,
  qualifyingIncome,
  maxMonthlyPayment,
  withinCapacity,
  requiredEquity,
  maxLoanByLtv,
  ageInYears,
  oldestAge,
  maxLoanTermYears,
} from "./index";

const ASOF = new Date("2026-06-25");

function borrower(p: Partial<EligibilityBorrower> = {}): EligibilityBorrower {
  return { birthDate: "1985-06-25", netMonthlyIncome: 15000, isMortgagor: true, ...p };
}

/** A clean, eligible single-property purchase. */
function baseInput(p: Partial<EligibilityInput> = {}): EligibilityInput {
  return {
    purchaseType: "single",
    propertyValue: 2000000,
    requestedLoan: 1400000, // 70% LTV — under the 75% cap
    equity: 600000, // 30% — above the 25% min
    borrowers: [borrower()],
    ...p,
  };
}

describe("income & capacity", () => {
  it("non-mortgagor income is weighted to 50%", () => {
    const input = baseInput({
      borrowers: [
        borrower({ netMonthlyIncome: 10000, isMortgagor: true }),
        borrower({ netMonthlyIncome: 10000, isMortgagor: false }),
      ],
    });
    expect(qualifyingIncome(input, L)).toBe(15000); // 10000 + 0.5*10000
  });

  it("extra income adds, fixed expenses subtract, floored at 0", () => {
    expect(
      qualifyingIncome(
        baseInput({ borrowers: [borrower({ netMonthlyIncome: 12000 })], extraMonthlyIncome: 3000, fixedMonthlyExpenses: 2000 }),
        L,
      ),
    ).toBe(13000);
    expect(
      qualifyingIncome(baseInput({ borrowers: [borrower({ netMonthlyIncome: 1000 })], fixedMonthlyExpenses: 5000 }), L),
    ).toBe(0);
  });

  it("max monthly payment is 40% of qualifying income", () => {
    const input = baseInput({ borrowers: [borrower({ netMonthlyIncome: 20000 })] });
    expect(maxMonthlyPayment(input, L)).toBe(8000);
    expect(withinCapacity(8000, input, L)).toBe(true);
    expect(withinCapacity(8001, input, L)).toBe(false);
  });
});

describe("LTV & equity", () => {
  it("LTV cap per purchase type sets the loan ceiling", () => {
    expect(maxLoanByLtv(baseInput({ purchaseType: "single" }), L)).toBe(1500000); // 75%
    expect(maxLoanByLtv(baseInput({ purchaseType: "additional" }), L)).toBe(1000000); // 50%
    expect(maxLoanByLtv(baseInput({ purchaseType: "housingImprovement" }), L)).toBe(1400000); // 70%
  });

  it("required equity: 25% standard, 50% additional", () => {
    expect(requiredEquity(baseInput({ purchaseType: "single" }), L)).toBe(500000); // 25%
    expect(requiredEquity(baseInput({ purchaseType: "additional" }), L)).toBe(1000000); // 50%
  });

  it("Mechir LaMishtaken: exempt from 25%, floored at ₪100k", () => {
    // 10% of 2,000,000 = 200,000 (above the 100k floor)
    expect(requiredEquity(baseInput({ purchaseType: "mechirLamishtaken" }), L)).toBe(200000);
    // small property: 10% of 800,000 = 80,000 -> floored up to 100,000
    expect(
      requiredEquity(baseInput({ purchaseType: "mechirLamishtaken", propertyValue: 800000 }), L),
    ).toBe(100000);
  });
});

describe("age & term", () => {
  it("ageInYears respects month/day", () => {
    expect(ageInYears("1985-06-25", ASOF)).toBe(41);
    expect(ageInYears("1985-06-26", ASOF)).toBe(40); // birthday not yet reached
  });

  it("term cap uses the oldest borrower and age 85", () => {
    const borrowers = [borrower({ birthDate: "1990-01-01" }), borrower({ birthDate: "1970-01-01" })];
    expect(oldestAge(borrowers, ASOF)).toBe(56);
    expect(maxLoanTermYears(borrowers, L.loanTermAgeCap, ASOF)).toBe(29); // 85 - 56
  });
});

describe("assessEligibility", () => {
  it("a clean request is eligible with the expected envelope", () => {
    const r = assessEligibility(baseInput(), L, ASOF);
    expect(r.eligible).toBe(true);
    expect(r.violations).toEqual([]);
    expect(r.ltvCap).toBe(0.75);
    expect(r.maxLoanByLtv).toBe(1500000);
    expect(r.requiredEquity).toBe(500000);
    expect(r.maxLoanAmount).toBe(1500000);
    expect(r.maxMonthlyPayment).toBe(6000); // 40% of 15000
    expect(r.maxLoanTermYears).toBe(44); // 85 - 41
  });

  it("flags an LTV breach", () => {
    const r = assessEligibility(baseInput({ requestedLoan: 1600000 }), L, ASOF); // >75%
    expect(r.eligible).toBe(false);
    const v = r.violations.find((x) => x.code === "ltvExceeded");
    expect(v?.messageKey).toBe("eligibility.ltvExceeded");
    expect(v?.params).toEqual({ ltvPct: 75, maxLoan: 1500000 });
  });

  it("flags insufficient equity", () => {
    const r = assessEligibility(baseInput({ equity: 300000 }), L, ASOF); // need 500k
    expect(r.violations.some((v) => v.code === "insufficientEquity")).toBe(true);
    expect(r.violations.find((v) => v.code === "insufficientEquity")?.params).toEqual({
      requiredEquity: 500000,
    });
  });

  it("flags borrower count out of range and loan exceeding value", () => {
    const tooMany = assessEligibility(
      baseInput({ borrowers: Array.from({ length: 6 }, () => borrower()) }),
      L,
      ASOF,
    );
    expect(tooMany.violations.some((v) => v.code === "borrowerCountOutOfRange")).toBe(true);

    const overValue = assessEligibility(
      baseInput({ propertyValue: 1000000, requestedLoan: 1200000, equity: 0 }),
      L,
      ASOF,
    );
    expect(overValue.violations.some((v) => v.code === "loanExceedsValue")).toBe(true);
    expect(overValue.violations.some((v) => v.code === "ltvExceeded")).toBe(true);
  });

  it("every violation carries an eligibility.* message key", () => {
    const r = assessEligibility(baseInput({ requestedLoan: 1600000, equity: 0, borrowers: [] }), L, ASOF);
    expect(r.violations.length).toBeGreaterThan(0);
    expect(r.violations.every((v) => v.messageKey === `eligibility.${v.code}`)).toBe(true);
  });

  it("custom limits override defaults (config-driven)", () => {
    const strict = { ...L, maxRepaymentRatio: 0.38 };
    const r = assessEligibility(baseInput({ borrowers: [borrower({ netMonthlyIncome: 10000 })] }), strict, ASOF);
    expect(r.maxMonthlyPayment).toBe(3800); // 38% not 40%
  });
});
