"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { fromPct } from "@/modules/admin/format";

/**
 * Monthly maintenance shortcut (spec: "ongoing mortgage management") — updates
 * the expected index + prime on the active GlobalParameters row. Variable-rate
 * anchors live per rate band and are edited on the Market Rates tab.
 */
export async function updateRoutine(formData: FormData) {
  await requireAdmin();
  const existing = await prisma.globalParameters.findFirst({
    where: { isActive: true },
  });
  if (!existing) return;
  await prisma.globalParameters.update({
    where: { id: existing.id },
    data: {
      expectedIndexAnnual: fromPct(formData.get("expectedIndexAnnual")),
      primeRate: fromPct(formData.get("primeRate")),
    },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/parameters");
}
