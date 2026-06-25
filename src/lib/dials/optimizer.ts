/**
 * Term optimizer — pure port of the simulator's `calculateMixToRange`.
 *
 * Fits each track's term so the mix's first payment lands inside [minPay,maxPay]
 * (targeting the midpoint): a coarse sweep, local refinement, then shortening of
 * fixed tracks to the max within budget. Mutates each item's `track.years`.
 */

import { calcMix, type MixParams, type MortgageTrack } from "../calc";
import type { DialTrackConfig } from "./contracts";
import { allowedYears, candidateYears } from "./rates";

/** Pairs a track's config (for allowed terms) with its engine track. */
export interface OptItem {
  cfg: DialTrackConfig;
  track: MortgageTrack;
}

interface Best {
  years: number[];
  inRange: boolean;
  distance: number;
}

export function optimizeYears(
  items: OptItem[],
  params: MixParams,
  minPay: number,
  maxPay: number,
  opts: { shortenFixed: boolean; linkedFixedFirst: boolean },
): void {
  const tracks = items.map((i) => i.track);
  const target = (minPay + maxPay) / 2;
  const applyYears = (years: number[]) => years.forEach((y, i) => (tracks[i].years = y));

  const score = (firstPay: number) => {
    const inRange = firstPay >= minPay && firstPay <= maxPay;
    const distance = inRange
      ? Math.abs(firstPay - target)
      : Math.min(Math.abs(firstPay - minPay), Math.abs(firstPay - maxPay));
    return { inRange, distance };
  };
  const better = (s: { inRange: boolean; distance: number }, b: Best) =>
    Number(s.inRange) > Number(b.inRange) ||
    (s.inRange === b.inRange && s.distance < b.distance);

  // Coarse sweep across the joint term space.
  let best: Best | null = null;
  for (let step = 0; step <= 240; step++) {
    const frac = step / 240;
    items.forEach((it) => (it.track.years = candidateYears(it.cfg, frac)));
    const s = score(calcMix(tracks, params).firstPay);
    if (!best || better(s, best)) best = { years: tracks.map((r) => r.years), ...s };
  }
  applyYears(best!.years);

  // Per-track local refinement.
  for (let round = 0; round < 3; round++) {
    items.forEach((it) => {
      let local = best!;
      for (const years of allowedYears(it.cfg)) {
        it.track.years = years;
        const s = score(calcMix(tracks, params).firstPay);
        if (better(s, local)) local = { years: tracks.map((r) => r.years), ...s };
      }
      best = local;
      applyYears(best.years);
    });
  }
  applyYears(best!.years);

  if (opts.shortenFixed) shortenFixed(items, params, maxPay, opts.linkedFixedFirst);
}

/** Shorten fixed tracks to the shortest term that still keeps firstPay ≤ maxPay. */
function shortenFixed(
  items: OptItem[],
  params: MixParams,
  maxPay: number,
  linkedFixedFirst: boolean,
): void {
  const tracks = items.map((i) => i.track);
  const fixed = items
    .filter((it) => it.track.kind === "fixed" && it.track.amount > 0)
    .sort((a, b) => {
      const d = Number(b.track.indexType === "מדד") - Number(a.track.indexType === "מדד");
      return linkedFixedFirst === false ? -d : d;
    });

  for (const it of fixed) {
    const original = it.track.years;
    const candidates = allowedYears(it.cfg).filter((y) => y < original).sort((a, b) => a - b);
    let selected = original;
    for (const y of candidates) {
      it.track.years = y;
      if (calcMix(tracks, params).firstPay <= maxPay + 0.01) {
        selected = y;
        break;
      }
    }
    it.track.years = selected;
  }
}
