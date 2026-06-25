import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth/session";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { GuestGate } from "@/modules/account/GuestGate";

/**
 * Personal area (אזור אישי). Signed-in users enter directly; otherwise we offer
 * a choice — log in (to save) or continue as guest (view/fill, in-memory). The
 * guest choice is remembered via a cookie.
 */
export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  const isGuest = (await cookies()).get("guest")?.value === "1";

  return (
    <>
      <SiteHeader />
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {user || isGuest ? children : <GuestGate />}
      </div>
    </>
  );
}
