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

/** Sequence that gates the tabs (documents is excluded — always open). */
export const TAB_SEQUENCE: AccountTab[] = [
  "personal",
  "mortgage",
  "approval",
  "collateral",
  "messages",
];

/** Tab navigation. Locked tabs (not yet reached in the sequence) are disabled. */
export function AccountTabs({
  type,
  active,
  unlocked,
}: {
  type: string;
  active: AccountTab;
  unlocked: AccountTab[];
}) {
  const t = useTranslations("account.tabs");
  return (
    <nav className="flex flex-wrap gap-1 border-b border-slate-200">
      {ACCOUNT_TABS.map((tab) => {
        const cls =
          "rounded-t-lg px-3 py-2 text-sm font-medium " +
          (active === tab
            ? "border-b-2 border-brand-600 text-brand-700"
            : "text-slate-500 hover:text-slate-800");
        if (!unlocked.includes(tab)) {
          return (
            <span
              key={tab}
              aria-disabled
              className="cursor-not-allowed rounded-t-lg px-3 py-2 text-sm font-medium text-slate-300"
            >
              🔒 {t(tab)}
            </span>
          );
        }
        return (
          <Link key={tab} href={`/account/${type}?tab=${tab}`} className={cls}>
            {t(tab)}
          </Link>
        );
      })}
    </nav>
  );
}
