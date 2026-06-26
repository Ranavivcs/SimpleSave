import { getTranslations } from "next-intl/server";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { signOut } from "@/modules/auth/actions";
import { getAdvisorContext } from "@/modules/advisor/context";
import { AdvisorGate } from "@/modules/advisor/AdvisorGate";

/**
 * Advisor-area shell. Access is the real ADVISOR role (or a dev preview); the
 * gate is shown otherwise. Mirrors the admin/account layouts.
 */
export default async function AdvisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getAdvisorContext();
  const t = await getTranslations("advisor");

  return (
    <>
      <SiteHeader />
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {!ctx ? (
          <AdvisorGate />
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h1 className="text-2xl font-bold text-brand-900">
                  {t("greeting", { name: ctx.name })}
                </h1>
                <p className="text-sm text-muted">{t("areaSubtitle")}</p>
              </div>
              <form action={signOut}>
                <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-50">
                  {t("logout")}
                </button>
              </form>
            </div>
            {children}
          </>
        )}
      </div>
    </>
  );
}
