import { getTranslations } from "next-intl/server";
import Link from "next/link";

/** Title + intro + "back to dashboard" link shared by the config sub-pages. */
export async function AdminPageHeader({
  title,
  intro,
}: {
  title: string;
  intro: string;
}) {
  const t = await getTranslations("admin");
  return (
    <div className="mb-6">
      <Link
        href="/admin"
        className="text-xs text-slate-500 transition hover:text-slate-700"
      >
        ← {t("nav.back")}
      </Link>
      <h2 className="mt-2 text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{intro}</p>
    </div>
  );
}
