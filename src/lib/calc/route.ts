import type {
  IndexType,
  MixParams,
  MortgageTrack,
  RouteResult,
} from "../contracts/mortgage";
import { num, PMT } from "./finance";

/**
 * Per-track amortization, ported verbatim from the validated simulator.
 *
 * Annual-index mode only (uses the expected annual index from params). The
 * simulator's "actual monthly index" mode is a later post-mortgage feature;
 * here `monthlyIndexRate` is always null, matching annual mode exactly.
 */

function indexExpect(type: IndexType | undefined, p: MixParams): number {
  if (type === "מדד") return num(p["מדד"]);
  if (type === "דולר") return num(p["דולר"]);
  if (type === "אירו") return num(p["אירו"]);
  return 0;
}

function routeAnnualIndex(rt: MortgageTrack, params: MixParams): number {
  return rt.customAnnualIndex == null
    ? indexExpect(rt.indexType, params)
    : num(rt.customAnnualIndex);
}

/** Annual mode: displayed index equals the expected annual index. */
function displayedAnnualIndex(rt: MortgageTrack, params: MixParams): number {
  return routeAnnualIndex(rt, params);
}

export function calcRoute(rt: MortgageTrack, params: MixParams): RouteResult {
  const E = num(rt.amount);
  const Dy = num(rt.years);
  const n = Math.trunc(Dy * 12);

  const enteredAnnualRate = num(rt.anchor) + num(rt.margin); // עוגן + מרווח
  const annualRate = Math.max(0, enteredAnnualRate);
  const monthlyRate = rt.dailyInterest
    ? Math.pow(1 + annualRate / 365, 365 / 12) - 1
    : annualRate / 12;

  const out: RouteResult = {
    S: 0,
    T: 0,
    n,
    annualRate,
    enteredAnnualRate,
    invalidNegativeRate: enteredAnnualRate < 0,
    effRate: Math.pow(1 + monthlyRate, 12) - 1,
    annualIndex: displayedAnnualIndex(rt, params),
    L: [],
    baseL: [],
    basePrin: [],
    indexBal: [],
    M: [],
    prin: [],
    intr: [],
    idxEff: [],
    idxPrin: [],
    idxIntr: [],
    cum: [],
  };
  if (n <= 0 || E <= 0) return out;

  const r = monthlyRate;
  const F = rt.board || "שפיצר";
  const G = rt.balloon || "";
  const H = num(rt.balloonMonths);
  const indexPct = rt.indexPct ?? 1;
  const isBalloon = G === "בלון מלא" || G === "בלון חלקי";
  const isGrace = G === "גרייס מלא" || G === "גרייס חלקי";

  const L = [0];
  const B = [0];
  const N = [0];
  const O = [0];
  const P = [0];
  const R = [0];
  const M = [0];
  let cumM = 0;
  let cumO = 0;
  let sumR = 0;
  let T = 0;
  const idxStop = isBalloon ? H : n;

  for (let m = 1; m <= n; m++) {
    // Annual mode → no actual monthly index.
    const idx = (routeAnnualIndex(rt, params) / 12) * indexPct;

    if (m === 1) {
      L[m] = Dy * 12 > 1 ? E : 0;
      B[m] = L[m];
    } else {
      if (Dy * 12 >= m) {
        if (isBalloon) {
          L[m] = H === m || H + 1 > m ? P[m - 1] : 0;
        } else if (G === "גרייס מלא") {
          L[m] = H + 1 === m ? P[m - 1] + sumR : P[m - 1];
        } else {
          L[m] = P[m - 1];
        }
      } else {
        L[m] = 0;
      }
      B[m] = Math.max(0, B[m - 1] - (out.basePrin[m - 1] || 0));
    }

    O[m] = L[m] * r;
    if (L[m] > 0) {
      if (isBalloon) N[m] = 0;
      else if (isGrace && H >= m) N[m] = 0;
      else if (F === "שפיצר") N[m] = -PMT(r, n - m + 1, L[m]) - O[m];
      else N[m] = L[m] / (n - m + 1);
    } else {
      N[m] = 0;
    }

    P[m] = (L[m] - N[m]) * (idx + 1);
    R[m] = O[m] + N[m];
    sumR += R[m];

    if (G === "בלון מלא") M[m] = H === m ? P[m] : 0;
    else if (G === "בלון חלקי") M[m] = H > m ? O[m] : H === m ? P[m] + O[m] : 0;
    else if (G === "גרייס מלא")
      M[m] = H >= m ? 0 : F === "שפיצר" ? -PMT(r, n - m + 1, L[m]) : R[m];
    else if (G === "גרייס חלקי")
      M[m] = H >= m ? O[m] : F === "שפיצר" ? -PMT(r, n - m + 1, L[m]) : R[m];
    else M[m] = R[m];

    cumM += M[m];
    cumO += O[m];

    let q: number;
    if (G === "בלון חלקי") q = H === m ? cumM : 0;
    else if (G === "בלון מלא") q = H === m ? cumM + cumO : 0;
    else q = cumM;
    if (m === idxStop) T = q;

    const idxPrin = (L[m] - N[m]) * idx;
    const idxIntr = O[m] * idx;
    const basePrin = L[m] > 0 ? N[m] * (B[m] / L[m]) : 0;
    out.basePrin[m] = basePrin;
    out.baseL[m] = B[m];
    out.indexBal[m] = Math.max(0, L[m] - B[m]);
    out.prin[m] = N[m];
    out.intr[m] = O[m];
    out.idxPrin[m] = idxPrin;
    out.idxIntr[m] = idxIntr;
    out.idxEff[m] = idxPrin + idxIntr;
    out.cum[m] = cumM;
  }

  out.S = M[1] || 0;
  out.T = T;
  out.L = L;
  out.M = M;
  return out;
}
