"use client";

/**
 * Risk speedometer — a custom SVG semicircular gauge (no chart dependency).
 * 5 colored segments (green → red, left→right over the top), a needle at the
 * risk level, the Hebrew risk label below, and an optional "קבל פירוט" link.
 */

import Link from "next/link";

const SEGMENT_COLORS = ["#16a34a", "#65a30d", "#eab308", "#f97316", "#ef4444"];

const CX = 100;
const CY = 100;
const R = 74; // arc centerline radius
const SEG = 36; // 180° / 5 segments

function polar(deg: number, rad: number) {
  const a = (deg * Math.PI) / 180;
  return { x: CX + rad * Math.cos(a), y: CY - rad * Math.sin(a) };
}

export function Speedometer({
  level,
  label,
  detailsHref,
  detailsLabel,
}: {
  level: number;
  label: string;
  detailsHref?: string;
  detailsLabel?: string;
}) {
  const active = Math.min(5, Math.max(1, Math.round(level)));
  const color = SEGMENT_COLORS[active - 1];

  // Each segment runs from a higher angle to a lower one, over the top → sweep-flag 1.
  const segments = Array.from({ length: 5 }, (_, i) => {
    const p1 = polar(180 - i * SEG, R);
    const p2 = polar(180 - (i + 1) * SEG, R);
    return {
      d: `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${R} ${R} 0 0 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
      color: SEGMENT_COLORS[i],
      on: i === active - 1,
    };
  });

  const tip = polar(180 - (active - 0.5) * SEG, R - 16);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 116" className="w-44" role="img" aria-label={label}>
        {segments.map((s, i) => (
          <path key={i} d={s.d} stroke={s.color} strokeWidth={15} fill="none" strokeLinecap="butt" opacity={s.on ? 1 : 0.25} />
        ))}
        <line x1={CX} y1={CY} x2={tip.x.toFixed(2)} y2={tip.y.toFixed(2)} stroke="#0f172a" strokeWidth={3.5} strokeLinecap="round" />
        <circle cx={CX} cy={CY} r={6} fill="#0f172a" />
      </svg>
      <span className="mt-1 text-sm font-bold" style={{ color }}>
        {label}
      </span>
      {detailsHref && detailsLabel && (
        <Link href={detailsHref} className="mt-1 text-xs font-medium text-brand-700 hover:underline">
          {detailsLabel}
        </Link>
      )}
    </div>
  );
}
