/**
 * Option lists for the admin config editors. Enum values mirror the Prisma
 * schema; `ROUTE_KEYS` mirrors the engine's track keys (see schema RateBand).
 */

export const ROUTE_KEYS = [
  "fixedUnlinked",
  "fixedLinked",
  "variable36Unlinked",
  "variable36Linked",
  "variable60Linked",
  "variable60Unlinked",
  "variable18_24Linked",
  "variable18_24Unlinked",
  "prime",
] as const;

export const LOAN_PURPOSES = ["HOUSING", "ALL_PURPOSE"] as const;

export const ROUTE_KINDS = ["FIXED", "VARIABLE", "PRIME"] as const;

export const RISK_ROUTE_KINDS = ["FIXED", "VARIABLE", "PRIME", "ALL"] as const;

export const INDEX_TYPES = ["NONE", "CPI", "USD", "EUR"] as const;

export const RISK_INDEXED = ["YES", "NO", "ANY"] as const;

/** Exit-penalty levels (free string in the schema; fixed domain in practice). */
export const EXIT_PENALTIES = ["נמוך", "בינוני", "גבוה"] as const;
