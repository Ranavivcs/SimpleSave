"use server";

import { revalidatePath } from "next/cache";
import type { RiskIndexed, RiskRouteKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { int } from "@/modules/admin/format";

function parseRule(formData: FormData) {
  return {
    routeKind: String(formData.get("routeKind")) as RiskRouteKind,
    fromMonths: int(formData.get("fromMonths")),
    toMonths: int(formData.get("toMonths")),
    indexed: String(formData.get("indexed")) as RiskIndexed,
    exitPenalty: String(formData.get("exitPenalty")),
    risk: int(formData.get("risk")),
    order: int(formData.get("order")),
  };
}

export async function createRiskRule(formData: FormData) {
  await requireAdmin();
  await prisma.riskRule.create({ data: parseRule(formData) });
  revalidatePath("/admin/risk");
}

export async function updateRiskRule(id: string, formData: FormData) {
  await requireAdmin();
  await prisma.riskRule.update({ where: { id }, data: parseRule(formData) });
  revalidatePath("/admin/risk");
}

export async function deleteRiskRule(id: string) {
  await requireAdmin();
  await prisma.riskRule.delete({ where: { id } });
  revalidatePath("/admin/risk");
}
