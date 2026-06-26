"use client";

/**
 * Dials screen ("מסך השעונים") — shown when the new-mortgage questionnaire
 * completes. Resolves the 5 dials via a server action (config from DB) and
 * renders a card per option. In-memory selection; no persistence yet.
 */

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { ResolveDialsInput } from "@/lib/dials";
import { getDials } from "./actions";
import { DialCard } from "./DialCard";
import type { DialCardData } from "./dialView";

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; dials: DialCardData[] };

export function DialsScreen({ input, onEdit }: { input: ResolveDialsInput; onEdit?: () => void }) {
  const t = useTranslations("dials");
  const [state, setState] = useState<State>({ status: "loading" });
  const [selected, setSelected] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { loanAmount, purpose, minPay, maxPay } = input;
  useEffect(() => {
    let alive = true;
    setState({ status: "loading" });
    getDials({ loanAmount, purpose, minPay, maxPay })
      .then((dials) => alive && setState({ status: "ready", dials }))
      .catch(() => alive && setState({ status: "error" }));
    return () => {
      alive = false;
    };
  }, [loanAmount, purpose, minPay, maxPay]);

  return (
    <div className="mx-[calc(50%-50vw)]">
      <div className="mx-auto max-w-6xl px-4">
        <section>
      <header className="mb-6 text-center">
        <h2 className="text-2xl font-extrabold text-brand-900">{t("title")}</h2>
        <p className="mt-2 text-sm text-muted">{t("subtitle")}</p>
        {onEdit && (
          <button type="button" onClick={onEdit} className="mt-3 text-sm font-medium text-brand-700 hover:underline">
            {t("editAnswers")}
          </button>
        )}
      </header>

      {state.status === "loading" && <p className="py-10 text-center text-sm text-muted">{t("loading")}</p>}
      {state.status === "error" && <p className="py-10 text-center text-sm text-red-600">{t("error")}</p>}

      {state.status === "ready" && (
        state.dials.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">{t("empty")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {state.dials.map((d) => (
              <DialCard
                key={d.key}
                dial={d}
                selected={selected === d.key}
                expanded={expanded === d.key}
                onSelect={() => setSelected(d.key)}
                onToggleDetails={() => setExpanded((e) => (e === d.key ? null : d.key))}
              />
            ))}
          </div>
        )
      )}
        </section>
      </div>
    </div>
  );
}
