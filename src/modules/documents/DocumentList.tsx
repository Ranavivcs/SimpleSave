import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { applicable } from "./applicable";
import { UploadRow } from "./UploadRow";

/**
 * Dynamic required-document list for a request, read from the seeded
 * `DocumentRequirement` config (Phase 2B). Filtered by request type. When the
 * request is bridged to an AdvisorClient (`clientId`), each row gets a real
 * Supabase Storage upload + the advisor's review status; otherwise it stays a
 * read-only checklist.
 */

const STATUS_PILL: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-600",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  REQUESTED: "bg-amber-100 text-amber-700",
};

export async function DocumentList({ type, clientId }: { type: string; clientId?: string | null }) {
  const t = await getTranslations("documents");
  const all = await prisma.documentRequirement.findMany({ orderBy: { order: "asc" } });
  const reqs = all.filter((r) => applicable(r.appliesTo, type));

  const uploads = clientId
    ? await prisma.advisorClientDocument.findMany({
        where: { clientId, requirementId: { not: null } },
      })
    : [];
  const byRequirement = new Map(uploads.map((u) => [u.requirementId as string, u]));

  if (reqs.length === 0) return <p className="text-sm text-muted">{t("empty")}</p>;

  return (
    <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {reqs.map((r) => {
        const up = byRequirement.get(r.id);
        return (
          <li key={r.id} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-slate-900">{r.name}</span>
                {r.requiredToProceed && (
                  <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                    {t("required")}
                  </span>
                )}
                {up && (
                  <span
                    className={
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold " + STATUS_PILL[up.status]
                    }
                  >
                    {t(`status.${up.status.toLowerCase()}`)}
                  </span>
                )}
              </div>
              {r.condition && <p className="mt-0.5 text-xs text-muted">{r.condition}</p>}
              {up?.fileName && (
                <p className="mt-1 truncate text-xs font-medium text-emerald-700">✓ {up.fileName}</p>
              )}
              {up?.note && <p className="mt-1 text-xs text-red-600">{up.note}</p>}
            </div>
            {clientId ? (
              <UploadRow clientId={clientId} requirementId={r.id} type={type} hasFile={!!up?.fileName} />
            ) : (
              <button
                disabled
                className="shrink-0 cursor-not-allowed rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-400"
              >
                {t("uploadSoon")}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
