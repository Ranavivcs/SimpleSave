"use client";

/**
 * One dial card — name, risk speedometer, the 3 metrics, and the
 * בחר שעון / פירוט buttons. "פירוט" expands the PaymentChart inline.
 */

import { useTranslations } from "next-intl";
import { Speedometer } from "./Speedometer";
import { PaymentChart } from "./PaymentChart";
import type { DialCardData } from "./dialView";

const nis = new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 });

export function DialCard({
  dial,
  selected,
  expanded,
  onSelect,
  onToggleDetails,
}: {
  dial: DialCardData;
  selected: boolean;
  expanded: boolean;
  onSelect: () => void;
  onToggleDetails: () => void;
}) {
  const t = useTranslations("dials");

  const metrics: [string, string][] = [
    [t("metrics.firstPay"), nis.format(dial.firstPay)],
    [t("metrics.total"), nis.format(dial.total)],
    [t("metrics.interestAndIndexation"), nis.format(dial.interestAndIndexation)],
  ];

  return (
    <div
      className={
        "flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition " +
        (selected ? "border-brand-600 ring-2 ring-brand-200" : "border-slate-200 hover:shadow-md")
      }
    >
      <h3 className="text-center text-base font-bold text-slate-900">{dial.name}</h3>

      <div className="mt-3">
        <Speedometer
          level={dial.risk.level}
          label={dial.risk.label}
          detailsHref={`/questionnaire/new-mortgage/mortgage-data?dial=${encodeURIComponent(dial.key)}`}
          detailsLabel={t("getDetails")}
        />
      </div>

      <dl className="mt-4 space-y-2">
        {metrics.map(([k, v]) => (
          <div key={k} className="rounded-lg bg-brand-50 px-3 py-2 text-center">
            <dt className="text-xs text-muted">{k}</dt>
            <dd className="mt-0.5 text-base font-bold text-brand-900">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onSelect}
          className={
            "flex-1 rounded-lg px-3 py-2 text-sm font-semibold " +
            (selected ? "bg-brand-900 text-white" : "bg-brand-700 text-white hover:bg-brand-900")
          }
        >
          {selected ? t("chosen") : t("choose")}
        </button>
        <button
          type="button"
          onClick={onToggleDetails}
          aria-expanded={expanded}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-brand-500"
        >
          {t("details")}
        </button>
      </div>

      {expanded && <PaymentChart chart={dial.chart} />}
    </div>
  );
}
