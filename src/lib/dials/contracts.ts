/**
 * Dial-resolver contracts — plain config DTOs (mirroring the DB config rows but
 * decoupled from Prisma) plus the resolver's input/output. The resolver is pure
 * and testable; the DB loader (`loadConfig.ts`) maps Prisma rows onto these.
 */

import type { DialResult, MortgageTrack } from "../calc";

export type DbRouteKind = "FIXED" | "VARIABLE" | "PRIME";
export type DbIndexType = "NONE" | "CPI" | "USD" | "EUR";
export type DbPurpose = "HOUSING" | "ALL_PURPOSE";
export type DbRiskRouteKind = DbRouteKind | "ALL";
export type DbRiskIndexed = "YES" | "NO" | "ANY";

/** One track inside a dial template (mirrors DialTrack). */
export interface DialTrackConfig {
  kind: DbRouteKind;
  sharePct: number;
  indexType: DbIndexType;
  changeMonths?: number | null;
  yearStep?: number | null;
  anchor?: number | null;
  margin?: number | null;
}

/** A dial template = one of the 5 שעונים (mirrors DialTemplate). */
export interface DialTemplateConfig {
  key: string;
  name: string;
  order: number;
  shortenFixed: boolean;
  linkedFixedFirst: boolean;
  tracks: DialTrackConfig[];
}

/** A rate band (mirrors RateBand): year range → anchor + margin. */
export interface RateBandConfig {
  purpose: DbPurpose;
  routeKey: string;
  fromYears: number;
  toYears: number;
  anchor: number;
  margin: number;
}

/** Market expectations used as engine params (mirrors GlobalParameters). */
export interface GlobalParamsConfig {
  expectedIndexAnnual: number;
  expectedDollarAnnual: number;
  expectedEuroAnnual: number;
}

/** Risk rule (mirrors RiskRule). */
export interface RiskRuleConfig {
  routeKind: DbRiskRouteKind;
  fromMonths: number;
  toMonths: number;
  indexed: DbRiskIndexed;
  exitPenalty: string;
  risk: number;
}

/** Everything the resolver reads from config. */
export interface DialsConfig {
  globals: GlobalParamsConfig;
  templates: DialTemplateConfig[];
  rateBands: RateBandConfig[];
  riskRules: RiskRuleConfig[];
}

/** Per-request inputs. */
export interface ResolveDialsInput {
  /** Total loan to split across each template's tracks (₪). */
  loanAmount: number;
  /** Which rate table to use. */
  purpose: "housing" | "allPurpose";
  /** Desired first-payment range (₪/month) the optimizer fits the terms to. */
  minPay: number;
  maxPay: number;
}

/** One resolved dial: the computed mix + risk, plus fit status. */
export interface ResolvedDial {
  key: string;
  name: string;
  tracks: MortgageTrack[];
  result: DialResult;
  /** Convenience copy of result.mix.firstPay. */
  firstPay: number;
  /** Whether the first payment landed inside [minPay, maxPay]. */
  inRange: boolean;
}
