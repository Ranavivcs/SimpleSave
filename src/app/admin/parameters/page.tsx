import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { toPct } from "@/modules/admin/format";
import { AdminPageHeader } from "@/modules/admin/AdminPageHeader";
import { SubmitButton } from "@/modules/admin/SubmitButton";
import { updateParameters } from "@/modules/admin/parameters/actions";

function NumberField({
  label,
  name,
  defaultValue,
  step,
}: {
  label: string;
  name: string;
  defaultValue: number;
  step: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <input
        name={name}
        type="number"
        step={step}
        defaultValue={defaultValue}
        required
        dir="ltr"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />
    </label>
  );
}

export default async function ParametersPage() {
  await requireAdmin();
  const t = await getTranslations("admin");
  const p = await prisma.globalParameters.findFirst({ where: { isActive: true } });

  const v = {
    expectedIndexAnnual: p?.expectedIndexAnnual ?? 0.03,
    expectedDollarAnnual: p?.expectedDollarAnnual ?? 0,
    expectedEuroAnnual: p?.expectedEuroAnnual ?? 0,
    primeRate: p?.primeRate ?? 0.0456,
    maxRepaymentPct: p?.maxRepaymentPct ?? 0.4,
    loanTermMaxAge: p?.loanTermMaxAge ?? 85,
    creditLookbackYrs: p?.creditLookbackYrs ?? 7,
  };

  return (
    <div>
      <AdminPageHeader title={t("parameters.title")} intro={t("parameters.intro")} />

      <form
        action={updateParameters}
        className="space-y-8 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <section>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            {t("parameters.marketTitle")}
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <NumberField label={t("parameters.expectedIndexAnnual")} name="expectedIndexAnnual" defaultValue={toPct(v.expectedIndexAnnual)} step="0.01" />
            <NumberField label={t("parameters.expectedDollarAnnual")} name="expectedDollarAnnual" defaultValue={toPct(v.expectedDollarAnnual)} step="0.01" />
            <NumberField label={t("parameters.expectedEuroAnnual")} name="expectedEuroAnnual" defaultValue={toPct(v.expectedEuroAnnual)} step="0.01" />
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            {t("parameters.anchorsTitle")}
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <NumberField label={t("parameters.primeRate")} name="primeRate" defaultValue={toPct(v.primeRate)} step="0.01" />
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            {t("parameters.rulesTitle")}
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <NumberField label={t("parameters.maxRepaymentPct")} name="maxRepaymentPct" defaultValue={toPct(v.maxRepaymentPct)} step="0.1" />
            <NumberField label={t("parameters.loanTermMaxAge")} name="loanTermMaxAge" defaultValue={v.loanTermMaxAge} step="1" />
            <NumberField label={t("parameters.creditLookbackYrs")} name="creditLookbackYrs" defaultValue={v.creditLookbackYrs} step="1" />
          </div>
        </section>

        <div className="flex justify-end border-t border-slate-100 pt-4">
          <SubmitButton className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">
            {t("common.save")}
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
