import type {
  MixParams,
  MixResult,
  MortgageTrack,
} from "../contracts/mortgage";
import { num } from "./finance";
import { calcRoute } from "./route";

/**
 * Aggregate a set of tracks into one mix result (one "dial").
 * Ported verbatim from the simulator's calcMix.
 */
export function calcMix(routes: MortgageTrack[], params: MixParams): MixResult {
  let E = 0;
  let wYears = 0;
  let wRate = 0;
  let S = 0;
  let T = 0;
  let maxN = 0;
  let totalInterest = 0;
  let exitFee = 0;
  const per = [];

  for (const rt of routes) {
    const c = calcRoute(rt, params);
    per.push(c);
    const e = num(rt.amount);
    E += e;
    wYears += e * num(rt.years);
    wRate += e * c.annualRate;
    S += c.S;
    T += c.T;
    exitFee += num(rt.exitFee);
    totalInterest += c.intr.reduce((sum, value) => sum + num(value), 0);
    if (c.n > maxN) maxN = c.n;
  }

  const indexation = Math.max(0, T - E - totalInterest);
  return {
    E,
    exitFee,
    totalAmount: E + exitFee,
    principal: E,
    avgYears: E > 0 ? wYears / E : 0,
    avgRate: E > 0 ? wRate / E : 0,
    firstPay: S,
    total: T,
    interest: totalInterest,
    indexation,
    maxN,
    per,
  };
}
