import { getTranslations } from "next-intl/server";

export default async function AdminHomePage() {
  const t = await getTranslations("admin");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8">
      <h2 className="mb-2 text-lg font-semibold text-slate-900">
        {t("welcome")}
      </h2>
      <p className="text-sm text-slate-600">{t("comingSoon")}</p>
    </div>
  );
}
