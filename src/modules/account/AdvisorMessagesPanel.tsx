"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { formatTime } from "@/modules/advisor/format";
import type { ClientMessage } from "@/modules/advisor/types";
import { sendCustomerAdvisorMessageAction } from "./actions";

interface AdvisorThreadView {
  clientId: string;
  advisorName: string;
  clientName: string;
  requestType: string;
  messages: ClientMessage[];
}

export function AdvisorMessagesPanel({ thread }: { thread: AdvisorThreadView | null }) {
  const t = useTranslations("account.advisor");
  const [messages, setMessages] = useState<ClientMessage[]>(thread?.messages ?? []);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  if (!thread) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">{t("title")}</h2>
        <p className="mt-2 text-sm text-muted">{t("noAdvisor")}</p>
      </div>
    );
  }

  const submit = () => {
    const text = draft.trim();
    if (!text || pending) return;

    const optimistic: ClientMessage = {
      id: "customer-" + Date.now(),
      from: "customer",
      text,
      at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft("");
    setError("");

    startTransition(async () => {
      try {
        await sendCustomerAdvisorMessageAction(thread.clientId, thread.requestType, text);
      } catch {
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        setError(t("sendError"));
      }
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{t("title")}</h2>
          <p className="mt-1 text-sm text-muted">{t("assigned", { name: thread.advisorName })}</p>
        </div>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
          {thread.advisorName}
        </span>
      </div>

      <div className="mb-4 max-h-80 space-y-2 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">{t("empty")}</p>
        ) : (
          messages.map((m) => {
            const mine = m.from === "customer";
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
                    {mine ? t("you") : thread.advisorName} · {formatTime(m.at)}
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
          placeholder={t("placeholder")}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        <button
          onClick={submit}
          disabled={!draft.trim() || pending}
          className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-900 disabled:opacity-40"
        >
          {pending ? t("sending") : t("send")}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
