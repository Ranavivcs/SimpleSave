import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { AdminPageHeader } from "@/modules/admin/AdminPageHeader";
import { listAdvisors } from "@/modules/admin/advisors";

const nis = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 0,
});

export default async function AdvisorsPage({
  searchParams,
}: {
  searchParams: Promise<{ advisor?: string }>;
}) {
  await requireAdmin();
  const t = await getTranslations("admin");
  const { advisor } = await searchParams;
  const advisors = await listAdvisors();
  const selected = advisor && advisors.includes(advisor) ? advisor : undefined;
  const clients = selected
    ? await prisma.advisorClient.findMany({
        where: { advisorName: selected },
        orderBy: { nextTreatment: "asc" },
      })
    : [];

  return (
    <div>
      <AdminPageHeader title={t("advisors.title")} intro={t("advisors.intro")} />

      <div className="mb-5 flex flex-wrap gap-2">
        {advisors.map((a) => (
          <Link
            key={a}
            href={`/admin/advisors?advisor=${encodeURIComponent(a)}`}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              selected === a
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-slate-300 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {a}
          </Link>
        ))}
      </div>

      {!selected ? (
        <p className="text-sm text-slate-400">{t("advisors.noneSelected")}</p>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-xs text-slate-500">
            {t("advisors.clientCount", { n: clients.length })}
          </p>
          {clients.length === 0 ? (
            <p className="text-sm text-slate-400">{t("advisors.noClients")}</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {clients.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-2 text-sm"
                >
                  <div>
                    <span className="font-medium text-slate-900">{c.name}</span>
                    <span className="ms-2 text-slate-500" dir="ltr">{c.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5">
                      {t(`leads.statusLabels.${c.status}`)}
                    </span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5">
                      {t(`leads.stageLabels.${c.stage}`)}
                    </span>
                    <span dir="ltr">{nis.format(c.loanAmount)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
