import { useTranslations } from "next-intl";
import { QuestionnaireWizard } from "@/modules/questionnaire/QuestionnaireWizard";
import { sampleNewMortgage } from "@/modules/questionnaire/sampleNewMortgage";

/**
 * Demo route — live walkthrough of the questionnaire engine (3A) feeding the
 * eligibility engine (3B). In-memory only; not part of the production flow yet.
 */
export default function DemoQuestionnairePage() {
  const t = useTranslations("demo");
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <span className="mb-3 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
        {t("badge")}
      </span>
      <h1 className="text-2xl font-extrabold text-brand-900">{t("pageTitle")}</h1>
      <p className="mt-2 text-sm text-muted">{t("pageSubtitle")}</p>
      <div className="mt-8">
        <QuestionnaireWizard questionnaire={sampleNewMortgage} />
      </div>
    </main>
  );
}
