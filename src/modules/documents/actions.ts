"use server";

/**
 * Server action for the post-flow documents screen: loads the seeded
 * `DocumentRequirement` config (same source as the personal-area מסמכים tab)
 * filtered by request type, returning a light serializable list.
 */

import { prisma } from "@/lib/db";
import { applicable } from "./applicable";

export interface RequirementItem {
  id: string;
  name: string;
  condition: string | null;
  requiredToProceed: boolean;
}

export async function getDocumentRequirements(type: string): Promise<RequirementItem[]> {
  const all = await prisma.documentRequirement.findMany({ orderBy: { order: "asc" } });
  return all
    .filter((r) => applicable(r.appliesTo, type))
    .map(({ id, name, condition, requiredToProceed }) => ({ id, name, condition, requiredToProceed }));
}
