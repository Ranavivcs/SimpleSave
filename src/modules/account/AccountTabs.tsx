import Link from "next/link";
import { useTranslations } from "next-intl";

export const ACCOUNT_TABS = [
  "personal",
  "mortgage",
  "approval",
  "documents",
  "collateral",
  "messages",
] as const;
export type AccountTab = (typeof ACCOUNT_TABS)[number];

/** Tab navigation for a request's personal area. */
export function AccountTabs({ type, active }: { type: string; active: AccountTab }) {
  const t = useTranslations("account.tabs");
  return (
    <nav className="flex flex-wrap gap-1 border-b border-slate-200">
      {ACCOUNT_TABS.map((tab) => (
        <Link
          key={tab}
          href={`/account/${type}?tab=${tab}`}
          className={
            "rounded-t-lg px-3 py-2 text-sm font-medium " +
            (active === tab
              ? "border-b-2 border-brand-600 text-brand-700"
              : "text-slate-500 hover:text-slate-800")
          }
        >
          {t(tab)}
        </Link>
      ))}
    </nav>
  );
}
