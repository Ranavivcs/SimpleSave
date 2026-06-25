/**
 * Questionnaire contracts — the typed shapes for DEFINING a questionnaire
 * (config) and for the ANSWER it produces. Pure data; no UI, no DB.
 *
 * A questionnaire DEFINITION is config (spec/admin-driven). The engine in
 * `src/lib/questionnaire` consumes a definition + an answer and drives
 * visibility, per-borrower expansion, and validation. The actual question
 * content for the new / refi / insurance variants is added in later phases
 * (3B+) — this layer is the generic framework only.
 *
 * All user-facing text is referenced by i18n key (`…Key`), never inlined.
 */

export type QuestionnaireVariant = "new" | "refi" | "insurance";

/** Field kinds the wizard can render. */
export type FieldType =
  | "text"
  | "number"
  | "date"
  | "yesno"
  | "choice"
  | "range"
  | "table";

/** A single selectable option (choice fields / choice table columns). */
export interface ChoiceOption {
  value: string;
  labelKey: string;
}

/** Properties shared by every field type. */
interface FieldCommon {
  id: string;
  labelKey: string;
  helpKey?: string;
  /** Enforced only while the field is visible. */
  required?: boolean;
  /** Asked once per borrower (answer stored under `answer.borrowers[i]`). */
  perBorrower?: boolean;
  /** The field is shown only when this condition passes (always, if omitted). */
  visibleWhen?: Condition;
}

export interface TextField extends FieldCommon {
  type: "text";
  minLength?: number;
  maxLength?: number;
  /** RegExp source (string) the value must match. */
  pattern?: string;
}

export interface NumberField extends FieldCommon {
  type: "number";
  min?: number;
  max?: number;
  step?: number;
  integer?: boolean;
  unitKey?: string;
}

export interface DateField extends FieldCommon {
  type: "date";
  /** ISO date (YYYY-MM-DD) bounds — lexical comparison is valid for this format. */
  min?: string;
  max?: string;
}

export interface YesNoField extends FieldCommon {
  type: "yesno";
}

export interface ChoiceField extends FieldCommon {
  type: "choice";
  options: ChoiceOption[];
  /** Allow multiple selections (answer becomes `string[]`). */
  multiple?: boolean;
  minSelected?: number;
  maxSelected?: number;
}

/** Bounded numeric input (slider). Produces a single number within [min, max]. */
export interface RangeField extends FieldCommon {
  type: "range";
  min: number;
  max: number;
  step?: number;
}

/** Scalar fields may be used as table columns (no nesting, no per-borrower). */
export type ScalarField =
  | TextField
  | NumberField
  | DateField
  | YesNoField
  | ChoiceField
  | RangeField;

/** A repeating set of rows; each row holds the column scalar answers. */
export interface TableField extends FieldCommon {
  type: "table";
  columns: ScalarField[];
  minRows?: number;
  maxRows?: number;
  addRowLabelKey?: string;
}

export type Field = ScalarField | TableField;

export interface QuestionnaireSection {
  id: string;
  titleKey: string;
  descriptionKey?: string;
  fields: Field[];
  /** The whole section is shown only when this condition passes. */
  visibleWhen?: Condition;
}

export interface Questionnaire {
  id: string;
  variant: QuestionnaireVariant;
  titleKey: string;
  sections: QuestionnaireSection[];
  /** Borrower bounds (spec: 1–5). */
  minBorrowers: number;
  maxBorrowers: number;
}

/* ------------------------------------------------------------------ *
 * Conditional logic
 * ------------------------------------------------------------------ */

export type ConditionOperator =
  | "eq"
  | "ne"
  | "in" // expected is an array; passes when it contains the answer
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "includes" // answer is an array; passes when it contains the expected value
  | "truthy"
  | "falsy"
  | "empty"
  | "notEmpty";

/** Where a referenced field's answer is resolved. */
export type ConditionScope = "global" | "borrower" | "auto";

export type Condition =
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }
  | FieldCondition;

export interface FieldCondition {
  field: string;
  op: ConditionOperator;
  value?: AnswerValue;
  /** Default "auto": the borrower answer if it holds the key, else global. */
  scope?: ConditionScope;
}

/* ------------------------------------------------------------------ *
 * Answers
 * ------------------------------------------------------------------ */

export type ScalarAnswer = string | number | boolean | string[] | null;
export type TableRow = Record<string, ScalarAnswer>;
export type AnswerValue = ScalarAnswer | TableRow[];

export type AnswerMap = Record<string, AnswerValue>;

/**
 * The typed object the questionnaire produces and downstream layers consume.
 * `values` holds global answers; `borrowers[i]` holds per-borrower answers.
 */
export interface QuestionnaireAnswer {
  questionnaireId: string;
  variant: QuestionnaireVariant;
  borrowerCount: number;
  values: AnswerMap;
  borrowers: AnswerMap[];
}

/* ------------------------------------------------------------------ *
 * Validation
 * ------------------------------------------------------------------ */

export type ValidationCode =
  | "required"
  | "type"
  | "minLength"
  | "maxLength"
  | "pattern"
  | "min"
  | "max"
  | "integer"
  | "minSelected"
  | "maxSelected"
  | "notInOptions"
  | "minRows"
  | "maxRows";

export interface ValidationError {
  /** Dotted/indexed location, e.g. "values.income", "borrowers[1].age", "values.loans[2].amount". */
  path: string;
  fieldId: string;
  code: ValidationCode;
  /** i18n key, always `validation.<code>`. */
  messageKey: string;
  /** Interpolation params for the message (e.g. `{ min: 1000 }`). */
  params?: Record<string, string | number>;
}
