"use client";

/**
 * Post-flow document upload screen — lists the same seeded `DocumentRequirement`
 * config the personal area's מסמכים tab shows (filtered per request type) and
 * lets the user attach a file per document. Files are held in memory only, like
 * the rest of the guest flow; persistent upload (Supabase Storage) + advisor
 * review land with Phase 5.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getDocumentRequirements, type RequirementItem } from "./actions";

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; reqs: RequirementItem[] };

export function DocumentsUploadScreen({ type, onBack }: { type: string; onBack?: () => void }) {
  const t = useTranslations("documents.upload");
  const tDocs = useTranslations("documents");
  const [state, setState] = useState<State>({ status: "loading" });
  const [files, setFiles] = useState<Record<string, File>>({});

  // Reset to loading when the type changes — render-time adjustment instead of
  // a synchronous setState inside the effect (react-hooks/set-state-in-effect).
  const [prevType, setPrevType] = useState(type);
  if (prevType !== type) {
    setPrevType(type);
    setState({ status: "loading" });
    setFiles({});
  }

  useEffect(() => {
    let alive = true;
    getDocumentRequirements(type)
      .then((reqs) => alive && setState({ status: "ready", reqs }))
      .catch(() => alive && setState({ status: "error" }));
    return () => {
      alive = false;
    };
  }, [type]);

  const attach = (id: string, file: File | undefined) =>
    setFiles((f) => {
      if (!file) return f;
      return { ...f, [id]: file };
    });
  const remove = (id: string) =>
    setFiles((f) => {
      const rest = { ...f };
      delete rest[id];
      return rest;
    });

  return (
    <section>
      <header className="mb-6 text-center">
        <h2 className="text-2xl font-extrabold text-brand-900">{t("title")}</h2>
        <p className="mt-2 text-sm text-muted">{t("subtitle")}</p>
        {onBack && (
          <button type="button" onClick={onBack} className="mt-3 text-sm font-medium text-brand-700 hover:underline">
            {t("back")}
          </button>
        )}
      </header>

      {state.status === "loading" && <p className="py-10 text-center text-sm text-muted">{t("loading")}</p>}
      {state.status === "error" && <p className="py-10 text-center text-sm text-red-600">{t("error")}</p>}

      {state.status === "ready" &&
        (state.reqs.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">{tDocs("empty")}</p>
        ) : (
          <>
            <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {state.reqs.map((r) => {
                const file = files[r.id];
                return (
                  <li key={r.id} className="flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">{r.name}</span>
                        {r.requiredToProceed && (
                          <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                            {tDocs("required")}
                          </span>
                        )}
                      </div>
                      {r.condition && <p className="mt-0.5 text-xs text-muted">{r.condition}</p>}
                      {file && (
                        <p className="mt-1 truncate text-xs font-medium text-emerald-700">✓ {file.name}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <label className="cursor-pointer rounded-lg border border-brand-600 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50">
                        {file ? t("replace") : t("attach")}
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => attach(r.id, e.target.files?.[0])}
                        />
                      </label>
                      {file && (
                        <button
                          type="button"
                          onClick={() => remove(r.id)}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-red-400 hover:text-red-600"
                        >
                          {t("remove")}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 text-center">
              <p className="text-sm font-medium text-brand-900">
                {t("progress", { done: Object.keys(files).length, total: state.reqs.length })}
              </p>
              <p className="mt-1 text-xs text-muted">{t("note")}</p>
              <Link
                href={`/account/${type}?tab=documents`}
                className="mt-4 inline-block rounded-lg bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-900"
              >
                {t("finish")}
              </Link>
            </div>
          </>
        ))}
    </section>
  );
}
