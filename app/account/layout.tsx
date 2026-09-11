import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

// Guard only — any signed-in user (customer or admin) may be here, unlike
// app/admin/layout.tsx which additionally checks role. Same x-pathname
// mechanism from proxy.ts as the admin guard, so a login redirect from a
// deep link (e.g. /account/orders) returns here afterwards, not to /account.
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const pathname = (await headers()).get("x-pathname") ?? "/account";
    redirect(`/login?next=${pathname}`);
  }

  return <>{children}</>;
}
