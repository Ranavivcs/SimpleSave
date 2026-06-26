import { cookies } from "next/headers";
import { getProfile } from "@/lib/auth/session";
import { SAMPLE_ADVISOR_NAME } from "./sampleClients";

export interface AdvisorContext {
  /** Display name for the greeting. */
  name: string;
  /** True when entered via the dev preview bypass (no real ADVISOR account). */
  isPreview: boolean;
}

/**
 * Resolves the current advisor, or null if the visitor may not enter.
 * Access = a real ADVISOR profile, or (dev only) the preview cookie. The layout
 * uses this to gate; the page reuses it for the greeting.
 */
export async function getAdvisorContext(): Promise<AdvisorContext | null> {
  const profile = await getProfile();
  if (profile?.role === "ADVISOR") {
    return { name: profile.email, isPreview: false };
  }
  const previewing =
    process.env.NODE_ENV !== "production" &&
    (await cookies()).get("advisor-preview")?.value === "1";
  if (previewing) return { name: SAMPLE_ADVISOR_NAME, isPreview: true };
  return null;
}
