/**
 * Dial view-model — maps the resolver's `ResolvedDial[]` onto the light,
 * serializable shape the dials UI needs (card metrics + a precomputed monthly
 * chart series). Pure + testable; no UI, no DB. Keeps the heavy per-track
 * schedule arrays on the server (only the aggregated series is shipped).
 */

import type { ResolvedDial } from "@/lib/dials";

export interface DialChartSeries {
  /** Number of months (= longest track term). */
  months: number;
  /** Total monthly payment across tracks, per month (index 0 = month 1). */
  monthlyPayment: number[];
  /** Cumulative principal repaid (incl. its indexation), per month. */
  cumPrincipal: number[];
  /** Cumulative interest paid (incl. indexation), per month. */
  cumInterest: number[];
}

export interface DialCardData {
  key: string;
  name: string;
  risk: { level: number; label: string; score: number };
  /** Initial monthly payment (₪). */
  firstPay: number;
  /** Total of all payments over the term (₪). */
  total: number;
  /** Interest + indexation paid over the term (₪). */
  interestAndIndexation: number;
  /** Whether the first payment landed in the desired range. */
  inRange: boolean;
  chart: DialChartSeries;
}

const r = Math.round;

/** Map one resolved dial onto its card view-model (+ aggregated chart series). */
export function toDialCard(d: ResolvedDial): DialCardData {
  const mix = d.result.mix;
  const months = mix.maxN;
  const monthly = new Array<number>(months).fill(0);
  const prinPer = new Array<number>(months).fill(0);
  const intrPer = new Array<number>(months).fill(0);

  // Schedule arrays are 1-indexed (index 0 unused); t.n = this track's months.
  for (const t of mix.per) {
    const last = Math.min(t.n, months);
    for (let m = 1; m <= last; m++) {
      monthly[m - 1] += t.M[m] ?? 0;
      prinPer[m - 1] += (t.prin[m] ?? 0) + (t.idxPrin?.[m] ?? 0);
      intrPer[m - 1] += (t.intr[m] ?? 0) + (t.idxIntr?.[m] ?? 0);
    }
  }

  const cumPrincipal = new Array<number>(months);
  const cumInterest = new Array<number>(months);
  let p = 0;
  let i = 0;
  for (let m = 0; m < months; m++) {
    p += prinPer[m];
    i += intrPer[m];
    cumPrincipal[m] = r(p);
    cumInterest[m] = r(i);
  }

  return {
    key: d.key,
    name: d.name,
    risk: { level: d.result.risk.level, label: d.result.risk.label, score: d.result.risk.score },
    firstPay: r(mix.firstPay),
    total: r(mix.total),
    interestAndIndexation: r(mix.interest + mix.indexation),
    inRange: d.inRange,
    chart: { months, monthlyPayment: monthly.map(r), cumPrincipal, cumInterest },
  };
}

/** Map all resolved dials onto card view-models. */
export function toDialCards(dials: ResolvedDial[]): DialCardData[] {
  return dials.map(toDialCard);
}
