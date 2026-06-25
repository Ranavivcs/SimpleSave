/**
 * SimpleSave dial resolver — bridges the admin config (dial templates, rate
 * bands, global params) to the pure calc engine, producing the 5 computed dials.
 * This barrel is pure (no DB). The DB loader is imported separately from
 * `@/lib/dials/loadConfig`.
 */

export { resolveDials, resolveDial } from "./resolver";
export {
  rateBandKey,
  allowedYears,
  candidateYears,
  resolveRate,
  ROUTE_KIND,
  INDEX_TYPE,
} from "./rates";
export type {
  DialsConfig,
  DialTemplateConfig,
  DialTrackConfig,
  RateBandConfig,
  GlobalParamsConfig,
  RiskRuleConfig,
  ResolveDialsInput,
  ResolvedDial,
} from "./contracts";
