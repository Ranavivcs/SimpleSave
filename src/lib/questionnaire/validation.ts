/**
 * Field & questionnaire validation — pure, no I/O.
 *
 * Produces `ValidationError`s that carry an i18n `messageKey` (`validation.*`)
 * plus interpolation `params` — never a hardcoded user-facing string. The UI
 * resolves the key against `messages/<locale>.json`.
 *
 * Whole-questionnaire validation (visibility + per-borrower expansion) lives in
 * `engine.ts`; this module validates a single field's value.
 */

import type {
  ChoiceField,
  DateField,
  Field,
  NumberField,
  RangeField,
  ScalarField,
  TableField,
  TextField,
  ValidationCode,
  ValidationError,
  AnswerValue,
} from "../contracts/questionnaire";
import { isEmptyValue } from "./conditions";

function err(
  path: string,
  fieldId: string,
  code: ValidationCode,
  params?: Record<string, string | number>,
): ValidationError {
  return { path, fieldId, code, messageKey: `validation.${code}`, params };
}

function validateText(
  f: TextField,
  value: AnswerValue,
  path: string,
): ValidationError[] {
  if (typeof value !== "string") return [err(path, f.id, "type")];
  const errors: ValidationError[] = [];
  if (f.minLength !== undefined && value.length < f.minLength) {
    errors.push(err(path, f.id, "minLength", { min: f.minLength }));
  }
  if (f.maxLength !== undefined && value.length > f.maxLength) {
    errors.push(err(path, f.id, "maxLength", { max: f.maxLength }));
  }
  if (f.pattern !== undefined && !new RegExp(f.pattern).test(value)) {
    errors.push(err(path, f.id, "pattern"));
  }
  return errors;
}

function validateNumeric(
  f: NumberField | RangeField,
  value: AnswerValue,
  path: string,
): ValidationError[] {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return [err(path, f.id, "type")];
  }
  const errors: ValidationError[] = [];
  if (f.min !== undefined && value < f.min) {
    errors.push(err(path, f.id, "min", { min: f.min }));
  }
  if (f.max !== undefined && value > f.max) {
    errors.push(err(path, f.id, "max", { max: f.max }));
  }
  if (f.type === "number" && f.integer && !Number.isInteger(value)) {
    errors.push(err(path, f.id, "integer"));
  }
  return errors;
}

function validateDate(
  f: DateField,
  value: AnswerValue,
  path: string,
): ValidationError[] {
  if (typeof value !== "string") return [err(path, f.id, "type")];
  const errors: ValidationError[] = [];
  // YYYY-MM-DD compares correctly as a string.
  if (f.min !== undefined && value < f.min) {
    errors.push(err(path, f.id, "min", { min: f.min }));
  }
  if (f.max !== undefined && value > f.max) {
    errors.push(err(path, f.id, "max", { max: f.max }));
  }
  return errors;
}

function validateChoice(
  f: ChoiceField,
  value: AnswerValue,
  path: string,
): ValidationError[] {
  const allowed = new Set(f.options.map((o) => o.value));

  if (f.multiple) {
    if (!Array.isArray(value)) return [err(path, f.id, "type")];
    const selected = value as unknown[];
    const errors: ValidationError[] = [];
    if (selected.some((v) => typeof v !== "string" || !allowed.has(v))) {
      errors.push(err(path, f.id, "notInOptions"));
    }
    if (f.minSelected !== undefined && selected.length < f.minSelected) {
      errors.push(err(path, f.id, "minSelected", { min: f.minSelected }));
    }
    if (f.maxSelected !== undefined && selected.length > f.maxSelected) {
      errors.push(err(path, f.id, "maxSelected", { max: f.maxSelected }));
    }
    return errors;
  }

  if (typeof value !== "string") return [err(path, f.id, "type")];
  return allowed.has(value) ? [] : [err(path, f.id, "notInOptions")];
}

function validateScalar(
  f: ScalarField,
  value: AnswerValue,
  path: string,
): ValidationError[] {
  switch (f.type) {
    case "text":
      return validateText(f, value, path);
    case "number":
    case "range":
      return validateNumeric(f, value, path);
    case "date":
      return validateDate(f, value, path);
    case "yesno":
      return typeof value === "boolean" ? [] : [err(path, f.id, "type")];
    case "choice":
      return validateChoice(f, value, path);
  }
}

function validateTable(
  f: TableField,
  value: AnswerValue,
  path: string,
): ValidationError[] {
  if (!Array.isArray(value) || value.some((r) => Array.isArray(r))) {
    return [err(path, f.id, "type")];
  }
  const rows = value as Record<string, AnswerValue>[];
  const errors: ValidationError[] = [];
  if (f.minRows !== undefined && rows.length < f.minRows) {
    errors.push(err(path, f.id, "minRows", { min: f.minRows }));
  }
  if (f.maxRows !== undefined && rows.length > f.maxRows) {
    errors.push(err(path, f.id, "maxRows", { max: f.maxRows }));
  }
  rows.forEach((row, i) => {
    for (const col of f.columns) {
      errors.push(...validateField(col, row[col.id], `${path}[${i}].${col.id}`));
    }
  });
  return errors;
}

/**
 * Validate a single field's value. `required` is enforced here; callers should
 * only invoke this for fields that are currently visible (see `engine.ts`).
 */
export function validateField(
  field: Field,
  value: AnswerValue | undefined,
  path: string,
): ValidationError[] {
  if (isEmptyValue(value)) {
    if (field.required) return [err(path, field.id, "required")];
    // Optional, but a positive lower bound on a collection still applies
    // (an absent table/selection counts as 0) — this makes minRows/minSelected
    // an effective "at least N" gate for config authors.
    if (field.type === "table" && (field.minRows ?? 0) > 0) {
      return [err(path, field.id, "minRows", { min: field.minRows! })];
    }
    if (field.type === "choice" && field.multiple && (field.minSelected ?? 0) > 0) {
      return [err(path, field.id, "minSelected", { min: field.minSelected! })];
    }
    return [];
  }
  // value is non-empty past this point.
  if (field.type === "table") return validateTable(field, value!, path);
  return validateScalar(field, value!, path);
}
