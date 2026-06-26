import { prisma } from "@/lib/db";

/**
 * Distinct advisor display names — the union of advisors already owning clients
 * (`AdvisorClient.advisorName`, the Phase 6 model) and `Profile`s with the
 * ADVISOR role. Used by the admin Leads (assign) + Advisors (overview) tabs.
 */
export async function listAdvisors(): Promise<string[]> {
  const [clients, profiles] = await Promise.all([
    prisma.advisorClient.findMany({
      select: { advisorName: true },
      distinct: ["advisorName"],
    }),
    prisma.profile.findMany({
      where: { role: "ADVISOR" },
      select: { fullName: true, email: true },
    }),
  ]);

  const names = new Set<string>();
  for (const c of clients) if (c.advisorName.trim()) names.add(c.advisorName.trim());
  for (const p of profiles) names.add((p.fullName ?? p.email).trim());

  return [...names].sort((a, b) => a.localeCompare(b, "he"));
}
