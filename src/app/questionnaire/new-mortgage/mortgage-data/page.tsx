import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";

/**
 * Placeholder for the mortgage-data page ("דף נתוני משכנתא") that the dial
 * speedometer's "קבל פירוט" links to. The full screen is the next module.
 */
export default async function MortgageDataPage({
  searchParams,
}: {
  searchParams: Promise<{ dial?: string }>;
}) {
  const { dial } = await searchParams;
  const t = await getTranslations("dials.mortgageData");
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 text-center">
        <h1 className="text-2xl font-extrabold text-brand-900">{t("title")}</h1>
        <p className="mt-3 text-muted">{t("comingSoon")}</p>
        {dial && <p className="mt-1 text-sm text-muted">{t("selectedDial", { dial })}</p>}
        <Link href="/questionnaire/new-mortgage" className="mt-6 inline-block text-sm font-medium text-brand-700 hover:underline">
          {t("back")}
        </Link>
      </main>
    </>
  );
}
