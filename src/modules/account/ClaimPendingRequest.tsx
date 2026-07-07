"use client";

/**
 * Silent bridge from the guest questionnaire to the signed-in personal area:
 * if the browser holds a stashed questionnaire summary for this request type,
 * push it to the customer's AdvisorClient record. Cleared only on success —
 * guests keep the stash until they register.
 */

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { claimPendingRequestAction, type PendingRequestSummary } from "./actions";

const KEY = "simplesave:pending-request";

export function ClaimPendingRequest({ type }: { type: string }) {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    let summary: PendingRequestSummary | null = null;
    try {
      const raw = localStorage.getItem(KEY);
      summary = raw ? (JSON.parse(raw) as PendingRequestSummary) : null;
    } catch {
      return;
    }
    if (!summary || summary.type !== type) return;

    void claimPendingRequestAction(summary).then((ok) => {
      if (ok) {
        localStorage.removeItem(KEY);
        router.refresh();
      }
    });
  }, [type, router]);

  return null;
}
