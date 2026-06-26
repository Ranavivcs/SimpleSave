import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { NewMortgageWizard } from "@/modules/new-mortgage/NewMortgageWizard";

/**
 * New-mortgage guest flow (the home-page "משכנתא חדשה" card links here).
 * Public — no auth; the calculator stays open to anonymous visitors.
 */
export default async function NewMortgagePage() {
  const t = await getTranslations("newMortgage");
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <h1 className="text-2xl font-extrabold text-brand-900">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted">{t("subtitle")}</p>
        <div className="mt-8">
          <NewMortgageWizard />
        </div>
      </main>
    </>
  );
}
