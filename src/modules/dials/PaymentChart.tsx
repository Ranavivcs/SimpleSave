"use client";

/**
 * Details chart for a dial — two custom SVG panels (no chart dependency):
 *  1. Monthly payment over the term (line).
 *  2. Cumulative principal & interest (stacked areas).
 * Time axis runs left→right (month 1 → last).
 */

import { useTranslations } from "next-intl";
import type { DialChartSeries } from "./dialView";

const compact = new Intl.NumberFormat("he-IL", { notation: "compact", maximumFractionDigits: 1 });

const W = 560;
const H = 170;
const PAD = 40;

export function PaymentChart({ chart }: { chart: DialChartSeries }) {
  const t = useTranslations("dials.chart");
  const n = chart.months;
  if (n < 2) return null;

  const x = (i: number) => PAD + (i / (n - 1)) * (W - 2 * PAD);
  const y = (v: number, max: number) => H - PAD - (max <= 0 ? 0 : (v / max) * (H - 2 * PAD));
  const baseY = H - PAD;

  // Panel 1 — monthly payment line.
  const payMax = Math.max(...chart.monthlyPayment, 1);
  const payLine = chart.monthlyPayment.map((v, i) => `${i ? "L" : "M"} ${x(i).toFixed(1)} ${y(v, payMax).toFixed(1)}`).join(" ");

  // Panel 2 — cumulative principal & interest (stacked).
  const totals = chart.cumPrincipal.map((p, i) => p + chart.cumInterest[i]);
  const totMax = Math.max(...totals, 1);
  const topPts = (vals: number[]) => vals.map((v, i) => `${x(i).toFixed(1)},${y(v, totMax).toFixed(1)}`).join(" ");
  const principalArea = `${topPts(chart.cumPrincipal)} ${x(n - 1).toFixed(1)},${baseY} ${x(0).toFixed(1)},${baseY}`;
  const revPrincipal = chart.cumPrincipal.map((v, i) => ({ v, i })).reverse().map(({ v, i }) => `${x(i).toFixed(1)},${y(v, totMax).toFixed(1)}`).join(" ");
  const interestArea = `${topPts(totals)} ${revPrincipal}`;

  const yearTicks = () => {
    const ticks: number[] = [];
    for (let m = 0; m < n; m += 60) ticks.push(m); // every 5 years
    if (ticks[ticks.length - 1] !== n - 1) ticks.push(n - 1);
    return ticks;
  };

  return (
    <div className="mt-4 space-y-5">
      <Panel title={`${t("monthly")} (₪)`}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={t("monthly")}>
          <line x1={PAD} y1={baseY} x2={W - PAD} y2={baseY} stroke="#cbd5e1" strokeWidth={1} />
          <text x={PAD} y={y(payMax, payMax) - 4} className="fill-slate-400" fontSize={10}>{compact.format(payMax)}</text>
          <path d={payLine} fill="none" stroke="#1d4ed8" strokeWidth={2} />
          {yearTicks().map((m) => (
            <text key={m} x={x(m)} y={H - 14} textAnchor="middle" className="fill-slate-400" fontSize={10}>
              {Math.round(m / 12)}{t("yearsShort")}
            </text>
          ))}
        </svg>
      </Panel>

      <Panel title={t("cumulative")}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={t("cumulative")}>
          <line x1={PAD} y1={baseY} x2={W - PAD} y2={baseY} stroke="#cbd5e1" strokeWidth={1} />
          <polygon points={interestArea} fill="#f59e0b" opacity={0.55} />
          <polygon points={principalArea} fill="#1d4ed8" opacity={0.55} />
          <text x={PAD} y={y(totMax, totMax) - 4} className="fill-slate-400" fontSize={10}>{compact.format(totMax)}</text>
          {yearTicks().map((m) => (
            <text key={m} x={x(m)} y={H - 14} textAnchor="middle" className="fill-slate-400" fontSize={10}>
              {Math.round(m / 12)}{t("yearsShort")}
            </text>
          ))}
        </svg>
        <div className="flex justify-center gap-4 text-xs text-slate-600">
          <Legend color="#1d4ed8" label={t("principal")} />
          <Legend color="#f59e0b" label={t("interest")} />
        </div>
      </Panel>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-1 text-xs font-semibold text-slate-700">{title}</h4>
      {children}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
