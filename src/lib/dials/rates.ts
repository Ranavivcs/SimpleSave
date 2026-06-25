/**
 * Enum mapping + rate-band resolution + allowed-term enumeration.
 * Pure ports of the simulator's `generalRateKey`, `allowedYears`,
 * `candidateYears`, and `generalRateForRoute`. No I/O.
 */

import type { Board, IndexType, RouteKind } from "../calc";
import type {
  DbIndexType,
  DbRiskIndexed,
  DbRiskRouteKind,
  DbRouteKind,
  DialTrackConfig,
  RateBandConfig,
} from "./contracts";

/* ---- enum maps: DB (English) → engine domain (Hebrew/lowercase) ---- */

export const ROUTE_KIND: Record<DbRouteKind, RouteKind> = {
  FIXED: "fixed",
  VARIABLE: "variable",
  PRIME: "prime",
};

export const INDEX_TYPE: Record<DbIndexType, IndexType> = {
  NONE: "ללא",
  CPI: "מדד",
  USD: "דולר",
  EUR: "אירו",
};

export const RISK_INDEXED: Record<DbRiskIndexed, "כן" | "לא" | "הכול"> = {
  YES: "כן",
  NO: "לא",
  ANY: "הכול",
};

export function riskRouteKind(k: DbRiskRouteKind): RouteKind | "all" {
  return k === "ALL" ? "all" : ROUTE_KIND[k];
}

export const DEFAULT_BOARD: Board = "שפיצר";

/* ---- rate-band key for a track (simulator generalRateKey) ---- */

export function rateBandKey(t: DialTrackConfig): string {
  if (t.kind === "PRIME") return "prime";
  if (t.kind === "FIXED") return t.indexType === "CPI" ? "fixedLinked" : "fixedUnlinked";
  const months = Math.round(t.changeMonths ?? 0);
  const linked = t.indexType === "CPI";
  if (months === 36) return linked ? "variable36Linked" : "variable36Unlinked";
  if (months === 60) return linked ? "variable60Linked" : "variable60Unlinked";
  if (months === 18 || months === 24)
    return linked ? "variable18_24Linked" : "variable18_24Unlinked";
  return linked ? "variable60Linked" : "variable60Unlinked";
}

/* ---- allowed terms for a track (simulator allowedYears) ---- */

export function allowedYears(t: DialTrackConfig): number[] {
  if (t.kind !== "VARIABLE") {
    const step = Math.max(1, Math.round(t.yearStep ?? 1));
    const first = step > 1 ? Math.max(4, step) : 4;
    const out: number[] = [];
    for (let y = first; y <= 30; y += step) out.push(y);
    return out;
  }
  const stepYears = t.yearStep || (t.changeMonths ?? 0) / 12 || 5;
  const jump = Math.max(1, Math.round(stepYears * 12));
  const out: number[] = [];
  for (let m = 72; m <= 360; m++) if (m % jump === 0) out.push(m / 12);
  return out.length ? out : [6, 30];
}

/** The term at interpolation point t∈[0,1] across the allowed terms. */
export function candidateYears(t: DialTrackConfig, frac: number): number {
  const vals = allowedYears(t);
  return vals[Math.round(frac * (vals.length - 1))];
}

/* ---- resolve anchor + margin from the rate table ---- */

export function resolveRate(
  t: DialTrackConfig,
  years: number,
  purpose: "housing" | "allPurpose",
  bands: RateBandConfig[],
): { anchor: number; margin: number } {
  const dbPurpose = purpose === "allPurpose" ? "ALL_PURPOSE" : "HOUSING";
  const key = rateBandKey(t);
  const matches = bands.filter((b) => b.purpose === dbPurpose && b.routeKey === key);

  const exact = matches.find((b) => years >= b.fromYears && years <= b.toYears);
  const band =
    exact ??
    matches.reduce<RateBandConfig | undefined>((best, b) => {
      if (!best) return b;
      const mid = (x: RateBandConfig) => (x.fromYears + x.toYears) / 2;
      return Math.abs(years - mid(b)) < Math.abs(years - mid(best)) ? b : best;
    }, undefined);

  // Fall back to the track's own anchor/margin if the table has no band.
  if (band) return { anchor: band.anchor, margin: band.margin };
  return { anchor: t.anchor ?? 0, margin: t.margin ?? 0 };
}
