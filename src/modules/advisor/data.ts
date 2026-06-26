import "server-only";
import { prisma } from "@/lib/db";
import type {
  AdvisorClient,
  ClientDocument,
  ClientMessage,
  ClientProcessStatus,
  ClientStage,
  DocStatus,
} from "./types";

/* DB enum → app key maps (DB uses upper-case enums for clean queries). */
const STATUS: Record<string, ClientProcessStatus> = {
  BEFORE: "before",
  IN: "in",
  AFTER: "after",
};
const STAGE: Record<string, ClientStage> = {
  PERSONAL: "personal",
  MORTGAGE: "mortgage",
  APPROVAL: "approval",
  COLLATERAL: "collateral",
  DONE: "done",
};
const DOC: Record<string, DocStatus> = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  REQUESTED: "requested",
};

function isoDate(d: Date | null): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

/**
 * The advisor's clients, shaped to the app `AdvisorClient` type the UI already
 * consumes. Unread = customer messages not yet read by the advisor.
 *
 * POC: returns all seeded clients (no advisorId filter yet — there is no FK to
 * Profile). A later phase filters by the signed-in advisor's real id.
 */
export async function getAdvisorClients(): Promise<AdvisorClient[]> {
  const rows = await prisma.advisorClient.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      documents: { orderBy: { order: "asc" } },
      messages: { orderBy: { sentAt: "asc" } },
    },
  });

  return rows.map((r): AdvisorClient => {
    const documents: ClientDocument[] = r.documents.map((d) => ({
      id: d.id,
      nameKey: d.nameKey,
      status: DOC[d.status],
      note: d.note ?? undefined,
    }));
    const messages: ClientMessage[] = r.messages.map((m) => ({
      id: m.id,
      from: m.sender === "ADVISOR" ? "advisor" : "customer",
      text: m.text,
      at: m.sentAt.toISOString(),
    }));
    const unreadMessages = r.messages.filter((m) => m.sender === "CUSTOMER" && !m.read).length;

    return {
      id: r.id,
      name: r.name,
      email: r.email,
      advisorName: r.advisorName,
      status: STATUS[r.status],
      stage: STAGE[r.stage],
      approvedBanks: r.approvedBanks,
      nextTreatment: isoDate(r.nextTreatment),
      unreadMessages,
      notes: r.notes,
      request: {
        type: r.requestType,
        propertyValue: r.propertyValue,
        equity: r.equity,
        loanAmount: r.loanAmount,
      },
      documents,
      messages,
    };
  });
}
