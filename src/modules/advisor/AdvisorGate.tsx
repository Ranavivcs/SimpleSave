import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { previewAsAdvisor } from "./actions";

/**
 * Shown when a non-advisor opens /advisor: log in with an advisor account, or
 * (dev only) preview the area without one. Parallels the personal-area gate.
 */
export async function AdvisorGate() {
  const t = await getTranslations("advisor.gate");
  const isDev = process.env.NODE_ENV !== "production";
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-xl font-bold text-slate-900">{t("title")}</h1>
      <p className="mt-2 text-sm text-muted">{t("desc")}</p>
      <div className="mt-6 flex flex-col gap-3">
        <Link
          href="/login?redirect=/advisor"
          className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-900"
        >
          {t("login")}
        </Link>
        {isDev && (
          <form action={previewAsAdvisor}>
            <button className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-brand-500">
              {t("preview")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
