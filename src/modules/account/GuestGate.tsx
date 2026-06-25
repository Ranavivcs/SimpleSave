import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { continueAsGuest } from "./actions";

/** Shown when an unauthenticated user opens the personal area: log in or guest. */
export async function GuestGate() {
  const t = await getTranslations("account.guest");
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-xl font-bold text-slate-900">{t("title")}</h1>
      <p className="mt-2 text-sm text-muted">{t("desc")}</p>
      <div className="mt-6 flex flex-col gap-3">
        <Link
          href="/login?redirect=/account"
          className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-900"
        >
          {t("login")}
        </Link>
        <form action={continueAsGuest}>
          <button className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-brand-500">
            {t("guest")}
          </button>
        </form>
      </div>
    </div>
  );
}
