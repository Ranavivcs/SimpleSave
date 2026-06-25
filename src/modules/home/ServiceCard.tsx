import Link from "next/link";
import type { ReactNode } from "react";

type ServiceCardProps = {
  href: string;
  icon: ReactNode;
  iconBg: string;
  title: string;
  description: string;
  bullets: string[];
  cta: string;
};

/** A single service entry on the home page (new / refinance / insurance). */
export function ServiceCard({
  href,
  icon,
  iconBg,
  title,
  description,
  bullets,
  cta,
}: ServiceCardProps) {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div
        className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-white ${iconBg}`}
      >
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-muted">{description}</p>
      <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
        {bullets.map((b) => (
          <li key={b} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            {b}
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-900"
      >
        {cta}
      </Link>
    </div>
  );
}
