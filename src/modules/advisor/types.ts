/**
 * Advisor-area domain types. The advisor sees the clients under their
 * responsibility, sorted by next-treatment-date then by unread client messages.
 *
 * Status (סטטוס לקוח): before / in / after the mortgage process.
 * Stage (שלב): how far the client got in the request flow (mirrors the
 * customer's tab sequence). Both are i18n keys — no user-facing text here.
 */
export type ClientProcessStatus = "before" | "in" | "after";

/** Stage keys mirror the customer request tabs (see AccountTabs). */
export type ClientStage =
  | "personal"
  | "mortgage"
  | "approval"
  | "collateral"
  | "done";

export interface ClientRequestSummary {
  /** Request type key: new-mortgage | refinance | insurance. */
  type: string;
  propertyValue: number;
  equity: number;
  loanAmount: number;
}

/** Advisor review state for an uploaded document. */
export type DocStatus = "pending" | "approved" | "rejected" | "requested";

export interface ClientDocument {
  id: string;
  /** Document-name key, resolved via i18n advisor.docNames.*. */
  nameKey: string;
  /** Plain display name (customer uploads carry the requirement name). Wins over nameKey. */
  name?: string;
  status: DocStatus;
  /** Optional advisor note (e.g. why rejected / what's missing). */
  note?: string;
  /** Uploaded file (Supabase Storage), when the customer attached one. */
  fileName?: string;
  /** Short-lived signed URL for viewing the uploaded file. */
  fileUrl?: string;
  /** ISO timestamp of the upload. */
  uploadedAt?: string;
}

export interface ClientMessage {
  id: string;
  from: "advisor" | "customer";
  text: string;
  /** ISO timestamp. */
  at: string;
}

export interface AdvisorClient {
  id: string;
  name: string;
  email: string;
  /** Owning advisor's display name (kept so the admin mirror can reuse this view). */
  advisorName: string;
  status: ClientProcessStatus;
  stage: ClientStage;
  /** Bank id keys that approved (chips). Labels resolve via i18n advisor.banks.*. */
  approvedBanks: string[];
  /** ISO date (yyyy-mm-dd) of the next treatment, or null if none scheduled. */
  nextTreatment: string | null;
  /** Unread messages from the client (drives secondary sort). */
  unreadMessages: number;
  notes: string;
  request: ClientRequestSummary;
  documents: ClientDocument[];
  messages: ClientMessage[];
}

/** All process statuses in display order (used for counters + filter chips). */
export const CLIENT_STATUSES: ClientProcessStatus[] = ["before", "in", "after"];

/**
 * Sort for the "my clients" table: nearest next-treatment-date first
 * (unscheduled clients last), tie-broken by most unread messages.
 */
export function sortClients(clients: AdvisorClient[]): AdvisorClient[] {
  return [...clients].sort((a, b) => {
    const da = a.nextTreatment ? Date.parse(a.nextTreatment) : Infinity;
    const db = b.nextTreatment ? Date.parse(b.nextTreatment) : Infinity;
    if (da !== db) return da - db;
    return b.unreadMessages - a.unreadMessages;
  });
}

/** Count clients per status (for the counter row). `all` is the total. */
export function statusCounts(
  clients: AdvisorClient[],
): Record<ClientProcessStatus | "all", number> {
  const counts = { all: clients.length, before: 0, in: 0, after: 0 };
  for (const c of clients) counts[c.status] += 1;
  return counts;
}
