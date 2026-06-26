"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { fromPct, int } from "@/modules/admin/format";

/**
 * Update the single active GlobalParameters row (creating it if the seed never
 * ran). Re-checks the admin role — Server Actions are reachable by direct POST,
 * not only through the guarded UI.
 */
export async function updateParameters(formData: FormData) {
  await requireAdmin();

  const data = {
    expectedIndexAnnual: fromPct(formData.get("expectedIndexAnnual")),
    expectedDollarAnnual: fromPct(formData.get("expectedDollarAnnual")),
    expectedEuroAnnual: fromPct(formData.get("expectedEuroAnnual")),
    primeRate: fromPct(formData.get("primeRate")),
    maxRepaymentPct: fromPct(formData.get("maxRepaymentPct")),
    loanTermMaxAge: int(formData.get("loanTermMaxAge")),
    creditLookbackYrs: int(formData.get("creditLookbackYrs")),
  };

  const existing = await prisma.globalParameters.findFirst({
    where: { isActive: true },
  });

  if (existing) {
    await prisma.globalParameters.update({ where: { id: existing.id }, data });
  } else {
    await prisma.globalParameters.create({ data: { ...data, isActive: true } });
  }

  revalidatePath("/admin/parameters");
}
