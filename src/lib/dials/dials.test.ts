import { describe, expect, it } from "vitest";
import type {
  DialsConfig,
  DialTemplateConfig,
  RateBandConfig,
} from "./contracts";
import { allowedYears, candidateYears, rateBandKey, resolveDials } from "./index";

/** clock1 from the simulator (shares 17/17/30/15/21). */
const clock1: DialTemplateConfig = {
  key: "clock1",
  name: "שעון 1",
  order: 0,
  shortenFixed: true,
  linkedFixedFirst: true,
  tracks: [
    { kind: "FIXED", sharePct: 17, indexType: "NONE", yearStep: 5, anchor: 0.0462 },
    { kind: "FIXED", sharePct: 17, indexType: "CPI", yearStep: 5, anchor: 0.0462 },
    { kind: "VARIABLE", sharePct: 30, indexType: "NONE", changeMonths: 36, yearStep: 3, anchor: 0.047 },
    { kind: "VARIABLE", sharePct: 15, indexType: "CPI", changeMonths: 60, yearStep: 5, anchor: 0.047 },
    { kind: "PRIME", sharePct: 21, indexType: "NONE", changeMonths: 1, yearStep: 10, anchor: 0.0456 },
  ],
};

const HOUSING_BANDS: RateBandConfig[] = [
  ["fixedUnlinked", 0.0462],
  ["fixedLinked", 0.0462],
  ["variable36Unlinked", 0.047],
  ["variable60Linked", 0.047],
  ["prime", 0.0456],
].map(([routeKey, anchor]) => ({
  purpose: "HOUSING",
  routeKey: routeKey as string,
  fromYears: 4,
  toYears: 30,
  anchor: anchor as number,
  margin: 0,
}));

const config: DialsConfig = {
  globals: { expectedIndexAnnual: 0.03, expectedDollarAnnual: 0, expectedEuroAnnual: 0 },
  templates: [clock1],
  rateBands: HOUSING_BANDS,
  riskRules: [], // engine uses its defaults
};

describe("allowed terms (yearStep)", () => {
  it("fixed step 5 -> 5..30; prime step 10 -> 10/20/30", () => {
    expect(allowedYears(clock1.tracks[0])).toEqual([5, 10, 15, 20, 25, 30]);
    expect(allowedYears(clock1.tracks[4])).toEqual([10, 20, 30]);
  });
  it("variable uses changeMonths/step granularity (3y -> multiples of 3)", () => {
    expect(allowedYears(clock1.tracks[2])).toEqual([6, 9, 12, 15, 18, 21, 24, 27, 30]);
  });
  it("candidateYears interpolates across the allowed terms", () => {
    expect(candidateYears(clock1.tracks[0], 0)).toBe(5);
    expect(candidateYears(clock1.tracks[0], 1)).toBe(30);
  });
});

describe("rate-band key mapping", () => {
  it("maps kind + linkage + changeMonths to the band key", () => {
    expect(rateBandKey(clock1.tracks[0])).toBe("fixedUnlinked");
    expect(rateBandKey(clock1.tracks[1])).toBe("fixedLinked");
    expect(rateBandKey(clock1.tracks[2])).toBe("variable36Unlinked");
    expect(rateBandKey(clock1.tracks[3])).toBe("variable60Linked");
    expect(rateBandKey(clock1.tracks[4])).toBe("prime");
  });
});

describe("resolveDials", () => {
  it("splits the loan by share and computes a mix + risk", () => {
    const [dial] = resolveDials(config, {
      loanAmount: 1_000_000,
      purpose: "housing",
      minPay: 4000,
      maxPay: 9000,
    });
    expect(dial.key).toBe("clock1");
    expect(dial.tracks).toHaveLength(5);

    // amounts follow the shares and sum to the loan
    expect(dial.tracks.map((t) => t.amount)).toEqual([170000, 170000, 300000, 150000, 210000]);
    expect(dial.tracks.reduce((s, t) => s + t.amount, 0)).toBe(1_000_000);

    // rates resolved from the housing table
    expect(dial.tracks[0].anchor).toBe(0.0462);
    expect(dial.tracks[4].anchor).toBe(0.0456);

    // optimizer hit the desired payment range
    expect(dial.inRange).toBe(true);
    expect(dial.firstPay).toBeGreaterThanOrEqual(4000);
    expect(dial.firstPay).toBeLessThanOrEqual(9000);

    // engine produced sane aggregates + a risk label
    expect(dial.result.mix.total).toBeGreaterThan(1_000_000);
    expect(dial.result.risk.level).toBeGreaterThanOrEqual(1);
    expect(dial.result.risk.level).toBeLessThanOrEqual(5);
    expect(dial.result.risk.label.length).toBeGreaterThan(0);
  });

  it("without a payment range, uses mid terms and still computes", () => {
    const [dial] = resolveDials(config, {
      loanAmount: 800_000,
      purpose: "housing",
      minPay: 0,
      maxPay: 0,
    });
    expect(dial.firstPay).toBeGreaterThan(0);
    expect(dial.inRange).toBe(true); // no range to violate
    expect(dial.tracks.every((t) => t.years >= 4 && t.years <= 30)).toBe(true);
  });
});
