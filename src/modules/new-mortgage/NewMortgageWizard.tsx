"use client";

/**
 * New-mortgage flow — thin client wrapper that wires the new-mortgage config,
 * its eligibility mapping, and its cross-field validation into the generic
 * QuestionnaireWizard, plus a live "estimated loan" summary (value − equity).
 */

import { type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { QuestionnaireWizard } from "@/modules/questionnaire/QuestionnaireWizard";
import type { QuestionnaireAnswer } from "@/lib/questionnaire";
import type { ResolveDialsInput } from "@/lib/dials";
import { DialsScreen } from "@/modules/dials/DialsScreen";
import {
  newMortgageQuestionnaire,
  answerToEligibilityInput,
  validateNewMortgage,
} from "./newMortgageQuestionnaire";

const nis = new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 });

export function NewMortgageWizard() {
  const t = useTranslations("newMortgage");

  const renderSummary = (a: QuestionnaireAnswer): ReactNode => {
    const pv = typeof a.values.propertyValue === "number" ? a.values.propertyValue : null;
    const eq = typeof a.values.equity === "number" ? a.values.equity : null;
    if (pv === null || eq === null) return null;
    return (
      <div className="mt-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-900">
        {t("summary.estimatedLoan")}:{" "}
        <span className="font-semibold">{nis.format(Math.max(0, pv - eq))}</span>
      </div>
    );
  };

  const renderResult = (answer: QuestionnaireAnswer, onReset: () => void): ReactNode => {
    const input: ResolveDialsInput = {
      loanAmount: answerToEligibilityInput(answer).requestedLoan,
      purpose: answer.values.loanType === "allPurpose" ? "allPurpose" : "housing",
      minPay: typeof answer.values.desiredPaymentMin === "number" ? answer.values.desiredPaymentMin : 0,
      maxPay: typeof answer.values.desiredPaymentMax === "number" ? answer.values.desiredPaymentMax : 0,
    };
    return <DialsScreen input={input} onEdit={onReset} />;
  };

  return (
    <QuestionnaireWizard
      questionnaire={newMortgageQuestionnaire}
      mapToEligibility={answerToEligibilityInput}
      extraValidate={validateNewMortgage}
      renderSummary={renderSummary}
      renderResult={renderResult}
    />
  );
}
