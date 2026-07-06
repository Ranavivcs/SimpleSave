"use client";

/**
 * Review screen — shown after a dial ("clock") is chosen. Recaps every answer
 * from the questionnaire (grouped by section, per-borrower fields per borrower)
 * plus the chosen dial's key figures, then continues to the documents screen.
 * Pure recap; the answer itself stays read-only (editing goes back to the wizard).
 */

import { useTranslations } from "next-intl";
import {
  renderableFields,
  type Questionnaire,
  type QuestionnaireAnswer,
  type Field,
  type AnswerValue,
} from "@/lib/questionnaire";
import type { DialCardData } from "@/modules/dials/dialView";
import type { TFn } from "@/modules/questionnaire/FieldInput";

const nis = new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 });
const grouped = new Intl.NumberFormat("he-IL", { maximumFractionDigits: 0 });

function formatValue(field: Field, value: AnswerValue | undefined, t: TFn): string {
  if (value === undefined || value === null || value === "") return "—";
  switch (field.type) {
    case "number":
    case "range":
      return typeof value === "number" ? grouped.format(value) : String(value);
    case "date":
      return new Date(String(value)).toLocaleDateString("he-IL");
    case "yesno":
      return t(value === true ? "wizard.yes" : "wizard.no");
    case "choice": {
      const values = Array.isArray(value) ? value : [value];
      return values
        .map((v) => {
          const opt = field.options.find((o) => o.value === v);
          return opt ? t(opt.labelKey) : String(v);
        })
        .join(", ");
    }
    default:
      return String(value);
  }
}

export function NewMortgageReview({
  questionnaire,
  answer,
  dial,
  onBack,
  onContinue,
}: {
  questionnaire: Questionnaire;
  answer: QuestionnaireAnswer;
  dial: DialCardData;
  onBack: () => void;
  onContinue: () => void;
}) {
  const t = useTranslations() as TFn;
  const tDials = useTranslations("dials");

  const dialMetrics: [string, string][] = [
    [tDials("metrics.firstPay"), nis.format(dial.firstPay)],
    [tDials("metrics.total"), nis.format(dial.total)],
    [tDials("metrics.interestAndIndexation"), nis.format(dial.interestAndIndexation)],
  ];

  return (
    <section>
      <header className="mb-6 text-center">
        <h2 className="text-2xl font-extrabold text-brand-900">{t("newMortgage.review.title")}</h2>
        <p className="mt-2 text-sm text-muted">{t("newMortgage.review.subtitle")}</p>
        <button type="button" onClick={onBack} className="mt-3 text-sm font-medium text-brand-700 hover:underline">
          {t("newMortgage.review.backToDials")}
        </button>
      </header>

      {/* Chosen dial */}
      <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5">
        <h3 className="text-sm font-semibold text-brand-700">{t("newMortgage.review.chosenDial")}</h3>
        <div className="mt-1 flex items-center gap-3">
          <span className="text-lg font-bold text-brand-900">{dial.name}</span>
          <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-brand-800">
            {t("newMortgage.review.riskLabel")}: {dial.risk.label}
          </span>
        </div>
        <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {dialMetrics.map(([k, v]) => (
            <div key={k} className="rounded-lg bg-white px-3 py-2 text-center">
              <dt className="text-xs text-muted">{k}</dt>
              <dd className="mt-0.5 text-base font-bold text-brand-900">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Questionnaire answers, section by section */}
      {questionnaire.sections.map((section) => {
        const items = renderableFields(section, answer);
        if (items.length === 0) return null;
        const globals = items.filter((it) => it.borrowerIndex === undefined);
        const borrowerIdxs = [...new Set(items.map((it) => it.borrowerIndex).filter((i) => i !== undefined))];

        return (
          <div key={section.id} className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-base font-bold text-slate-900">{t(section.titleKey)}</h3>

            {globals.length > 0 && (
              <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {globals.map((it) => (
                  <div key={it.path} className="rounded-lg bg-brand-50 p-3">
                    <dt className="text-xs text-muted">{t(it.field.labelKey)}</dt>
                    <dd className="mt-0.5 text-sm font-semibold text-brand-900">
                      {formatValue(it.field, answer.values[it.field.id], t)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {borrowerIdxs.map((i) => (
              <fieldset key={i} className="mt-4 rounded-xl border border-slate-200 p-4">
                <legend className="px-2 text-sm font-semibold text-brand-700">
                  {t("wizard.borrower", { n: (i as number) + 1 })}
                </legend>
                <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {items
                    .filter((it) => it.borrowerIndex === i)
                    .map((it) => (
                      <div key={it.path} className="rounded-lg bg-brand-50 p-3">
                        <dt className="text-xs text-muted">{t(it.field.labelKey)}</dt>
                        <dd className="mt-0.5 text-sm font-semibold text-brand-900">
                          {formatValue(it.field, answer.borrowers[i as number]?.[it.field.id], t)}
                        </dd>
                      </div>
                    ))}
                </dl>
              </fieldset>
            ))}
          </div>
        );
      })}

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={onContinue}
          className="rounded-lg bg-brand-700 px-8 py-2.5 text-sm font-semibold text-white hover:bg-brand-900"
        >
          {t("newMortgage.review.continueToDocuments")}
        </button>
      </div>
    </section>
  );
}
