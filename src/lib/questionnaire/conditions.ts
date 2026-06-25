/**
 * Conditional-logic evaluation for questionnaires — pure, no I/O.
 *
 * A `Condition` is a small boolean expression tree (`all`/`any`/`not` +
 * leaf `FieldCondition`s) referencing other answers. The engine uses it to
 * decide whether a field or section is visible.
 */

import type {
  AnswerMap,
  AnswerValue,
  Condition,
  FieldCondition,
} from "../contracts/questionnaire";

/** Answers available while evaluating a condition. */
export interface EvalContext {
  /** Global (non-per-borrower) answers. */
  global: AnswerMap;
  /** The current borrower's answers, when evaluating in a borrower context. */
  borrower?: AnswerMap;
}

/** Empty = unanswered: undefined, null, "", or an empty array. */
export function isEmptyValue(v: AnswerValue | undefined): boolean {
  if (v === undefined || v === null || v === "") return true;
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

/** Resolve the answer a `FieldCondition` refers to, honouring its scope. */
function resolve(cond: FieldCondition, ctx: EvalContext): AnswerValue | undefined {
  const scope = cond.scope ?? "auto";
  if (scope === "global") return ctx.global[cond.field];
  if (scope === "borrower") return ctx.borrower?.[cond.field];
  // auto: prefer the borrower answer when present, else fall back to global.
  if (ctx.borrower && cond.field in ctx.borrower) return ctx.borrower[cond.field];
  return ctx.global[cond.field];
}

function truthy(v: AnswerValue | undefined): boolean {
  if (Array.isArray(v)) return v.length > 0;
  return Boolean(v);
}

function asNumber(v: AnswerValue | undefined): number {
  return typeof v === "number" ? v : Number(v);
}

/** Strict-ish equality for scalar answers (arrays compared element-wise). */
function equals(a: AnswerValue | undefined, b: AnswerValue | undefined): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((x, i) => x === b[i]);
  }
  return a === b;
}

function evalFieldCondition(cond: FieldCondition, ctx: EvalContext): boolean {
  const actual = resolve(cond, ctx);
  const expected = cond.value;

  switch (cond.op) {
    case "eq":
      return equals(actual, expected);
    case "ne":
      return !equals(actual, expected);
    case "in":
      return Array.isArray(expected) && expected.some((e) => e === actual);
    case "includes":
      return Array.isArray(actual) && actual.some((a) => a === expected);
    case "gt": {
      const n = asNumber(actual);
      return !Number.isNaN(n) && n > asNumber(expected);
    }
    case "gte": {
      const n = asNumber(actual);
      return !Number.isNaN(n) && n >= asNumber(expected);
    }
    case "lt": {
      const n = asNumber(actual);
      return !Number.isNaN(n) && n < asNumber(expected);
    }
    case "lte": {
      const n = asNumber(actual);
      return !Number.isNaN(n) && n <= asNumber(expected);
    }
    case "truthy":
      return truthy(actual);
    case "falsy":
      return !truthy(actual);
    case "empty":
      return isEmptyValue(actual);
    case "notEmpty":
      return !isEmptyValue(actual);
    default:
      return false;
  }
}

/**
 * Evaluate a condition against a context. An absent condition is always true
 * (an unconditional field/section is visible).
 */
export function evalCondition(
  cond: Condition | undefined,
  ctx: EvalContext,
): boolean {
  if (!cond) return true;
  if ("all" in cond) return cond.all.every((c) => evalCondition(c, ctx));
  if ("any" in cond) return cond.any.some((c) => evalCondition(c, ctx));
  if ("not" in cond) return !evalCondition(cond.not, ctx);
  return evalFieldCondition(cond, ctx);
}
