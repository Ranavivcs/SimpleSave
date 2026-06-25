/**
 * SimpleSave questionnaire engine — pure, framework-free, fully testable.
 *
 * A config-driven wizard framework: a `Questionnaire` definition (sections +
 * typed fields + conditional logic) is driven against a `QuestionnaireAnswer`
 * to compute visibility, expand per-borrower fields (1–5), and validate.
 * No UI, no DB, no I/O — the UI renders on top of these helpers.
 *
 * The actual question content for the new / refi / insurance variants is added
 * in later phases (3B+); this is the framework they plug into.
 */

export {
  createEmptyAnswer,
  setBorrowerCount,
  globalContext,
  borrowerContext,
  isSectionVisible,
  visibleSections,
  renderableFields,
  validateSection,
  validateQuestionnaire,
  isComplete,
  firstInvalidSectionIndex,
} from "./engine";
export type { RenderableField } from "./engine";

export { evalCondition, isEmptyValue } from "./conditions";
export type { EvalContext } from "./conditions";

export { validateField } from "./validation";

export type {
  Questionnaire,
  QuestionnaireSection,
  QuestionnaireVariant,
  QuestionnaireAnswer,
  Field,
  ScalarField,
  FieldType,
  TextField,
  NumberField,
  DateField,
  YesNoField,
  ChoiceField,
  RangeField,
  TableField,
  ChoiceOption,
  Condition,
  FieldCondition,
  ConditionOperator,
  ConditionScope,
  AnswerValue,
  AnswerMap,
  ScalarAnswer,
  TableRow,
  ValidationError,
  ValidationCode,
} from "../contracts/questionnaire";
