import Link from "next/link";
import { getTranslations } from "next-intl/server";

/** "My requests" — entry points into each request's tabbed personal area. */
const TYPES = ["new-mortgage", "refinance", "insurance"] as const;

export default async function AccountHomePage() {
  const t = await getTranslations("account");

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold text-brand-900">{t("title")}</h1>
      <h2 className="mb-3 text-sm font-semibold text-slate-600">{t("myRequests")}</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {TYPES.map((ty) => (
          <Link
            key={ty}
            href={`/account/${ty}`}
            className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <span className="text-base font-bold text-slate-900">{t(`requests.${ty}`)}</span>
            <span className="mt-2 text-sm font-semibold text-brand-700">{t("openRequest")} →</span>
          </Link>
        ))}
      </div>
    </>
  );
}
