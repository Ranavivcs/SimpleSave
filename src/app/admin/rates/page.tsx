import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { toPct } from "@/modules/admin/format";
import { LOAN_PURPOSES, ROUTE_KEYS } from "@/modules/admin/constants";
import { AdminPageHeader } from "@/modules/admin/AdminPageHeader";
import { SubmitButton } from "@/modules/admin/SubmitButton";
import {
  createRateBand,
  deleteRateBand,
  updateRateBand,
} from "@/modules/admin/rates/actions";

const cell =
  "rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none";
const ROW = "grid grid-cols-2 gap-2 sm:grid-cols-7 sm:items-center";

export default async function RatesPage() {
  await requireAdmin();
  const t = await getTranslations("admin");
  const bands = await prisma.rateBand.findMany({
    orderBy: [{ purpose: "asc" }, { routeKey: "asc" }, { fromYears: "asc" }],
  });

  const purposeLabel = (p: string) =>
    p === "HOUSING" ? t("rates.purposeHousing") : t("rates.purposeAllPurpose");

  return (
    <div>
      <AdminPageHeader title={t("rates.title")} intro={t("rates.intro")} />

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        {/* header (desktop) */}
        <div
          className={`${ROW} mb-2 hidden px-1 text-xs font-semibold text-slate-500 sm:grid`}
        >
          <span>{t("rates.purpose")}</span>
          <span>{t("rates.routeKey")}</span>
          <span>{t("rates.fromYears")}</span>
          <span>{t("rates.toYears")}</span>
          <span>{t("rates.anchor")}</span>
          <span>{t("rates.margin")}</span>
          <span>{t("common.actions")}</span>
        </div>

        <div className="space-y-2">
          {bands.length === 0 && (
            <p className="py-4 text-sm text-slate-400">{t("common.none")}</p>
          )}

          {bands.map((b) => (
            <form
              key={b.id}
              action={updateRateBand.bind(null, b.id)}
              className={`${ROW} rounded-xl bg-slate-50 p-2`}
            >
              <select name="purpose" defaultValue={b.purpose} className={cell}>
                {LOAN_PURPOSES.map((p) => (
                  <option key={p} value={p}>
                    {purposeLabel(p)}
                  </option>
                ))}
              </select>
              <select name="routeKey" defaultValue={b.routeKey} className={cell} dir="ltr">
                {ROUTE_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <input name="fromYears" type="number" step="0.5" defaultValue={b.fromYears} required dir="ltr" className={cell} />
              <input name="toYears" type="number" step="0.5" defaultValue={b.toYears} required dir="ltr" className={cell} />
              <input name="anchor" type="number" step="0.01" defaultValue={toPct(b.anchor)} required dir="ltr" className={cell} />
              <input name="margin" type="number" step="0.01" defaultValue={toPct(b.margin)} required dir="ltr" className={cell} />
              <div className="flex gap-2">
                <SubmitButton className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                  {t("common.save")}
                </SubmitButton>
                <SubmitButton
                  formAction={deleteRateBand.bind(null, b.id)}
                  noValidate
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {t("common.delete")}
                </SubmitButton>
              </div>
            </form>
          ))}
        </div>

        {/* add new */}
        <form
          action={createRateBand}
          className={`${ROW} mt-4 rounded-xl border border-dashed border-slate-300 p-2`}
        >
          <select name="purpose" defaultValue="HOUSING" className={cell}>
            {LOAN_PURPOSES.map((p) => (
              <option key={p} value={p}>
                {purposeLabel(p)}
              </option>
            ))}
          </select>
          <select name="routeKey" defaultValue="prime" className={cell} dir="ltr">
            {ROUTE_KEYS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <input name="fromYears" type="number" step="0.5" defaultValue={0} required dir="ltr" className={cell} />
          <input name="toYears" type="number" step="0.5" defaultValue={30} required dir="ltr" className={cell} />
          <input name="anchor" type="number" step="0.01" defaultValue={0} required dir="ltr" className={cell} />
          <input name="margin" type="number" step="0.01" defaultValue={0} required dir="ltr" className={cell} />
          <SubmitButton className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 disabled:opacity-50">
            {t("common.addRow")}
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
