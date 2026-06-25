import { requireUser } from "@/lib/auth/session";
import { SiteHeader } from "@/components/layout/SiteHeader";

/** Personal area (אזור אישי). Any logged-in user; redirects to /login otherwise. */
export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  return (
    <>
      <SiteHeader />
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</div>
    </>
  );
}
