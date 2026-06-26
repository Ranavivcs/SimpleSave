import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { AdminPageHeader } from "@/modules/admin/AdminPageHeader";

export default async function DialsPage() {
  await requireAdmin();
  const t = await getTranslations("admin");
  const templates = await prisma.dialTemplate.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { tracks: true } } },
  });

  return (
    <div>
      <AdminPageHeader title={t("dials.title")} intro={t("dials.intro")} />

      <div className="space-y-3">
        {templates.length === 0 && (
          <p className="text-sm text-slate-400">{t("common.none")}</p>
        )}

        {templates.map((tpl) => (
          <Link
            key={tpl.id}
            href={`/admin/dials/${tpl.key}`}
            className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-slate-900">
                  {tpl.name}
                </span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-500" dir="ltr">
                  {tpl.key}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {t("dials.trackCount", { count: tpl._count.tracks })}
              </p>
            </div>
            <span className="text-sm font-medium text-blue-600">
              {t("dials.editTracks")} ←
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
