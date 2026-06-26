"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";

/**
 * Assign (or re-assign) a lead/client to an advisor. Builds on the Phase 6
 * `AdvisorClient` model, which links by `advisorName` (POC, no Profile FK yet).
 * Empty value = unassigned.
 */
export async function assignAdvisor(clientId: string, formData: FormData) {
  await requireAdmin();
  const advisorName = String(formData.get("advisorName") ?? "").trim();
  await prisma.advisorClient.update({
    where: { id: clientId },
    data: { advisorName },
  });
  revalidatePath("/admin/leads");
  revalidatePath("/admin/advisors");
}
