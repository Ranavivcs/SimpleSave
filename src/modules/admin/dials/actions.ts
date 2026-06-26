"use server";

import { revalidatePath } from "next/cache";
import type { IndexType, RouteKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { int, num, optInt, optPct, optStr } from "@/modules/admin/format";

/** Revalidate the list + the specific template editor (key from a hidden field). */
function revalidateDial(key: FormDataEntryValue | null) {
  revalidatePath("/admin/dials");
  if (key) revalidatePath(`/admin/dials/${key}`);
}

export async function updateTemplate(id: string, formData: FormData) {
  await requireAdmin();
  await prisma.dialTemplate.update({
    where: { id },
    data: {
      name: String(formData.get("name")),
      order: int(formData.get("order")),
      shortenFixed: formData.has("shortenFixed"),
      linkedFixedFirst: formData.has("linkedFixedFirst"),
    },
  });
  revalidateDial(formData.get("key"));
}

function parseTrack(formData: FormData) {
  return {
    order: int(formData.get("order")),
    kind: String(formData.get("kind")) as RouteKind,
    sharePct: num(formData.get("sharePct")),
    indexType: String(formData.get("indexType")) as IndexType,
    changeMonths: optInt(formData.get("changeMonths")),
    yearStep: optInt(formData.get("yearStep")),
    anchorType: optStr(formData.get("anchorType")),
    anchor: optPct(formData.get("anchor")),
    margin: optPct(formData.get("margin")),
  };
}

export async function createTrack(templateId: string, formData: FormData) {
  await requireAdmin();
  await prisma.dialTrack.create({
    data: { templateId, ...parseTrack(formData) },
  });
  revalidateDial(formData.get("key"));
}

export async function updateTrack(id: string, formData: FormData) {
  await requireAdmin();
  await prisma.dialTrack.update({ where: { id }, data: parseTrack(formData) });
  revalidateDial(formData.get("key"));
}

export async function deleteTrack(id: string, formData: FormData) {
  await requireAdmin();
  await prisma.dialTrack.delete({ where: { id } });
  revalidateDial(formData.get("key"));
}
