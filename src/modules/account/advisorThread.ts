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
 * AdvisorClient tables. Signed-in users match by email — created on first
 * visit so every registered customer gets an advisor (and shows up in the
 * advisor's client table). Local/dev guest previews fall back to the seeded
 * demo client for the request type.
 */
export async function getCustomerAdvisorThread(
  requestType: string,
): Promise<CustomerAdvisorThread | null> {
  const user = await getSessionUser();

  let exact = user?.email
    ? await prisma.advisorClient.findFirst({
        where: { email: user.email, requestType },
        include: { messages: { orderBy: { sentAt: "asc" } } },
      })
    : null;

  if (!exact && user?.email) {
    // First visit for this request — enroll the customer under an advisor.
    const advisor = await prisma.profile.findFirst({ where: { role: "ADVISOR" } });
    const fallbackName = await prisma.advisorClient.findFirst({ select: { advisorName: true } });
    exact = await prisma.advisorClient.create({
      data: {
        name: user.email.split("@")[0],
        email: user.email,
        advisorName: advisor?.fullName ?? fallbackName?.advisorName ?? "יועץ SimpleSave",
        requestType,
        propertyValue: 0,
        equity: 0,
        loanAmount: 0,
      },
      include: { messages: true },
    });
  }

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
