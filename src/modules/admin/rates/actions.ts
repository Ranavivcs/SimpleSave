"use server";

import { revalidatePath } from "next/cache";
import type { LoanPurpose } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { fromPct, num } from "@/modules/admin/format";

function parseBand(formData: FormData) {
  return {
    purpose: String(formData.get("purpose")) as LoanPurpose,
    routeKey: String(formData.get("routeKey")),
    fromYears: num(formData.get("fromYears")),
    toYears: num(formData.get("toYears")),
    anchor: fromPct(formData.get("anchor")),
    margin: fromPct(formData.get("margin")),
  };
}

export async function createRateBand(formData: FormData) {
  await requireAdmin();
  await prisma.rateBand.create({ data: parseBand(formData) });
  revalidatePath("/admin/rates");
}

export async function updateRateBand(id: string, formData: FormData) {
  await requireAdmin();
  await prisma.rateBand.update({ where: { id }, data: parseBand(formData) });
  revalidatePath("/admin/rates");
}

export async function deleteRateBand(id: string) {
  await requireAdmin();
  await prisma.rateBand.delete({ where: { id } });
  revalidatePath("/admin/rates");
}
