import { describe, it, expect } from "vitest";
import { toDialCard } from "./dialView";
import type { ResolvedDial } from "@/lib/dials";

/**
 * Build a fake ResolvedDial with two tracks of uneven length. Only the fields
 * toDialCard reads are populated; the rest is cast away (this is a view-model
 * test, not an engine test). Schedule arrays are 1-indexed (index 0 unused).
 */
function fakeDial(): ResolvedDial {
  return {
    key: "t1",
    name: "בדיקה",
    inRange: true,
    tracks: [],
    firstPay: 80,
    result: {
      risk: { level: 2, label: "נמוך-בינוני", score: 1.8 },
      mix: {
        maxN: 3,
        firstPay: 80,
        total: 300,
        interest: 60,
        indexation: 10,
        per: [
          // Track A — 3 months
          { n: 3, M: [0, 40, 40, 40], prin: [0, 30, 31, 32], intr: [0, 10, 9, 8], idxPrin: [0, 0, 0, 0], idxIntr: [0, 0, 0, 0] },
          // Track B — 2 months (must contribute 0 in month 3)
          { n: 2, M: [0, 20, 20], prin: [0, 15, 16], intr: [0, 5, 4], idxPrin: [0, 0, 0], idxIntr: [0, 0, 0] },
        ],
      },
    },
  } as unknown as ResolvedDial;
}

describe("toDialCard", () => {
  const card = toDialCard(fakeDial());

  it("passes through identity + risk", () => {
    expect(card.key).toBe("t1");
    expect(card.name).toBe("בדיקה");
    expect(card.risk).toEqual({ level: 2, label: "נמוך-בינוני", score: 1.8 });
  });

  it("sums interest + indexation", () => {
    expect(card.interestAndIndexation).toBe(70); // 60 + 10
    expect(card.firstPay).toBe(80);
    expect(card.total).toBe(300);
  });

  it("aggregates monthly payment across tracks (uneven terms)", () => {
    expect(card.chart.months).toBe(3);
    expect(card.chart.monthlyPayment).toEqual([60, 60, 40]); // B drops out in month 3
  });

  it("builds cumulative principal & interest", () => {
    // principal: 45, 45+47=92, 92+32=124 ; interest: 15, 15+13=28, 28+8=36
    expect(card.chart.cumPrincipal).toEqual([45, 92, 124]);
    expect(card.chart.cumInterest).toEqual([15, 28, 36]);
  });
});
