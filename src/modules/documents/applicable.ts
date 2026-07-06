/**
 * Shared filter: does a `DocumentRequirement.appliesTo` value apply to a
 * request type? Used by both the personal-area list (server component) and the
 * post-flow upload screen (via server action).
 */
export function applicable(appliesTo: string | null, type: string): boolean {
  if (!appliesTo || appliesTo === "all") return true;
  if (type === "refinance") return appliesTo !== "new";
  if (type === "new-mortgage") return appliesTo !== "refinance";
  return false; // insurance: only generic docs
}
