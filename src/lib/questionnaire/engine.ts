/**
 * Questionnaire engine — drives a questionnaire DEFINITION against an ANSWER:
 * visibility (conditions), per-borrower expansion (1–5), and validation.
 * Pure and framework-free; the UI is a thin renderer on top of these helpers.
 */

import type {
  Field,
  Questionnaire,
  QuestionnaireAnswer,
  QuestionnaireSection,
  ValidationError,
} from "../contracts/questionnaire";
import { evalCondition, type EvalContext } from "./conditions";
import { validateField } from "./validation";

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(Math.trunc(n), min), max);
}

/* ------------------------------------------------------------------ *
 * Answer construction
 * ------------------------------------------------------------------ */

/** A blank answer with the right number of (empty) borrower slots. */
export function createEmptyAnswer(
  q: Questionnaire,
  borrowerCount: number = q.minBorrowers,
): QuestionnaireAnswer {
  const n = clamp(borrowerCount, q.minBorrowers, q.maxBorrowers);
  return {
    questionnaireId: q.id,
    variant: q.variant,
    borrowerCount: n,
    values: {},
    borrowers: Array.from({ length: n }, () => ({})),
  };
}

/**
 * Resize the borrower list, clamped to the questionnaire's bounds. Existing
 * borrower answers are preserved; extra slots are dropped, missing ones added.
 */
export function setBorrowerCount(
  q: Questionnaire,
  answer: QuestionnaireAnswer,
  count: number,
): QuestionnaireAnswer {
  const n = clamp(count, q.minBorrowers, q.maxBorrowers);
  const borrowers = answer.borrowers.slice(0, n);
  while (borrowers.length < n) borrowers.push({});
  return { ...answer, borrowerCount: n, borrowers };
}

/* ------------------------------------------------------------------ *
 * Evaluation contexts
 * ------------------------------------------------------------------ */

export function globalContext(answer: QuestionnaireAnswer): EvalContext {
  return { global: answer.values };
}

export function borrowerContext(
  answer: QuestionnaireAnswer,
  index: number,
): EvalContext {
  return { global: answer.values, borrower: answer.borrowers[index] ?? {} };
}

/* ------------------------------------------------------------------ *
 * Visibility
 * ------------------------------------------------------------------ */

export function isSectionVisible(
  section: QuestionnaireSection,
  answer: QuestionnaireAnswer,
): boolean {
  return evalCondition(section.visibleWhen, globalContext(answer));
}

export function visibleSections(
  q: Questionnaire,
  answer: QuestionnaireAnswer,
): QuestionnaireSection[] {
  return q.sections.filter((s) => isSectionVisible(s, answer));
}

/** A field instance to render: a global field, or one borrower's copy. */
export interface RenderableField {
  field: Field;
  /** undefined for global fields; the borrower index for per-borrower fields. */
  borrowerIndex?: number;
  /** Where this instance's answer lives (matches `ValidationError.path`). */
  path: string;
}

/**
 * The visible field instances for a section, with per-borrower fields expanded
 * into one instance per borrower. Drives both rendering and validation order.
 */
export function renderableFields(
  section: QuestionnaireSection,
  answer: QuestionnaireAnswer,
): RenderableField[] {
  const out: RenderableField[] = [];
  for (const field of section.fields) {
    if (field.perBorrower) {
      for (let i = 0; i < answer.borrowerCount; i++) {
        const ctx = borrowerContext(answer, i);
        if (evalCondition(field.visibleWhen, ctx)) {
          out.push({ field, borrowerIndex: i, path: `borrowers[${i}].${field.id}` });
        }
      }
    } else if (evalCondition(field.visibleWhen, globalContext(answer))) {
      out.push({ field, path: `values.${field.id}` });
    }
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Validation
 * ------------------------------------------------------------------ */

/** Validate every visible field of one section (skips hidden sections). */
export function validateSection(
  section: QuestionnaireSection,
  answer: QuestionnaireAnswer,
): ValidationError[] {
  if (!isSectionVisible(section, answer)) return [];
  const errors: ValidationError[] = [];
  for (const { field, borrowerIndex, path } of renderableFields(section, answer)) {
    const value =
      borrowerIndex === undefined
        ? answer.values[field.id]
        : answer.borrowers[borrowerIndex]?.[field.id];
    errors.push(...validateField(field, value, path));
  }
  return errors;
}

/** Validate the whole questionnaire (all visible sections). */
export function validateQuestionnaire(
  q: Questionnaire,
  answer: QuestionnaireAnswer,
): ValidationError[] {
  return q.sections.flatMap((s) => validateSection(s, answer));
}

export function isComplete(
  q: Questionnaire,
  answer: QuestionnaireAnswer,
): boolean {
  return validateQuestionnaire(q, answer).length === 0;
}

/** Index of the first visible section with a validation error, or -1 if none. */
export function firstInvalidSectionIndex(
  q: Questionnaire,
  answer: QuestionnaireAnswer,
): number {
  return q.sections.findIndex(
    (s) => isSectionVisible(s, answer) && validateSection(s, answer).length > 0,
  );
}
