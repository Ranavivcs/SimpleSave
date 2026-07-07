"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { canUseCustomerAdvisorThread } from "./advisorThread";

/** Enter the personal area as a guest (no account). Remembered via a cookie. */
export async function continueAsGuest() {
  (await cookies()).set("guest", "1", {
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day
    sameSite: "lax",
  });
  redirect("/account");
}

/** Customer sends a message into the shared advisor-client thread. */
export async function sendCustomerAdvisorMessageAction(
  clientId: string,
  requestType: string,
  text: string,
) {
  const trimmed = text.trim();
  if (!trimmed) return;

  const allowed = await canUseCustomerAdvisorThread(clientId, requestType);
  if (!allowed) throw new Error("Unauthorized");

  await prisma.advisorClientMessage.create({
    data: { clientId, sender: "CUSTOMER", text: trimmed, read: false },
  });

  revalidatePath(`/account/${requestType}`);
  revalidatePath("/advisor");
}

export interface PendingRequestSummary {
  type: string;
  propertyValue: number;
  equity: number;
  loanAmount: number;
  dialName?: string;
}

/**
 * Claim the questionnaire summary a guest stashed in the browser before
 * registering: fills the customer's AdvisorClient with the real numbers (and
 * the chosen dial as a note) so the advisor sees actual data, not zeros.
 * Returns false when not signed in — the stash stays for after login.
 */
export async function claimPendingRequestAction(s: PendingRequestSummary): Promise<boolean> {
  const user = await getSessionUser();
  if (!user?.email) return false;

  const propertyValue = Math.max(0, Math.round(Number(s.propertyValue) || 0));
  const equity = Math.max(0, Math.round(Number(s.equity) || 0));
  const loanAmount = Math.max(0, Math.round(Number(s.loanAmount) || 0));
  if (propertyValue === 0 && loanAmount === 0) return false;

  const client = await prisma.advisorClient.findFirst({
    where: { email: user.email, requestType: s.type },
  });
  if (!client) return false;

  const dialName = typeof s.dialName === "string" ? s.dialName.slice(0, 40).trim() : "";
  await prisma.advisorClient.update({
    where: { id: client.id },
    data: {
      propertyValue,
      equity,
      loanAmount,
      ...(dialName ? { notes: `תמהיל נבחר: ${dialName}` } : {}),
    },
  });

  revalidatePath(`/account/${s.type}`);
  revalidatePath("/advisor");
  return true;
}
