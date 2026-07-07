"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type {
  AdvisorClient,
  ClientDocument,
  ClientMessage,
  DocStatus,
} from "./types";
import { ils, formatDate, formatTime } from "./format";

type DetailTab = "summary" | "documents" | "messages";

const DOC_STATUS_PILL: Record<DocStatus, string> = {
  pending: "bg-slate-100 text-slate-600",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  requested: "bg-amber-100 text-amber-700",
};

/**
 * Expanded client detail: summary + document review + message thread.
 * Mutations (approve/reject/request a doc, send a message) update in-session
 * state held by the parent — POC level; persistence comes with the DB phase.
 */
export function ClientDetail({
  client,
  documents,
  messages,
  onDocStatus,
  onSend,
}: {
  client: AdvisorClient;
  documents: ClientDocument[];
  messages: ClientMessage[];
  onDocStatus: (docId: string, status: DocStatus, note?: string) => void;
  onSend: (text: string) => void;
}) {
  const t = useTranslations("advisor");
  const [tab, setTab] = useState<DetailTab>("summary");

  const tabs: DetailTab[] = ["summary", "documents", "messages"];

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <nav className="flex gap-1 border-b border-slate-200 px-3 pt-2">
        {tabs.map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={
              "rounded-t-lg px-3 py-2 text-sm font-medium " +
              (tab === tb
                ? "border-b-2 border-brand-600 text-brand-700"
                : "text-slate-500 hover:text-slate-800")
            }
          >
            {t(`detail.tabs.${tb}`)}
            {tb === "messages" && messages.length > 0 && (
              <span className="ms-1 text-xs text-muted">({messages.length})</span>
            )}
          </button>
        ))}
      </nav>

      <div className="p-4">
        {tab === "summary" ? (
          <Summary client={client} t={t} />
        ) : tab === "documents" ? (
          <Documents documents={documents} onDocStatus={onDocStatus} t={t} />
        ) : (
          <Messages messages={messages} onSend={onSend} t={t} />
        )}
      </div>
    </div>
  );
}

/* ----------------------------- summary tab ----------------------------- */

function Summary({
  client: c,
  t,
}: {
  client: AdvisorClient;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div>
        <h3 className="mb-3 text-sm font-bold text-slate-900">{t("summary.request")}</h3>
        <dl className="space-y-2 text-sm">
          <Row label={t("summary.requestType")} value={t(`requests.${c.request.type}`)} />
          <Row label={t("summary.propertyValue")} value={ils.format(c.request.propertyValue)} />
          <Row label={t("summary.equity")} value={ils.format(c.request.equity)} />
          <Row label={t("summary.loanAmount")} value={ils.format(c.request.loanAmount)} />
        </dl>
      </div>
      <div>
        <h3 className="mb-3 text-sm font-bold text-slate-900">{t("summary.process")}</h3>
        <dl className="space-y-2 text-sm">
          <Row label={t("table.status")} value={t(`status.${c.status}`)} />
          <Row label={t("summary.nextTreatment")} value={formatDate(c.nextTreatment)} />
          <Row
            label={t("table.approvedBanks")}
            value={
              c.approvedBanks.length === 0
                ? "—"
                : c.approvedBanks.map((b) => t(`banks.${b}`)).join(", ")
            }
          />
        </dl>
        {c.notes && (
          <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{c.notes}</p>
        )}
      </div>
    </div>
  );
}

/* ---------------------------- documents tab ---------------------------- */

function Documents({
  documents,
  onDocStatus,
  t,
}: {
  documents: ClientDocument[];
  onDocStatus: (docId: string, status: DocStatus, note?: string) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  if (documents.length === 0) {
    return <p className="text-sm text-muted">{t("documents.empty")}</p>;
  }
  return (
    <ul className="divide-y divide-slate-100">
      {documents.map((d) => (
        <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-900">
                {d.name ?? t(`docNames.${d.nameKey}`)}
              </span>
              <span className={"rounded-full px-2 py-0.5 text-xs font-medium " + DOC_STATUS_PILL[d.status]}>
                {t(`docStatus.${d.status}`)}
              </span>
            </div>
            {d.fileUrl && (
              <a
                href={d.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block max-w-64 truncate text-xs font-medium text-brand-700 hover:underline"
              >
                📎 {d.fileName ?? t("documents.viewFile")}
              </a>
            )}
            {d.note && <p className="mt-1 text-xs text-red-600">{d.note}</p>}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onDocStatus(d.id, "approved")}
              disabled={d.status === "approved"}
              className="rounded-lg border border-emerald-300 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
            >
              {t("docActions.approve")}
            </button>
            <button
              onClick={() => onDocStatus(d.id, "rejected", t("docActions.rejectNote"))}
              disabled={d.status === "rejected"}
              className="rounded-lg border border-red-300 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-40"
            >
              {t("docActions.reject")}
            </button>
            <button
              onClick={() => onDocStatus(d.id, "requested")}
              disabled={d.status === "requested"}
              className="rounded-lg border border-amber-300 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-40"
            >
              {t("docActions.request")}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ----------------------------- messages tab ---------------------------- */

function Messages({
  messages,
  onSend,
  t,
}: {
  messages: ClientMessage[];
  onSend: (text: string) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const [draft, setDraft] = useState("");

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  };

  return (
    <div>
      <div className="mb-3 max-h-64 space-y-2 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">{t("messages.empty")}</p>
        ) : (
          messages.map((m) => {
            const mine = m.from === "advisor";
            return (
              <div key={m.id} className={"flex " + (mine ? "justify-start" : "justify-end")}>
                <div
                  className={
                    "max-w-[75%] rounded-2xl px-3 py-2 text-sm " +
                    (mine ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-800")
                  }
                >
                  <p>{m.text}</p>
                  <p className={"mt-1 text-[10px] " + (mine ? "text-white/70" : "text-slate-500")}>
                    {mine ? t("messages.you") : t("messages.client")} · {formatTime(m.at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder={t("messages.placeholder")}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        <button
          onClick={submit}
          disabled={!draft.trim()}
          className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-900 disabled:opacity-40"
        >
          {t("messages.send")}
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}
