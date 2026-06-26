import "server-only";

import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import type { ClientMessage } from "@/modules/advisor/types";

export interface CustomerAdvisorThread {
  clientId: string;
  advisorName: string;
  clientName: string;
  requestType: string;
  messages: ClientMessage[];
}

function toMessages(
  messages: { id: string; sender: "ADVISOR" | "CUSTOMER"; text: string; sentAt: Date }[],
): ClientMessage[] {
  return messages.map((m) => ({
    id: m.id,
    from: m.sender === "ADVISOR" ? "advisor" : "customer",
    text: m.text,
    at: m.sentAt.toISOString(),
  }));
}

/**
 * POC bridge: resolve the customer-facing advisor thread from the Phase 6
 * AdvisorClient tables. Signed-in users match by email; local/dev previews fall
 * back to the seeded demo client for the request type.
 */
export async function getCustomerAdvisorThread(
  requestType: string,
): Promise<CustomerAdvisorThread | null> {
  const user = await getSessionUser();

  const exact = user?.email
    ? await prisma.advisorClient.findFirst({
        where: { email: user.email, requestType },
        include: { messages: { orderBy: { sentAt: "asc" } } },
      })
    : null;

  const canUseDemoThread =
    !exact && process.env.NODE_ENV !== "production" && ((await cookies()).get("guest") || !user);

  const client =
    exact ??
    (canUseDemoThread
      ? await prisma.advisorClient.findFirst({
          where: { requestType },
          orderBy: { createdAt: "asc" },
          include: { messages: { orderBy: { sentAt: "asc" } } },
        })
      : null);

  if (!client) return null;

  return {
    clientId: client.id,
    advisorName: client.advisorName,
    clientName: client.name,
    requestType: client.requestType,
    messages: toMessages(client.messages),
  };
}

/** Authorization helper for customer-side message mutations. */
export async function canUseCustomerAdvisorThread(clientId: string, requestType: string): Promise<boolean> {
  const user = await getSessionUser();

  const client = await prisma.advisorClient.findUnique({
    where: { id: clientId },
    select: { email: true, requestType: true },
  });
  if (!client || client.requestType !== requestType) return false;

  if (user?.email && client.email === user.email) return true;

  const isGuest = (await cookies()).get("guest")?.value === "1";
  return process.env.NODE_ENV !== "production" && isGuest;
}
