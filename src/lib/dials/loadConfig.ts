/**
 * DB loader for the dial resolver — reads the seeded config (Phase 2B) via
 * Prisma and maps it onto the resolver's plain DTOs. This is the ONLY file in
 * the module that touches the database; the resolver itself stays pure.
 */

import { prisma } from "../db";
import type {
  DbIndexType,
  DbPurpose,
  DbRiskIndexed,
  DbRiskRouteKind,
  DbRouteKind,
  DialsConfig,
} from "./contracts";

export async function loadDialsConfig(): Promise<DialsConfig> {
  const [globals, templates, rateBands, riskRules] = await Promise.all([
    prisma.globalParameters.findFirst({ where: { isActive: true } }),
    prisma.dialTemplate.findMany({
      orderBy: { order: "asc" },
      include: { tracks: { orderBy: { order: "asc" } } },
    }),
    prisma.rateBand.findMany(),
    prisma.riskRule.findMany({ orderBy: { order: "asc" } }),
  ]);

  if (!globals) throw new Error("No active GlobalParameters row — run the config seed.");

  return {
    globals: {
      expectedIndexAnnual: globals.expectedIndexAnnual,
      expectedDollarAnnual: globals.expectedDollarAnnual,
      expectedEuroAnnual: globals.expectedEuroAnnual,
    },
    templates: templates.map((t) => ({
      key: t.key,
      name: t.name,
      order: t.order,
      shortenFixed: t.shortenFixed,
      linkedFixedFirst: t.linkedFixedFirst,
      tracks: t.tracks.map((tr) => ({
        kind: tr.kind as DbRouteKind,
        sharePct: tr.sharePct,
        indexType: tr.indexType as DbIndexType,
        changeMonths: tr.changeMonths,
        yearStep: tr.yearStep,
        anchor: tr.anchor,
        margin: tr.margin,
      })),
    })),
    rateBands: rateBands.map((b) => ({
      purpose: b.purpose as DbPurpose,
      routeKey: b.routeKey,
      fromYears: b.fromYears,
      toYears: b.toYears,
      anchor: b.anchor,
      margin: b.margin,
    })),
    riskRules: riskRules.map((r) => ({
      routeKind: r.routeKind as DbRiskRouteKind,
      fromMonths: r.fromMonths,
      toMonths: r.toMonths,
      indexed: r.indexed as DbRiskIndexed,
      exitPenalty: r.exitPenalty,
      risk: r.risk,
    })),
  };
}
