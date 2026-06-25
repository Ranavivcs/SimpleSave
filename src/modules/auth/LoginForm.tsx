"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { sendOtp, verifyOtp, type AuthState } from "@/modules/auth/actions";

const INITIAL: AuthState = {};

/**
 * Two-step passwordless login: enter email → receive a one-time code → verify.
 * All copy comes from the `auth` i18n namespace.
 */
export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const t = useTranslations("auth");
  const [sendState, sendAction, sending] = useActionState(sendOtp, INITIAL);
  const [verifyState, verifyAction, verifying] = useActionState(
    verifyOtp,
    INITIAL,
  );

  const email = verifyState.email ?? sendState.email ?? "";

  if (!sendState.sent) {
    return (
      <form action={sendAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          {t("emailLabel")}
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            dir="ltr"
            defaultValue={email}
            placeholder={t("emailPlaceholder")}
            className="rounded-lg border border-slate-300 px-3 py-2 text-base focus:border-brand-600 focus:outline-none"
          />
        </label>
        {sendState.errorKey && (
          <p role="alert" className="text-sm text-red-600">
            {t(sendState.errorKey)}
          </p>
        )}
        <button
          type="submit"
          disabled={sending}
          className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {sending ? t("sending") : t("sendCode")}
        </button>
      </form>
    );
  }

  return (
    <form action={verifyAction} className="flex flex-col gap-4">
      <input type="hidden" name="email" value={email} />
      {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}
      <p className="text-sm text-slate-600">{t("codeHint", { email })}</p>
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        {t("codeLabel")}
        <input
          type="text"
          name="token"
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          dir="ltr"
          className="rounded-lg border border-slate-300 px-3 py-2 text-center text-lg tracking-widest focus:border-brand-600 focus:outline-none"
        />
      </label>
      {verifyState.errorKey && (
        <p role="alert" className="text-sm text-red-600">
          {t(verifyState.errorKey)}
        </p>
      )}
      <button
        type="submit"
        disabled={verifying}
        className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {verifying ? t("verifying") : t("verify")}
      </button>
    </form>
  );
}
