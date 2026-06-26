import { getTranslations } from "next-intl/server";
import { AdvisorTabs, ADVISOR_VIEWS, type AdvisorView } from "@/modules/advisor/AdvisorTabs";
import { ClientsPanel } from "@/modules/advisor/ClientsPanel";
import { getAdvisorClients } from "@/modules/advisor/data";
import { sortClients, statusCounts, CLIENT_STATUSES } from "@/modules/advisor/types";

/**
 * Advisor area. Two views (my clients / tasks). The clients list is sorted by
 * next-treatment-date then unread messages; tasks is a placeholder this slice.
 */
export default async function AdvisorPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const active: AdvisorView = ADVISOR_VIEWS.includes(view as AdvisorView)
    ? (view as AdvisorView)
    : "clients";
  const t = await getTranslations("advisor");

  const clients = sortClients(await getAdvisorClients());
  const counts = statusCounts(clients);
  const openTasks = 0; // tasks tab is a later slice

  return (
    <>
      {/* Top stat cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard label={t("stats.openTasks")} value={openTasks} />
        <StatCard label={t("stats.myClients")} value={counts.all} />
      </div>

      <AdvisorTabs active={active} />

      {active === "tasks" ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-900">{t("views.tasks")}</h2>
          <p className="mt-2 text-sm text-muted">{t("tasksSoon")}</p>
        </div>
      ) : (
        <div className="mt-6">
          {/* Status counters */}
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <CounterCard label={t("filters.all")} value={counts.all} accent="text-brand-700" />
            {CLIENT_STATUSES.map((s) => (
              <CounterCard
                key={s}
                label={t(`status.${s}`)}
                value={counts[s]}
                accent={
                  s === "in"
                    ? "text-amber-600"
                    : s === "after"
                      ? "text-emerald-600"
                      : "text-slate-700"
                }
              />
            ))}
          </div>

          <ClientsPanel clients={clients} />
        </div>
      )}
    </>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <span className="text-2xl font-bold text-slate-900">{value}</span>
    </div>
  );
}

function CounterCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center">
      <div className={"text-2xl font-bold " + accent}>{value}</div>
      <div className="mt-1 text-xs font-medium text-slate-500">{label}</div>
    </div>
  );
}
