"use server";

/**
 * Server actions for customer documents: the requirement list (post-flow screen
 * + personal-area מסמכים tab) and the real upload to Supabase Storage. Uploads
 * land on the customer's AdvisorClient record so the advisor's doc review sees
 * the actual file.
 */

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { createAdminClient, DOCUMENTS_BUCKET } from "@/lib/supabase/admin";
import { canUseCustomerAdvisorThread } from "@/modules/account/advisorThread";
import { applicable } from "./applicable";

export interface RequirementItem {
  id: string;
  name: string;
  condition: string | null;
  requiredToProceed: boolean;
}

export async function getDocumentRequirements(type: string): Promise<RequirementItem[]> {
  const all = await prisma.documentRequirement.findMany({ orderBy: { order: "asc" } });
  return all
    .filter((r) => applicable(r.appliesTo, type))
    .map(({ id, name, condition, requiredToProceed }) => ({ id, name, condition, requiredToProceed }));
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export type UploadResult = { ok: true } | { ok: false; errorKey: "file" | "auth" | "upload" };

/**
 * Upload one document file for a requirement. Stores the file in the private
 * `documents` bucket and upserts the client's review row (status back to
 * PENDING on re-upload so the advisor re-checks).
 */
export async function uploadDocumentAction(formData: FormData): Promise<UploadResult> {
  const clientId = String(formData.get("clientId") ?? "");
  const requirementId = String(formData.get("requirementId") ?? "");
  const type = String(formData.get("type") ?? "");
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0 || file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, errorKey: "file" };
  }
  if (!clientId || !requirementId || !(await canUseCustomerAdvisorThread(clientId, type))) {
    return { ok: false, errorKey: "auth" };
  }
  const requirement = await prisma.documentRequirement.findUnique({ where: { id: requirementId } });
  if (!requirement) return { ok: false, errorKey: "auth" };

  // Storage object keys are ASCII-safe; the original (Hebrew) name lives in the DB.
  const safeName = file.name.replace(/[^\w.-]+/g, "_").slice(-80) || "file";
  const path = `${clientId}/${requirementId}/${Date.now()}-${safeName}`;

  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, file, { contentType: file.type || "application/octet-stream" });
  if (error) {
    console.error("[uploadDocument]", error.message);
    return { ok: false, errorKey: "upload" };
  }

  const existing = await prisma.advisorClientDocument.findFirst({
    where: { clientId, requirementId },
  });
  const data = {
    name: requirement.name,
    fileName: file.name,
    filePath: path,
    uploadedAt: new Date(),
    status: "PENDING" as const,
    note: null,
  };
  if (existing) {
    await prisma.advisorClientDocument.update({ where: { id: existing.id }, data });
    if (existing.filePath) {
      // best-effort cleanup of the replaced file
      void supabase.storage.from(DOCUMENTS_BUCKET).remove([existing.filePath]);
    }
  } else {
    await prisma.advisorClientDocument.create({
      data: { ...data, clientId, requirementId, nameKey: "custom", order: 1000 },
    });
  }

  revalidatePath(`/account/${type}`);
  revalidatePath("/advisor");
  return { ok: true };
}

/** Uploaded docs for a client, keyed by requirement — drives the customer's מסמכים tab. */
export async function getUploadedDocuments(clientId: string, type: string) {
  if (!(await canUseCustomerAdvisorThread(clientId, type))) return {};
  const rows = await prisma.advisorClientDocument.findMany({
    where: { clientId, requirementId: { not: null } },
  });
  return Object.fromEntries(
    rows.map((r) => [
      r.requirementId as string,
      { fileName: r.fileName, status: r.status.toLowerCase(), note: r.note },
    ]),
  );
}
