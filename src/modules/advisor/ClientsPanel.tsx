"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type {
  AdvisorClient,
  ClientDocument,
  ClientMessage,
  ClientProcessStatus,
  DocStatus,
} from "./types";
import { CLIENT_STATUSES } from "./types";
import { formatDate } from "./format";
import { ClientDetail } from "./ClientDetail";

type Filter = ClientProcessStatus | "all";

/** Mutable, in-session client state (doc review + thread + unread). */
interface ClientState {
  documents: ClientDocument[];
  messages: ClientMessage[];
  unread: number;
}

const STATUS_PILL: Record<ClientProcessStatus, string> = {
  before: "bg-slate-100 text-slate-600",
  in: "bg-amber-100 text-amber-700",
  after: "bg-emerald-100 text-emerald-700",
};

/**
 * "My clients" table. Clients arrive pre-sorted (next-treatment-date, then
 * unread messages); the status chips filter the visible rows, and a row expands
 * to the client detail (summary · documents review · message thread).
 */
export function ClientsPanel({ clients }: { clients: AdvisorClient[] }) {
  const t = useTranslations("advisor");
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [state, setState] = useState<Record<string, ClientState>>(() =>
    Object.fromEntries(
      clients.map((c) => [
        c.id,
        { documents: c.documents, messages: c.messages, unread: c.unreadMessages },
      ]),
    ),
  );

  const filters: Filter[] = ["all", ...CLIENT_STATUSES];
  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: clients.length, before: 0, in: 0, after: 0 };
    for (const cl of clients) c[cl.status] += 1;
    return c;
  }, [clients]);

  const rows = filter === "all" ? clients : clients.filter((c) => c.status === filter);

  /** Open/close a row; opening marks the client's messages as read. */
  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
    if (openId !== id) {
      setState((s) => ({ ...s, [id]: { ...s[id], unread: 0 } }));
    }
  };

  const setDocStatus = (clientId: string, docId: string, status: DocStatus, note?: string) =>
    setState((s) => ({
      ...s,
      [clientId]: {
        ...s[clientId],
        documents: s[clientId].documents.map((d) =>
          d.id === docId ? { ...d, status, note: status === "rejected" ? note : undefined } : d,
        ),
      },
    }));

  const sendMessage = (clientId: string, text: string) =>
    setState((s) => ({
      ...s,
      [clientId]: {
        ...s[clientId],
        messages: [
          ...s[clientId].messages,
          { id: "m" + Date.now(), from: "advisor", text, at: new Date().toISOString() },
        ],
      },
    }));

  return (
    <div>
      {/* Filter chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={
              "rounded-full px-3 py-1.5 text-sm font-medium " +
              (filter === f
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200")
            }
          >
            {t(`filters.${f}`)} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Clients table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
              <th className="px-4 py-3 font-semibold">{t("table.name")}</th>
              <th className="px-4 py-3 font-semibold">{t("table.advisor")}</th>
              <th className="px-4 py-3 font-semibold">{t("table.status")}</th>
              <th className="px-4 py-3 font-semibold">{t("table.stage")}</th>
              <th className="px-4 py-3 font-semibold">{t("table.approvedBanks")}</th>
              <th className="px-4 py-3 font-semibold">{t("table.nextTreatment")}</th>
              <th className="px-4 py-3 font-semibold">{t("table.messages")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  {t("table.empty")}
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <FragmentRow
                  key={c.id}
                  client={c}
                  unread={state[c.id].unread}
                  isOpen={openId === c.id}
                  onToggle={() => toggle(c.id)}
                  detail={
                    <ClientDetail
                      client={c}
                      documents={state[c.id].documents}
                      messages={state[c.id].messages}
                      onDocStatus={(docId, status, note) => setDocStatus(c.id, docId, status, note)}
                      onSend={(text) => sendMessage(c.id, text)}
                    />
                  }
                  t={t}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FragmentRow({
  client: c,
  unread,
  isOpen,
  onToggle,
  detail,
  t,
}: {
  client: AdvisorClient;
  unread: number;
  isOpen: boolean;
  onToggle: () => void;
  detail: React.ReactNode;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <>
      <tr className="border-b border-slate-100 hover:bg-slate-50">
        <td className="px-4 py-3">
          <button onClick={onToggle} className="text-right">
            <span className="font-medium text-slate-900">{c.name}</span>
            <span className="block text-xs text-muted">{c.email}</span>
          </button>
        </td>
        <td className="px-4 py-3 text-slate-600">{c.advisorName}</td>
        <td className="px-4 py-3">
          <span className={"rounded-full px-2.5 py-1 text-xs font-medium " + STATUS_PILL[c.status]}>
            {t(`status.${c.status}`)}
          </span>
        </td>
        <td className="px-4 py-3 text-slate-600">{t(`stage.${c.stage}`)}</td>
        <td className="px-4 py-3 text-slate-600">
          {c.approvedBanks.length === 0
            ? "—"
            : c.approvedBanks.map((b) => t(`banks.${b}`)).join(", ")}
        </td>
        <td className="px-4 py-3 text-slate-600">{formatDate(c.nextTreatment)}</td>
        <td className="px-4 py-3">
          <button onClick={onToggle} className="relative inline-flex" aria-label={t("table.messages")}>
            <span aria-hidden>💬</span>
            {unread > 0 && (
              <span className="absolute -top-2 -left-2 rounded-full bg-brand-600 px-1.5 text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </button>
        </td>
      </tr>
      {isOpen && (
        <tr className="border-b border-slate-200 bg-slate-50/60">
          <td colSpan={7} className="px-4 py-5">
            {detail}
          </td>
        </tr>
      )}
    </>
  );
}
