import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { RoutineUpdates } from "@/modules/admin/RoutineUpdates";

const SECTIONS = [
  { href: "/admin/dials", key: "dials" },
  { href: "/admin/rates", key: "rates" },
  { href: "/admin/parameters", key: "parameters" },
  { href: "/admin/leads", key: "leads" },
  { href: "/admin/advisors", key: "advisors" },
] as const;

export default async function AdminHomePage() {
  const t = await getTranslations("admin");

  return (
    <div className="space-y-8">
      <div>
        <p className="mb-6 text-sm text-slate-600">{t("dashboard.subtitle")}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s) => (
            <Link
              key={s.key}
              href={s.href}
              className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-slate-300 hover:shadow-sm"
            >
              <h2 className="mb-1 text-lg font-semibold text-slate-900 group-hover:text-blue-700">
                {t(`nav.${s.key}`)}
              </h2>
              <p className="text-sm text-slate-600">
                {t(`dashboard.${s.key}Desc`)}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <RoutineUpdates />
    </div>
  );
}
