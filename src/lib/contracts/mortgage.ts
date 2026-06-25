/**
 * Mortgage domain contracts — the typed objects that flow between layers
 * (questionnaire → calc engine → dials). Single source of truth for shapes.
 *
 * Domain string values are kept in Hebrew to stay identical to the source
 * simulator and the bank-report parser (no translation layer in the math).
 */

export type RouteKind = "fixed" | "variable" | "prime";

/** Repayment method: שפיצר (level payment) | קרן שווה (equal principal). */
export type Board = "שפיצר" | "קרן שווה";

/** Linkage type. */
export type IndexType = "ללא" | "מדד" | "דולר" | "אירו";

/** Balloon / grace variants ('' = standard amortizing). */
export type BalloonType =
  | ""
  | "בלון מלא"
  | "בלון חלקי"
  | "גרייס מלא"
  | "גרייס חלקי";

/**
 * One track within a mortgage mix. Rates here are already RESOLVED
 * (anchor + margin as decimals); rate-table lookup happens upstream (admin
 * config, Phase 2) — the engine stays pure.
 */
export interface MortgageTrack {
  kind: RouteKind;
  /** Principal for this track (₪). */
  amount: number;
  /** Term in years (typically 4–30). */
  years: number;
  /** Repayment method. Default שפיצר. */
  board?: Board;
  /** Linkage. Default ללא. */
  indexType?: IndexType;
  /** Fraction of the index applied (0–1). Default 1. */
  indexPct?: number;
  /** Anchor rate as a decimal (e.g. 0.0462). */
  anchor?: number;
  /** Margin/spread as a decimal. */
  margin?: number;
  /** Variable tracks: months between rate resets. */
  changeMonths?: number;
  /** Share of the whole mix in % (used for risk weighting). */
  sharePct?: number;
  balloon?: BalloonType;
  balloonMonths?: number;
  /** Daily (365-based) interest compounding. */
  dailyInterest?: boolean;
  /** Early-exit fee for this track (₪), summed into the mix. */
  exitFee?: number;
  /** Override the expected annual index for this track. */
  customAnnualIndex?: number | null;
}

/** Global expectation parameters (decimals, e.g. CPI 0.03). */
export interface MixParams {
  "מדד": number;
  "דולר": number;
  "אירו": number;
}

/** Per-track amortization result. Schedule arrays are 1-indexed (index 0 unused). */
export interface RouteResult {
  /** First monthly payment. */
  S: number;
  /** Total paid over the term. */
  T: number;
  /** Number of months. */
  n: number;
  annualRate: number;
  enteredAnnualRate: number;
  invalidNegativeRate: boolean;
  effRate: number;
  annualIndex: number;
  L: number[];
  baseL: number[];
  basePrin: number[];
  indexBal: number[];
  M: number[];
  prin: number[];
  intr: number[];
  idxEff: number[];
  idxPrin: number[];
  idxIntr: number[];
  cum: number[];
}

/** Aggregated result for a whole mix (one "dial"). */
export interface MixResult {
  E: number;
  exitFee: number;
  totalAmount: number;
  principal: number;
  avgYears: number;
  avgRate: number;
  /** Initial monthly payment of the mix. */
  firstPay: number;
  /** Total payments. */
  total: number;
  /** Total interest. */
  interest: number;
  /** Total index-linkage paid. */
  indexation: number;
  maxN: number;
  per: RouteResult[];
}

export interface RiskRule {
  routeKind: RouteKind | "all";
  fromMonths: number;
  toMonths: number;
  indexed: "כן" | "לא" | "הכול";
  exitPenalty: string;
  risk: number;
}

export interface RiskResult {
  score: number;
  level: number;
  label: string;
}
