"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

/** Admin-area tab bar (Settings / Market Rates / Mixes), with active state. */
const TABS = [
  { href: "/admin", key: "dashboard", exact: true },
  { href: "/admin/dials", key: "dials", exact: false },
  { href: "/admin/rates", key: "rates", exact: false },
  { href: "/admin/parameters", key: "parameters", exact: false },
] as const;

export function AdminTabs() {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex flex-wrap gap-1 border-b border-slate-200">
      {TABS.map((tab) => {
        const active = tab.exact
          ? pathname === tab.href
          : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
              active
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t(tab.key)}
          </Link>
        );
      })}
    </nav>
  );
}
