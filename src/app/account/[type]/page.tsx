import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  AccountTabs,
  ACCOUNT_TABS,
  TAB_SEQUENCE,
  type AccountTab,
} from "@/modules/account/AccountTabs";
import { QuestionnaireWizard } from "@/modules/questionnaire/QuestionnaireWizard";
import { personalData } from "@/modules/questionnaire/content/personalData";
import { mortgageData } from "@/modules/questionnaire/content/mortgageData";
import { DocumentList } from "@/modules/documents/DocumentList";
import { AdvisorMessagesPanel } from "@/modules/account/AdvisorMessagesPanel";
import { getCustomerAdvisorThread } from "@/modules/account/advisorThread";

const TYPES = ["new-mortgage", "refinance", "insurance"];

/**
 * Tabbed personal area for one request. Tabs unlock sequentially (each step
 * completed unlocks the next) — except מסמכים, which is always open so docs can
 * be uploaded at any time. Advisor messages are also open immediately so the
 * customer can talk to the advisor throughout the process.
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

  const c = await cookies();
  const isDone = (tabId: AccountTab) => c.get(`done:${type}:${tabId}`)?.value === "1";
  const isUnlocked = (tabId: AccountTab): boolean => {
    if (tabId === "documents" || tabId === "messages") return true;
    const i = TAB_SEQUENCE.indexOf(tabId);
    return i <= 0 || TAB_SEQUENCE.slice(0, i).every(isDone);
  };
  const unlocked = ACCOUNT_TABS.filter(isUnlocked);

  const active: AccountTab = ACCOUNT_TABS.includes(tab as AccountTab)
    ? (tab as AccountTab)
    : "personal";
  const t = await getTranslations("account");
  const advisorThread = await getCustomerAdvisorThread(type);

  return (
    <>
      <h1 className="mb-5 text-2xl font-bold text-brand-900">{t(`requests.${type}`)}</h1>
      {advisorThread && (
        <div className="mb-4 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-800">
          {t("advisor.assigned", { name: advisorThread.advisorName })}
        </div>
      )}
      <AccountTabs type={type} active={active} unlocked={unlocked} />

      {!isUnlocked(active) ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <p className="text-sm text-muted">{t("locked")}</p>
        </div>
      ) : active === "personal" ? (
        <div className="mt-6">
          <QuestionnaireWizard key={`${type}:personal`} questionnaire={personalData} mode="save" saveKey={`${type}:personal`} />
        </div>
      ) : active === "mortgage" ? (
        <div className="mt-6">
          <QuestionnaireWizard key={`${type}:mortgage`} questionnaire={mortgageData} mode="save" saveKey={`${type}:mortgage`} />
        </div>
      ) : active === "documents" ? (
        <div className="mt-6">
          <DocumentList type={type} />
        </div>
      ) : active === "messages" ? (
        <div className="mt-6">
          <AdvisorMessagesPanel thread={advisorThread} />
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
