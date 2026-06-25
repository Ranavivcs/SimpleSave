import type {
  MortgageTrack,
  RiskResult,
  RiskRule,
} from "../contracts/mortgage";
import { num } from "./finance";

/**
 * Risk scoring, ported from the simulator. A mix's risk is the share-weighted
 * average of its tracks' risk levels (1–5). Rules are admin-configurable
 * (Phase 2) and default to `defaultRiskRules()`.
 */

export function defaultRiskRules(): RiskRule[] {
  return [
    { routeKind: "prime", fromMonths: 1, toMonths: 12, indexed: "לא", exitPenalty: "נמוך", risk: 1 },
    { routeKind: "variable", fromMonths: 1, toMonths: 59, indexed: "לא", exitPenalty: "בינוני", risk: 2 },
    { routeKind: "variable", fromMonths: 1, toMonths: 59, indexed: "כן", exitPenalty: "בינוני", risk: 3 },
    { routeKind: "variable", fromMonths: 60, toMonths: 360, indexed: "לא", exitPenalty: "גבוה", risk: 3 },
    { routeKind: "variable", fromMonths: 60, toMonths: 360, indexed: "כן", exitPenalty: "גבוה", risk: 4 },
    { routeKind: "fixed", fromMonths: 48, toMonths: 360, indexed: "לא", exitPenalty: "גבוה", risk: 3 },
    { routeKind: "fixed", fromMonths: 48, toMonths: 360, indexed: "כן", exitPenalty: "גבוה", risk: 4 },
  ];
}

function routeChangePeriod(rt: MortgageTrack): number {
  const kind = rt.kind;
  return kind === "fixed"
    ? Math.round(num(rt.years) * 12)
    : kind === "prime"
      ? 1
      : Math.round(num(rt.changeMonths) || 60);
}

function riskRuleForRoute(
  rt: MortgageTrack,
  rules: RiskRule[],
): RiskRule | { risk: number; exitPenalty: string } {
  const months = routeChangePeriod(rt);
  const indexed = rt.indexType === "מדד" ? "כן" : "לא";
  const kind = rt.kind;
  return (
    rules.find(
      (rule) =>
        (rule.routeKind === "all" || rule.routeKind === kind) &&
        months >= num(rule.fromMonths) &&
        months <= num(rule.toMonths) &&
        (rule.indexed === "הכול" || rule.indexed === indexed),
    ) ||
    rules.find(
      (rule) =>
        (rule.routeKind === "all" || rule.routeKind === kind) &&
        (rule.indexed === "הכול" || rule.indexed === indexed),
    ) || { risk: 1, exitPenalty: "נמוך" }
  );
}

export function mixRisk(
  routes: MortgageTrack[],
  rules: RiskRule[] = defaultRiskRules(),
): RiskResult {
  const useShares = routes.reduce((sum, rt) => sum + num(rt.sharePct), 0) > 0;
  const weight = (rt: MortgageTrack) =>
    useShares ? num(rt.sharePct) : num(rt.amount);
  const total = routes.reduce((sum, rt) => sum + weight(rt), 0);
  if (total <= 0) return { score: 0, level: 0, label: "—" };

  const score =
    routes.reduce(
      (sum, rt) => sum + weight(rt) * num(riskRuleForRoute(rt, rules).risk),
      0,
    ) / total;
  const level = Math.min(5, Math.max(1, Math.round(score)));
  const label =
    score < 1.75
      ? "נמוכה"
      : score < 2.75
        ? "בינונית"
        : score < 3.75
          ? "גבוהה"
          : "גבוהה מאוד";
  return { score, level, label };
}
