import Link from "next/link";
import { useTranslations } from "next-intl";

export const ADVISOR_VIEWS = ["clients", "tasks"] as const;
export type AdvisorView = (typeof ADVISOR_VIEWS)[number];

/** Top-level advisor tabs: "my clients" and "tasks". */
export function AdvisorTabs({ active }: { active: AdvisorView }) {
  const t = useTranslations("advisor.views");
  return (
    <nav className="flex gap-1 border-b border-slate-200">
      {ADVISOR_VIEWS.map((view) => {
        const isActive = active === view;
        return (
          <Link
            key={view}
            href={`/advisor?view=${view}`}
            className={
              "rounded-t-lg px-4 py-2 text-sm font-medium " +
              (isActive
                ? "border-b-2 border-brand-600 text-brand-700"
                : "text-slate-500 hover:text-slate-800")
            }
          >
            {t(view)}
          </Link>
        );
      })}
    </nav>
  );
}
