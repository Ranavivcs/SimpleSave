import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { toPctOpt } from "@/modules/admin/format";
import { INDEX_TYPES, ROUTE_KINDS } from "@/modules/admin/constants";
import { AdminPageHeader } from "@/modules/admin/AdminPageHeader";
import { SubmitButton } from "@/modules/admin/SubmitButton";
import {
  createTrack,
  deleteTrack,
  updateTemplate,
  updateTrack,
} from "@/modules/admin/dials/actions";

const cell =
  "rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none";
const ROW = "grid grid-cols-2 gap-2 sm:grid-cols-5 lg:grid-cols-10 lg:items-center";

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
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">{t("dials.name")}</span>
            <input name="name" defaultValue={tpl.name} required className={`${cell} w-full`} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">{t("dials.order")}</span>
            <input name="order" type="number" step="1" defaultValue={tpl.order} required dir="ltr" className={`${cell} w-full`} />
          </label>
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

        <div
          className={`${ROW} mb-2 hidden px-1 text-xs font-semibold text-slate-500 lg:grid`}
        >
          <span>{t("dials.order")}</span>
          <span>{t("dials.kind")}</span>
          <span>{t("dials.sharePct")}</span>
          <span>{t("dials.indexType")}</span>
          <span>{t("dials.changeMonths")}</span>
          <span>{t("dials.yearStep")}</span>
          <span>{t("dials.anchorType")}</span>
          <span>{t("dials.anchor")}</span>
          <span>{t("dials.margin")}</span>
          <span>{t("common.actions")}</span>
        </div>

        <div className="space-y-2">
          {tpl.tracks.length === 0 && (
            <p className="py-4 text-sm text-slate-400">{t("common.none")}</p>
          )}

          {tpl.tracks.map((tr) => (
            <form
              key={tr.id}
              action={updateTrack.bind(null, tr.id)}
              className={`${ROW} rounded-xl bg-slate-50 p-2`}
            >
              <input type="hidden" name="key" value={tpl.key} />
              <input name="order" type="number" step="1" defaultValue={tr.order} required dir="ltr" className={cell} aria-label={t("dials.order")} />
              <select name="kind" defaultValue={tr.kind} className={cell} aria-label={t("dials.kind")}>
                {ROUTE_KINDS.map((k) => (
                  <option key={k} value={k}>{t(KIND_KEY[k])}</option>
                ))}
              </select>
              <input name="sharePct" type="number" step="1" defaultValue={tr.sharePct} required dir="ltr" className={cell} aria-label={t("dials.sharePct")} />
              <select name="indexType" defaultValue={tr.indexType} className={cell} aria-label={t("dials.indexType")}>
                {INDEX_TYPES.map((i) => (
                  <option key={i} value={i}>{t(INDEX_KEY[i])}</option>
                ))}
              </select>
              <input name="changeMonths" type="number" step="1" defaultValue={tr.changeMonths ?? ""} dir="ltr" className={cell} aria-label={t("dials.changeMonths")} />
              <input name="yearStep" type="number" step="1" defaultValue={tr.yearStep ?? ""} dir="ltr" className={cell} aria-label={t("dials.yearStep")} />
              <input name="anchorType" defaultValue={tr.anchorType ?? ""} dir="ltr" className={cell} aria-label={t("dials.anchorType")} />
              <input name="anchor" type="number" step="0.01" defaultValue={toPctOpt(tr.anchor)} dir="ltr" className={cell} aria-label={t("dials.anchor")} />
              <input name="margin" type="number" step="0.01" defaultValue={toPctOpt(tr.margin)} dir="ltr" className={cell} aria-label={t("dials.margin")} />
              <div className="flex gap-2">
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
            className={`${ROW} mt-4 rounded-xl border border-dashed border-slate-300 p-2`}
          >
          <input type="hidden" name="key" value={tpl.key} />
          <input name="order" type="number" step="1" defaultValue={tpl.tracks.length} required dir="ltr" className={cell} aria-label={t("dials.order")} />
          <select name="kind" defaultValue="FIXED" className={cell} aria-label={t("dials.kind")}>
            {ROUTE_KINDS.map((k) => (
              <option key={k} value={k}>{t(KIND_KEY[k])}</option>
            ))}
          </select>
          <input name="sharePct" type="number" step="1" defaultValue={0} required dir="ltr" className={cell} aria-label={t("dials.sharePct")} />
          <select name="indexType" defaultValue="NONE" className={cell} aria-label={t("dials.indexType")}>
            {INDEX_TYPES.map((i) => (
              <option key={i} value={i}>{t(INDEX_KEY[i])}</option>
            ))}
          </select>
          <input name="changeMonths" type="number" step="1" defaultValue="" dir="ltr" className={cell} aria-label={t("dials.changeMonths")} />
          <input name="yearStep" type="number" step="1" defaultValue="" dir="ltr" className={cell} aria-label={t("dials.yearStep")} />
          <input name="anchorType" defaultValue="" dir="ltr" className={cell} aria-label={t("dials.anchorType")} />
          <input name="anchor" type="number" step="0.01" defaultValue="" dir="ltr" className={cell} aria-label={t("dials.anchor")} />
          <input name="margin" type="number" step="0.01" defaultValue="" dir="ltr" className={cell} aria-label={t("dials.margin")} />
          <SubmitButton className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 disabled:opacity-50">
            {t("dials.addTrack")}
          </SubmitButton>
          </form>
        )}
      </div>
    </div>
  );
}
