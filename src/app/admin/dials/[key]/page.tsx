import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { toPctOpt } from "@/modules/admin/format";
import { AMORTIZATIONS, INDEX_TYPES, ROUTE_KINDS } from "@/modules/admin/constants";
import { AdminPageHeader } from "@/modules/admin/AdminPageHeader";
import { SubmitButton } from "@/modules/admin/SubmitButton";
import {
  createTrack,
  deleteTrack,
  updateTemplate,
  updateTrack,
} from "@/modules/admin/dials/actions";

const cell =
  "w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none";
const GRID = "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6";

const KIND_KEY: Record<string, string> = {
  FIXED: "dials.kindFixed",
  VARIABLE: "dials.kindVariable",
  PRIME: "dials.kindPrime",
};
const INDEX_KEY: Record<string, string> = {
  NONE: "dials.indexNone",
  CPI: "dials.indexCpi",
  USD: "dials.indexUsd",
  EUR: "dials.indexEur",
};
const AMORT_KEY: Record<string, string> = {
  SHPITZER: "dials.amortShpitzer",
  EQUAL_PRINCIPAL: "dials.amortEqualPrincipal",
};

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );
}

export default async function DialEditorPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  await requireAdmin();
  const { key } = await params;
  const t = await getTranslations("admin");

  const tpl = await prisma.dialTemplate.findUnique({
    where: { key },
    include: { tracks: { orderBy: { order: "asc" } } },
  });
  if (!tpl) notFound();

  const shareSum = tpl.tracks.reduce((s, tr) => s + tr.sharePct, 0);

  return (
    <div>
      <AdminPageHeader title={tpl.name} intro={t("dials.intro")} />

      {/* template fields */}
      <form
        action={updateTemplate.bind(null, tpl.id)}
        className="mb-6 rounded-2xl border border-slate-200 bg-white p-6"
      >
        <input type="hidden" name="key" value={tpl.key} />
        <h3 className="mb-3 text-sm font-semibold text-slate-900">
          {t("dials.templateTitle")}
        </h3>
        <div className="grid items-end gap-4 sm:grid-cols-4">
          <Labeled label={t("dials.name")}>
            <input name="name" defaultValue={tpl.name} required className={cell} />
          </Labeled>
          <Labeled label={t("dials.order")}>
            <input name="order" type="number" step="1" defaultValue={tpl.order} required dir="ltr" className={cell} />
          </Labeled>
          <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
            <input name="shortenFixed" type="checkbox" defaultChecked={tpl.shortenFixed} className="h-4 w-4" />
            {t("dials.shortenFixed")}
          </label>
          <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
            <input name="linkedFixedFirst" type="checkbox" defaultChecked={tpl.linkedFixedFirst} className="h-4 w-4" />
            {t("dials.linkedFixedFirst")}
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <SubmitButton className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {t("common.save")}
          </SubmitButton>
        </div>
      </form>

      {/* tracks */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">
            {t("dials.tracksTitle")}{" "}
            <span className="text-xs font-normal text-slate-400">
              ({t("dials.trackLimit", { n: tpl.tracks.length })})
            </span>
          </h3>
          <span
            className={`rounded px-2 py-0.5 text-xs font-semibold ${
              Math.round(shareSum) === 100
                ? "bg-green-50 text-green-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {Math.round(shareSum) === 100
              ? t("dials.shareOk")
              : t("dials.shareSum", { sum: shareSum })}
          </span>
        </div>

        <div className="space-y-3">
          {tpl.tracks.length === 0 && (
            <p className="py-4 text-sm text-slate-400">{t("common.none")}</p>
          )}

          {tpl.tracks.map((tr) => (
            <form
              key={tr.id}
              action={updateTrack.bind(null, tr.id)}
              className="rounded-xl bg-slate-50 p-3"
            >
              <input type="hidden" name="key" value={tpl.key} />
              <div className={GRID}>
                <Labeled label={t("dials.kind")}>
                  <select name="kind" defaultValue={tr.kind} className={cell}>
                    {ROUTE_KINDS.map((k) => (
                      <option key={k} value={k}>{t(KIND_KEY[k])}</option>
                    ))}
                  </select>
                </Labeled>
                <Labeled label={t("dials.amortization")}>
                  <select name="amortization" defaultValue={tr.amortization} className={cell}>
                    {AMORTIZATIONS.map((a) => (
                      <option key={a} value={a}>{t(AMORT_KEY[a])}</option>
                    ))}
                  </select>
                </Labeled>
                <Labeled label={t("dials.indexType")}>
                  <select name="indexType" defaultValue={tr.indexType} className={cell}>
                    {INDEX_TYPES.map((i) => (
                      <option key={i} value={i}>{t(INDEX_KEY[i])}</option>
                    ))}
                  </select>
                </Labeled>
                <Labeled label={t("dials.sharePct")}>
                  <input name="sharePct" type="number" step="1" defaultValue={tr.sharePct} required dir="ltr" className={cell} />
                </Labeled>
                <Labeled label={t("dials.totalPct")}>
                  <input name="totalPct" type="number" step="1" defaultValue={tr.totalPct ?? ""} dir="ltr" className={cell} />
                </Labeled>
                <Labeled label={t("dials.termYears")}>
                  <input name="termYears" type="number" step="1" min={4} max={30} defaultValue={tr.termYears ?? ""} dir="ltr" className={cell} />
                </Labeled>
                <Labeled label={t("dials.changeMonths")}>
                  <input name="changeMonths" type="number" step="1" defaultValue={tr.changeMonths ?? ""} dir="ltr" className={cell} />
                </Labeled>
                <Labeled label={t("dials.yearStep")}>
                  <input name="yearStep" type="number" step="1" defaultValue={tr.yearStep ?? ""} dir="ltr" className={cell} />
                </Labeled>
                <Labeled label={t("dials.anchorType")}>
                  <input name="anchorType" defaultValue={tr.anchorType ?? ""} dir="ltr" className={cell} />
                </Labeled>
                <Labeled label={t("dials.anchor")}>
                  <input name="anchor" type="number" step="0.01" defaultValue={toPctOpt(tr.anchor)} dir="ltr" className={cell} />
                </Labeled>
                <Labeled label={t("dials.margin")}>
                  <input name="margin" type="number" step="0.01" defaultValue={toPctOpt(tr.margin)} dir="ltr" className={cell} />
                </Labeled>
                <Labeled label={t("dials.order")}>
                  <input name="order" type="number" step="1" defaultValue={tr.order} required dir="ltr" className={cell} />
                </Labeled>
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <SubmitButton className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                  {t("common.save")}
                </SubmitButton>
                <SubmitButton
                  formAction={deleteTrack.bind(null, tr.id)}
                  noValidate
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {t("common.delete")}
                </SubmitButton>
              </div>
            </form>
          ))}
        </div>

        {/* add track (max 10 per mix) */}
        {tpl.tracks.length >= 10 ? (
          <p className="mt-4 rounded-xl border border-dashed border-amber-300 bg-amber-50 p-3 text-center text-xs text-amber-700">
            {t("dials.maxTracksReached")}
          </p>
        ) : (
          <form
            action={createTrack.bind(null, tpl.id)}
            className="mt-4 rounded-xl border border-dashed border-slate-300 p-3"
          >
            <input type="hidden" name="key" value={tpl.key} />
            <div className={GRID}>
              <Labeled label={t("dials.kind")}>
                <select name="kind" defaultValue="FIXED" className={cell}>
                  {ROUTE_KINDS.map((k) => (
                    <option key={k} value={k}>{t(KIND_KEY[k])}</option>
                  ))}
                </select>
              </Labeled>
              <Labeled label={t("dials.amortization")}>
                <select name="amortization" defaultValue="SHPITZER" className={cell}>
                  {AMORTIZATIONS.map((a) => (
                    <option key={a} value={a}>{t(AMORT_KEY[a])}</option>
                  ))}
                </select>
              </Labeled>
              <Labeled label={t("dials.indexType")}>
                <select name="indexType" defaultValue="NONE" className={cell}>
                  {INDEX_TYPES.map((i) => (
                    <option key={i} value={i}>{t(INDEX_KEY[i])}</option>
                  ))}
                </select>
              </Labeled>
              <Labeled label={t("dials.sharePct")}>
                <input name="sharePct" type="number" step="1" defaultValue={0} required dir="ltr" className={cell} />
              </Labeled>
              <Labeled label={t("dials.totalPct")}>
                <input name="totalPct" type="number" step="1" defaultValue="" dir="ltr" className={cell} />
              </Labeled>
              <Labeled label={t("dials.termYears")}>
                <input name="termYears" type="number" step="1" min={4} max={30} defaultValue="" dir="ltr" className={cell} />
              </Labeled>
              <Labeled label={t("dials.changeMonths")}>
                <input name="changeMonths" type="number" step="1" defaultValue="" dir="ltr" className={cell} />
              </Labeled>
              <Labeled label={t("dials.yearStep")}>
                <input name="yearStep" type="number" step="1" defaultValue="" dir="ltr" className={cell} />
              </Labeled>
              <Labeled label={t("dials.anchorType")}>
                <input name="anchorType" defaultValue="" dir="ltr" className={cell} />
              </Labeled>
              <Labeled label={t("dials.anchor")}>
                <input name="anchor" type="number" step="0.01" defaultValue="" dir="ltr" className={cell} />
              </Labeled>
              <Labeled label={t("dials.margin")}>
                <input name="margin" type="number" step="0.01" defaultValue="" dir="ltr" className={cell} />
              </Labeled>
              <Labeled label={t("dials.order")}>
                <input name="order" type="number" step="1" defaultValue={tpl.tracks.length} required dir="ltr" className={cell} />
              </Labeled>
            </div>
            <div className="mt-3 flex justify-end">
              <SubmitButton className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 disabled:opacity-50">
                {t("dials.addTrack")}
              </SubmitButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
