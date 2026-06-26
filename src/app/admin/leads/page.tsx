import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { AdminPageHeader } from "@/modules/admin/AdminPageHeader";
import { SubmitButton } from "@/modules/admin/SubmitButton";
import { listAdvisors } from "@/modules/admin/advisors";
import { assignAdvisor } from "@/modules/admin/leads/actions";

const nis = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 0,
});
const cell =
  "rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none";
const ROW = "grid grid-cols-2 gap-2 sm:grid-cols-7 sm:items-center";

export default async function LeadsPage() {
  await requireAdmin();
  const t = await getTranslations("admin");
  const [clients, advisors] = await Promise.all([
    prisma.advisorClient.findMany({ orderBy: { createdAt: "desc" } }),
    listAdvisors(),
  ]);

  return (
    <div>
      <AdminPageHeader title={t("leads.title")} intro={t("leads.intro")} />

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div
          className={`${ROW} mb-2 hidden px-1 text-xs font-semibold text-slate-500 sm:grid`}
        >
          <span>{t("leads.name")}</span>
          <span>{t("leads.email")}</span>
          <span>{t("leads.requestType")}</span>
          <span>{t("leads.loanAmount")}</span>
          <span>{t("leads.status")}</span>
          <span>{t("leads.advisor")}</span>
          <span>{t("leads.save")}</span>
        </div>

        <div className="space-y-2">
          {clients.length === 0 && (
            <p className="py-4 text-sm text-slate-400">{t("common.none")}</p>
          )}

          {clients.map((c) => (
            <form
              key={c.id}
              action={assignAdvisor.bind(null, c.id)}
              className={`${ROW} rounded-xl bg-slate-50 p-2`}
            >
              <span className="text-sm font-medium text-slate-900">{c.name}</span>
              <span className="truncate text-sm text-slate-600" dir="ltr">{c.email}</span>
              <span className="text-sm text-slate-600">{c.requestType}</span>
              <span className="text-sm text-slate-600" dir="ltr">{nis.format(c.loanAmount)}</span>
              <span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                  {t(`leads.statusLabels.${c.status}`)}
                </span>
              </span>
              <select name="advisorName" defaultValue={c.advisorName} className={cell}>
                <option value="">{t("leads.unassigned")}</option>
                {advisors.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <SubmitButton className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                {t("leads.save")}
              </SubmitButton>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
