"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import type { DocStatus } from "./types";

/**
 * Dev-only preview of the advisor area (no ADVISOR account required), mirroring
 * the personal area's guest bypass. Disabled in production — there the real
 * role guard (requireAdvisor) applies.
 */
export async function previewAsAdvisor() {
  if (process.env.NODE_ENV === "production") redirect("/login?redirect=/advisor");
  (await cookies()).set("advisor-preview", "1", {
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day
    sameSite: "lax",
  });
  redirect("/advisor");
}

/* app key → DB enum */
const DOC_DB: Record<DocStatus, "PENDING" | "APPROVED" | "REJECTED" | "REQUESTED"> = {
  pending: "PENDING",
  approved: "APPROVED",
  rejected: "REJECTED",
  requested: "REQUESTED",
};

/** Set an uploaded document's review status (advisor approve / reject / request). */
export async function setDocStatusAction(docId: string, status: DocStatus, note?: string) {
  await prisma.advisorClientDocument.update({
    where: { id: docId },
    data: { status: DOC_DB[status], note: status === "rejected" ? (note ?? null) : null },
  });
  revalidatePath("/advisor");
}

/** Advisor sends a message to a client (stored read — it's the advisor's own). */
export async function sendMessageAction(clientId: string, text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;
  const client = await prisma.advisorClient.findUnique({
    where: { id: clientId },
    select: { requestType: true },
  });
  await prisma.advisorClientMessage.create({
    data: { clientId, sender: "ADVISOR", text: trimmed, read: true },
  });
  revalidatePath("/advisor");
  if (client) revalidatePath(`/account/${client.requestType}`);
}

/** Mark a client's incoming (customer) messages as read — clears the 💬 badge. */
export async function markClientReadAction(clientId: string) {
  await prisma.advisorClientMessage.updateMany({
    where: { clientId, sender: "CUSTOMER", read: false },
    data: { read: true },
  });
  revalidatePath("/advisor");
}
