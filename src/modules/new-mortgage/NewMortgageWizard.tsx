"use client";

/**
 * New-mortgage flow — thin client wrapper that wires the new-mortgage config,
 * its eligibility mapping, and its cross-field validation into the generic
 * QuestionnaireWizard, plus a live "estimated loan" summary (value − equity).
 *
 * After the questionnaire completes the post-flow takes over:
 * dials ("clocks") → review (all answers + chosen dial) → document upload.
 */

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { QuestionnaireWizard } from "@/modules/questionnaire/QuestionnaireWizard";
import type { QuestionnaireAnswer } from "@/lib/questionnaire";
import type { ResolveDialsInput } from "@/lib/dials";
import { DialsScreen } from "@/modules/dials/DialsScreen";
import type { DialCardData } from "@/modules/dials/dialView";
import { DocumentsUploadScreen } from "@/modules/documents/DocumentsUploadScreen";
import { NewMortgageReview } from "./NewMortgageReview";
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

  const renderResult = (answer: QuestionnaireAnswer, onReset: () => void): ReactNode => (
    <NewMortgagePostFlow answer={answer} onReset={onReset} />
  );

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

/**
 * Post-questionnaire stages: dials → review → documents. The chosen dial is
 * kept here so going back from the review re-enters the dials screen (the
 * selection there resets — a fresh pick is required to continue again).
 */
function NewMortgagePostFlow({ answer, onReset }: { answer: QuestionnaireAnswer; onReset: () => void }) {
  const [stage, setStage] = useState<"dials" | "review" | "documents">("dials");
  const [dial, setDial] = useState<DialCardData | null>(null);

  if (stage === "review" && dial) {
    return (
      <NewMortgageReview
        questionnaire={newMortgageQuestionnaire}
        answer={answer}
        dial={dial}
        onBack={() => setStage("dials")}
        onContinue={() => setStage("documents")}
      />
    );
  }
  if (stage === "documents") {
    return <DocumentsUploadScreen type="new-mortgage" onBack={() => setStage("review")} />;
  }

  const input: ResolveDialsInput = {
    loanAmount: answerToEligibilityInput(answer).requestedLoan,
    purpose: answer.values.loanType === "allPurpose" ? "allPurpose" : "housing",
    minPay: typeof answer.values.desiredPaymentMin === "number" ? answer.values.desiredPaymentMin : 0,
    maxPay: typeof answer.values.desiredPaymentMax === "number" ? answer.values.desiredPaymentMax : 0,
  };
  return (
    <DialsScreen
      input={input}
      onEdit={onReset}
      onContinue={(d) => {
        setDial(d);
        setStage("review");
        stashPendingRequest(answer, d);
      }}
    />
  );
}

/**
 * Keep the guest's questionnaire summary in localStorage so it survives the
 * registration redirect; the personal area claims it after sign-in (see
 * ClaimPendingRequest) and fills the advisor's client record with real numbers.
 */
function stashPendingRequest(answer: QuestionnaireAnswer, dial: DialCardData) {
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  const propertyValue = num(answer.values.propertyValue);
  const equity = num(answer.values.equity);
  try {
    localStorage.setItem(
      "simplesave:pending-request",
      JSON.stringify({
        type: "new-mortgage",
        propertyValue,
        equity,
        loanAmount: Math.max(0, propertyValue - equity),
        dialName: dial.name,
      }),
    );
  } catch {
    // storage unavailable (private mode etc.) — the flow continues without it
  }
}
