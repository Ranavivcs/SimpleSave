import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/layout/SiteHeader";

/**
 * Refinance / insurance questionnaires — "coming soon" until their content +
 * parsers land (Phase 3D / 3E). The new-mortgage flow has its own dedicated
 * route at /questionnaire/new-mortgage, which takes precedence over this
 * dynamic segment.
 */
const TITLE_KEY: Record<string, string> = {
  refinance: "services.refinance.title",
  insurance: "services.insurance.title",
};

export default async function QuestionnairePage({
  params,
}: {
  params: Promise<{ variant: string }>;
}) {
  const { variant } = await params;
  if (!TITLE_KEY[variant]) notFound();
  const t = await getTranslations();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <h1 className="mb-6 text-2xl font-extrabold text-brand-900">{t(TITLE_KEY[variant])}</h1>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
            {t("questionnaire.comingSoon")}
          </span>
          <p className="mt-4 text-sm text-muted">{t("questionnaire.comingSoonDesc")}</p>
        </div>
      </main>
    </>
  );
}
