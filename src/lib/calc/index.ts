/**
 * SimpleSave calculation engine — pure, framework-free, fully testable.
 * Ported from the client's validated mortgage simulator.
 *
 * Inputs are RESOLVED tracks (rates already chosen) + expectation params;
 * outputs are amortization/aggregate/risk results. No UI, no DB, no I/O.
 */

import type {
  MixParams,
  MortgageTrack,
  MixResult,
  RiskResult,
  RiskRule,
} from "../contracts/mortgage";
import { calcMix } from "./mix";
import { mixRisk } from "./risk";

export { num, PMT } from "./finance";
export { calcRoute } from "./route";
export { calcMix } from "./mix";
export { mixRisk, defaultRiskRules } from "./risk";
export type {
  MortgageTrack,
  MixParams,
  MixResult,
  RouteResult,
  RiskResult,
  RiskRule,
  RouteKind,
  Board,
  IndexType,
  BalloonType,
} from "../contracts/mortgage";

/** One computed dial: the mix aggregates plus its risk score. */
export interface DialResult {
  mix: MixResult;
  risk: RiskResult;
}

/** Compute a single dial (mix result + risk) from its tracks. */
export function computeDial(
  tracks: MortgageTrack[],
  params: MixParams,
  rules?: RiskRule[],
): DialResult {
  return {
    mix: calcMix(tracks, params),
    risk: mixRisk(tracks, rules),
  };
}
