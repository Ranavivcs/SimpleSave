"use server";

/**
 * Server action for the dials screen: loads the seeded config (DB) and resolves
 * the 5 dials for the given loan amount + desired-payment range, returning the
 * light card view-models. Runs on the server because `loadDialsConfig` uses
 * Prisma; the resolver itself is pure.
 */

import { loadDialsConfig } from "@/lib/dials/loadConfig";
import { resolveDials, type ResolveDialsInput } from "@/lib/dials";
import { toDialCards, type DialCardData } from "./dialView";

export async function getDials(input: ResolveDialsInput): Promise<DialCardData[]> {
  const config = await loadDialsConfig();
  return toDialCards(resolveDials(config, input));
}
