import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { toPct } from "@/modules/admin/format";
import { SubmitButton } from "@/modules/admin/SubmitButton";
import { updateRoutine } from "@/modules/admin/routine/actions";

const dt = new Intl.DateTimeFormat("he-IL", { dateStyle: "medium" });
const cell =
  "w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none";

/** Dashboard panel for the monthly index/prime maintenance (spec: ongoing mgmt). */
export async function RoutineUpdates() {
  const t = await getTranslations("admin.routine");
  const p = await prisma.globalParameters.findFirst({ where: { isActive: true } });

  return (
    <form
      action={updateRoutine}
      className="rounded-2xl border border-slate-200 bg-white p-6"
    >
      <h2 className="text-lg font-semibold text-slate-900">{t("title")}</h2>
      <p className="mt-1 text-sm text-slate-600">{t("intro")}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">{t("indexLabel")}</span>
          <input name="expectedIndexAnnual" type="number" step="0.01" defaultValue={p ? toPct(p.expectedIndexAnnual) : 3} required dir="ltr" className={cell} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">{t("primeLabel")}</span>
          <input name="primeRate" type="number" step="0.01" defaultValue={p ? toPct(p.primeRate) : 4.56} required dir="ltr" className={cell} />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-xs text-slate-400">
          {p && <span>{t("lastUpdated")}: {dt.format(p.updatedAt)}</span>}
          <Link href="/admin/rates" className="text-blue-600 hover:underline">
            {t("toRates")}
          </Link>
        </div>
        <SubmitButton className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {t("save")}
        </SubmitButton>
      </div>
    </form>
  );
}
