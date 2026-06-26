"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
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
