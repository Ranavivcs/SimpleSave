"use client";

/**
 * Generic questionnaire wizard — drives ANY questionnaire definition through the
 * pure engine (visibility, per-borrower expansion, validation) and, on
 * completion, shows the eligibility result. Reused by every variant
 * (new/refi/insurance) — domain content + cross-field rules are passed in.
 * All state is in-memory; no DB, no auth.
 */

import { useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  createEmptyAnswer,
  setBorrowerCount,
  renderableFields,
  validateSection,
  isComplete,
  type Questionnaire,
  type QuestionnaireAnswer,
  type AnswerValue,
  type ValidationError,
} from "@/lib/questionnaire";
import {
  assessEligibility,
  type EligibilityInput,
  type EligibilityResult,
} from "@/lib/eligibility";
import { FieldInput, type TFn } from "./FieldInput";

const nis = new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 });

export type QuestionnaireWizardProps = {
  questionnaire: Questionnaire;
  /** Map the completed answer onto the eligibility engine's input. */
  mapToEligibility: (a: QuestionnaireAnswer) => EligibilityInput;
  /** Cross-field domain validation; errors are shown live and block "Next". */
  extraValidate?: (a: QuestionnaireAnswer) => ValidationError[];
  /** Optional live summary (e.g. derived loan amount) rendered under the fields. */
  renderSummary?: (a: QuestionnaireAnswer) => ReactNode;
  /** Optional completion view (e.g. the dials screen). Defaults to the eligibility card. */
  renderResult?: (a: QuestionnaireAnswer, onReset: () => void) => ReactNode;
};

export function QuestionnaireWizard({
  questionnaire: Q,
  mapToEligibility,
  extraValidate,
  renderSummary,
  renderResult,
}: QuestionnaireWizardProps) {
  const t = useTranslations() as TFn;
  const [answer, setAnswer] = useState<QuestionnaireAnswer>(() => createEmptyAnswer(Q));
  const [step, setStep] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const [completed, setCompleted] = useState<QuestionnaireAnswer | null>(null);

  const section = Q.sections[step];
  const isLast = step === Q.sections.length - 1;
  const hasPerBorrower = section.fields.some((f) => f.perBorrower);

  const items = useMemo(() => renderableFields(section, answer), [section, answer]);

  // Static (per-field) errors — surfaced only after a "Next" attempt.
  const staticErrByPath = useMemo(
    () => new Map(validateSection(section, answer).map((e) => [e.path, e])),
    [section, answer],
  );
  // Cross-field (domain) errors — shown live, filtered to this section's fields.
  const domainErrByPath = useMemo(() => {
    if (!extraValidate) return new Map<string, ValidationError>();
    const ids = new Set(items.map((it) => it.field.id));
    return new Map(
      extraValidate(answer)
        .filter((e) => ids.has(e.fieldId))
        .map((e) => [e.path, e]),
    );
  }, [extraValidate, answer, items]);

  const errorFor = (path: string): ValidationError | undefined =>
    domainErrByPath.get(path) ?? (showErrors ? staticErrByPath.get(path) : undefined);
  const sectionHasError = staticErrByPath.size > 0 || domainErrByPath.size > 0;

  const setGlobal = (id: string, v: AnswerValue) =>
    setAnswer((a) => ({ ...a, values: { ...a.values, [id]: v } }));
  const setBorrower = (i: number, id: string, v: AnswerValue) =>
    setAnswer((a) => ({
      ...a,
      borrowers: a.borrowers.map((b, idx) => (idx === i ? { ...b, [id]: v } : b)),
    }));

  function next() {
    if (sectionHasError) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    if (isLast) {
      if (isComplete(Q, answer)) setCompleted(answer);
    } else {
      setStep((s) => s + 1);
    }
  }

  function reset() {
    setCompleted(null);
    setAnswer(createEmptyAnswer(Q));
    setStep(0);
    setShowErrors(false);
  }

  if (completed) {
    return renderResult ? (
      <>{renderResult(completed, reset)}</>
    ) : (
      <ResultCard result={assessEligibility(mapToEligibility(completed))} t={t} onReset={reset} />
    );
  }

  const globals = items.filter((it) => it.borrowerIndex === undefined);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-1 text-xs font-medium text-brand-600">
        {t("wizard.step", { current: step + 1, total: Q.sections.length })}
      </div>
      <h2 className="mb-5 text-lg font-bold text-slate-900">{t(section.titleKey)}</h2>

      {hasPerBorrower && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-800">{t("wizard.borrowerCount")}</label>
          <select
            className="mt-1 w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={answer.borrowerCount}
            onChange={(e) => setAnswer((a) => setBorrowerCount(Q, a, Number(e.target.value)))}
          >
            {Array.from({ length: Q.maxBorrowers - Q.minBorrowers + 1 }, (_, k) => Q.minBorrowers + k).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      )}

      {globals.map((it) => (
        <FieldInput
          key={it.path}
          field={it.field}
          value={answer.values[it.field.id]}
          onChange={(v) => setGlobal(it.field.id, v)}
          error={errorFor(it.path)}
          t={t}
        />
      ))}

      {hasPerBorrower &&
        Array.from({ length: answer.borrowerCount }, (_, i) => i).map((i) => {
          const fields = items.filter((it) => it.borrowerIndex === i);
          if (fields.length === 0) return null;
          return (
            <fieldset key={i} className="mb-4 rounded-xl border border-slate-200 p-4">
              <legend className="px-2 text-sm font-semibold text-brand-700">{t("wizard.borrower", { n: i + 1 })}</legend>
              {fields.map((it) => (
                <FieldInput
                  key={it.path}
                  field={it.field}
                  value={answer.borrowers[i]?.[it.field.id]}
                  onChange={(v) => setBorrower(i, it.field.id, v)}
                  error={errorFor(it.path)}
                  t={t}
                />
              ))}
            </fieldset>
          );
        })}

      {renderSummary?.(answer)}

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 disabled:opacity-40 hover:text-slate-900"
        >
          {t("common.back")}
        </button>
        <button
          type="button"
          onClick={next}
          className="rounded-lg bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-900"
        >
          {isLast ? t("wizard.submit") : t("common.next")}
        </button>
      </div>
    </div>
  );
}

