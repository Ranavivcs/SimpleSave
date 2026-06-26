import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import {
  EXIT_PENALTIES,
  RISK_INDEXED,
  RISK_ROUTE_KINDS,
} from "@/modules/admin/constants";
import { AdminPageHeader } from "@/modules/admin/AdminPageHeader";
import { SubmitButton } from "@/modules/admin/SubmitButton";
import {
  createRiskRule,
  deleteRiskRule,
  updateRiskRule,
} from "@/modules/admin/risk/actions";

const cell =
  "rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none";
const ROW = "grid grid-cols-2 gap-2 sm:grid-cols-8 sm:items-center";

const KIND_KEY: Record<string, string> = {
  FIXED: "risk.kindFixed",
  VARIABLE: "risk.kindVariable",
  PRIME: "risk.kindPrime",
  ALL: "risk.kindAll",
};
const INDEXED_KEY: Record<string, string> = {
  YES: "risk.indexedYes",
  NO: "risk.indexedNo",
  ANY: "risk.indexedAny",
};

export default async function RiskPage() {
  await requireAdmin();
  const t = await getTranslations("admin");
  const rules = await prisma.riskRule.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <AdminPageHeader title={t("risk.title")} intro={t("risk.intro")} />

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div
          className={`${ROW} mb-2 hidden px-1 text-xs font-semibold text-slate-500 sm:grid`}
        >
          <span>{t("risk.routeKind")}</span>
          <span>{t("risk.fromMonths")}</span>
          <span>{t("risk.toMonths")}</span>
          <span>{t("risk.indexed")}</span>
          <span>{t("risk.exitPenalty")}</span>
          <span>{t("risk.riskLevel")}</span>
          <span>{t("risk.order")}</span>
          <span>{t("common.actions")}</span>
        </div>

        <div className="space-y-2">
          {rules.length === 0 && (
            <p className="py-4 text-sm text-slate-400">{t("common.none")}</p>
          )}

          {rules.map((r) => (
            <form
              key={r.id}
              action={updateRiskRule.bind(null, r.id)}
              className={`${ROW} rounded-xl bg-slate-50 p-2`}
            >
              <select name="routeKind" defaultValue={r.routeKind} className={cell}>
                {RISK_ROUTE_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {t(KIND_KEY[k])}
                  </option>
                ))}
              </select>
              <input name="fromMonths" type="number" step="1" defaultValue={r.fromMonths} required dir="ltr" className={cell} />
              <input name="toMonths" type="number" step="1" defaultValue={r.toMonths} required dir="ltr" className={cell} />
              <select name="indexed" defaultValue={r.indexed} className={cell}>
                {RISK_INDEXED.map((i) => (
                  <option key={i} value={i}>
                    {t(INDEXED_KEY[i])}
                  </option>
                ))}
              </select>
              <select name="exitPenalty" defaultValue={r.exitPenalty} className={cell}>
                {EXIT_PENALTIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <input name="risk" type="number" min={1} max={5} step="1" defaultValue={r.risk} required dir="ltr" className={cell} />
              <input name="order" type="number" step="1" defaultValue={r.order} required dir="ltr" className={cell} />
              <div className="flex gap-2">
                <SubmitButton className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                  {t("common.save")}
                </SubmitButton>
                <SubmitButton
                  formAction={deleteRiskRule.bind(null, r.id)}
                  noValidate
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {t("common.delete")}
                </SubmitButton>
              </div>
            </form>
          ))}
        </div>

        <form
          action={createRiskRule}
          className={`${ROW} mt-4 rounded-xl border border-dashed border-slate-300 p-2`}
        >
          <select name="routeKind" defaultValue="FIXED" className={cell}>
            {RISK_ROUTE_KINDS.map((k) => (
              <option key={k} value={k}>
                {t(KIND_KEY[k])}
              </option>
            ))}
          </select>
          <input name="fromMonths" type="number" step="1" defaultValue={0} required dir="ltr" className={cell} />
          <input name="toMonths" type="number" step="1" defaultValue={0} required dir="ltr" className={cell} />
          <select name="indexed" defaultValue="ANY" className={cell}>
            {RISK_INDEXED.map((i) => (
              <option key={i} value={i}>
                {t(INDEXED_KEY[i])}
              </option>
            ))}
          </select>
          <select name="exitPenalty" defaultValue="נמוך" className={cell}>
            {EXIT_PENALTIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <input name="risk" type="number" min={1} max={5} step="1" defaultValue={1} required dir="ltr" className={cell} />
          <input name="order" type="number" step="1" defaultValue={rules.length} required dir="ltr" className={cell} />
          <SubmitButton className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 disabled:opacity-50">
            {t("common.addRow")}
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
