import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AccountTabs, ACCOUNT_TABS, type AccountTab } from "@/modules/account/AccountTabs";
import { QuestionnaireWizard } from "@/modules/questionnaire/QuestionnaireWizard";
import { personalData } from "@/modules/questionnaire/content/personalData";

const TYPES = ["new-mortgage", "refinance", "insurance"];

/**
 * Tabbed personal area for one request. Tabs: personal data · mortgage data ·
 * אישור עקרוני · documents · collateral · messages. The personal-data and
 * mortgage-data forms (reusing the questionnaire engine) land in the next slice.
 */
export default async function RequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { type } = await params;
  const { tab } = await searchParams;
  if (!TYPES.includes(type)) notFound();

  const active: AccountTab = ACCOUNT_TABS.includes(tab as AccountTab)
    ? (tab as AccountTab)
    : "personal";
  const t = await getTranslations("account");

  return (
    <>
      <h1 className="mb-5 text-2xl font-bold text-brand-900">{t(`requests.${type}`)}</h1>
      <AccountTabs type={type} active={active} />
      {active === "personal" ? (
        <div className="mt-6">
          <QuestionnaireWizard questionnaire={personalData} mode="save" />
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">{t(`tabs.${active}`)}</h2>
          <p className="mt-2 text-sm text-muted">{t("soonDesc")}</p>
        </div>
      )}
    </>
  );
}