function ResultCard({ result, t, onReset }: { result: EligibilityResult; t: TFn; onReset: () => void }) {
  const rows: [string, string][] = [
    ["wizard.result.maxLoan", nis.format(result.maxLoanAmount)],
    ["wizard.result.requiredEquity", nis.format(result.requiredEquity)],
    ["wizard.result.maxPayment", nis.format(result.maxMonthlyPayment)],
    ["wizard.result.income", nis.format(result.qualifyingMonthlyIncome)],
    ["wizard.result.maxTerm", String(result.maxLoanTermYears)],
  ];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">{t("wizard.result.title")}</h2>
      <p className={"mt-2 text-sm font-semibold " + (result.eligible ? "text-emerald-600" : "text-amber-600")}>
        {t(result.eligible ? "wizard.result.eligible" : "wizard.result.notEligible")}
      </p>

      <dl className="mt-5 grid grid-cols-2 gap-3">
        {rows.map(([k, v]) => (
          <div key={k} className="rounded-lg bg-brand-50 p-3">
            <dt className="text-xs text-muted">{t(k)}</dt>
            <dd className="mt-0.5 text-sm font-semibold text-brand-900">{v}</dd>
          </div>
        ))}
      </dl>

      {result.violations.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-amber-700">{t("wizard.result.violations")}</h3>
          <ul className="mt-2 list-disc space-y-1 pe-5 text-sm text-amber-700">
            {result.violations.map((v) => (
              <li key={v.code}>{t(v.messageKey, v.params)}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={onReset}
        className="mt-6 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-brand-500"
      >
        {t("wizard.editAgain")}
      </button>
    </div>
  );
}
