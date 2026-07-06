import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { applicable } from "./applicable";

/**
 * Dynamic required-document list for a request, read from the seeded
 * `DocumentRequirement` config (Phase 2B). Filtered by request type; the actual
 * upload (Supabase Storage + advisor review) is Phase 5.
 */

export async function DocumentList({ type }: { type: string }) {
  const t = await getTranslations("documents");
  const all = await prisma.documentRequirement.findMany({ orderBy: { order: "asc" } });
  const reqs = all.filter((r) => applicable(r.appliesTo, type));

  if (reqs.length === 0) return <p className="text-sm text-muted">{t("empty")}</p>;

  return (
    <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {reqs.map((r) => (
        <li key={r.id} className="flex items-center justify-between gap-4 p-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-900">{r.name}</span>
              {r.requiredToProceed && (
                <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                  {t("required")}
                </span>
              )}
            </div>
            {r.condition && <p className="mt-0.5 text-xs text-muted">{r.condition}</p>}
          </div>
          <button
            disabled
            className="shrink-0 cursor-not-allowed rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-400"
          >
            {t("uploadSoon")}
          </button>
        </li>
      ))}
    </ul>
  );
}
