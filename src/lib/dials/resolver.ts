/**
 * Dial resolver — turns config (dial templates + rate bands + global params)
 * into computed dials via the pure calc engine. Pure; the DB loader lives in
 * `loadConfig.ts`.
 *
 * Per template: split the loan by track share, fit terms to the desired payment
 * range (optimizer), resolve anchor/margin from the rate table at the final
 * term, then run the calc engine for the mix aggregates + risk score.
 */

import {
  computeDial,
  type MixParams,
  type MortgageTrack,
  type RiskRule,
} from "../calc";
import type {
  DialTemplateConfig,
  DialsConfig,
  GlobalParamsConfig,
  ResolveDialsInput,
  ResolvedDial,
  RiskRuleConfig,
} from "./contracts";
import {
  DEFAULT_BOARD,
  INDEX_TYPE,
  RISK_INDEXED,
  ROUTE_KIND,
  candidateYears,
  resolveRate,
  riskRouteKind,
} from "./rates";
import { optimizeYears, type OptItem } from "./optimizer";

const NOMINAL_YEARS = 20;

function toParams(g: GlobalParamsConfig): MixParams {
  return { "מדד": g.expectedIndexAnnual, "דולר": g.expectedDollarAnnual, "אירו": g.expectedEuroAnnual };
}

function toRiskRules(rules: RiskRuleConfig[]): RiskRule[] | undefined {
  if (rules.length === 0) return undefined; // let the engine use its defaults
  return rules.map((r) => ({
    routeKind: riskRouteKind(r.routeKind),
    fromMonths: r.fromMonths,
    toMonths: r.toMonths,
    indexed: RISK_INDEXED[r.indexed],
    exitPenalty: r.exitPenalty,
    risk: r.risk,
  }));
}

function buildTrack(cfg: OptItem["cfg"], loan: number): MortgageTrack {
  const kind = ROUTE_KIND[cfg.kind];
  return {
    kind,
    amount: (loan * cfg.sharePct) / 100,
    years: NOMINAL_YEARS, // replaced by the optimizer
    board: DEFAULT_BOARD,
    indexType: INDEX_TYPE[cfg.indexType],
    indexPct: cfg.indexType === "NONE" ? 0 : 1,
    changeMonths: kind === "prime" ? 1 : cfg.changeMonths ?? undefined,
    sharePct: cfg.sharePct,
    anchor: 0,
    margin: 0,
  };
}

export function resolveDial(
  template: DialTemplateConfig,
  config: DialsConfig,
  input: ResolveDialsInput,
): ResolvedDial {
  const params = toParams(config.globals);
  const items: OptItem[] = template.tracks
    .filter((t) => t.sharePct > 0)
    .map((cfg) => ({ cfg, track: buildTrack(cfg, input.loanAmount) }));

  // Rates pre-resolved at a nominal term for the search; re-resolved at the
  // final term below (matches the simulator; exact for flat bands).
  const setRates = (years?: number) =>
    items.forEach(({ cfg, track }) => {
      const r = resolveRate(cfg, years ?? track.years, input.purpose, config.rateBands);
      track.anchor = r.anchor;
      track.margin = r.margin;
    });
  setRates(NOMINAL_YEARS);

  const hasRange = input.minPay > 0 && input.maxPay > 0 && input.minPay <= input.maxPay;
  if (hasRange) {
    optimizeYears(items, params, input.minPay, input.maxPay, {
      shortenFixed: template.shortenFixed,
      linkedFixedFirst: template.linkedFixedFirst,
    });
  } else {
    items.forEach(({ cfg, track }) => (track.years = candidateYears(cfg, 0.5)));
  }
  setRates(); // at final years

  const tracks = items.map((i) => i.track);
  const result = computeDial(tracks, params, toRiskRules(config.riskRules));
  const firstPay = result.mix.firstPay;
  const inRange = hasRange ? firstPay >= input.minPay && firstPay <= input.maxPay : true;

  return { key: template.key, name: template.name, tracks, result, firstPay, inRange };
}

/** Resolve all dial templates (ordered) for a request. */
export function resolveDials(config: DialsConfig, input: ResolveDialsInput): ResolvedDial[] {
  return [...config.templates]
    .sort((a, b) => a.order - b.order)
    .map((t) => resolveDial(t, config, input));
}
