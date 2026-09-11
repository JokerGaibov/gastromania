import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { canAccessAdminPanel } from "@/lib/auth/roles";
import LogoutButton from "./LogoutButton";

// Real protection lives here (and in RLS) — the guard is a server-side read
// on every request to a page under this layout, not a client-side check
// that could be bypassed. See gastromania-spec.md's own note on this:
// "Middleware это удобство, реальная защита в layout и в RLS."
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  // profiles_select_own_or_admin RLS policy lets any signed-in user read
  // their own row (auth.uid() = id) regardless of role, so this works for
  // a plain customer just as much as for staff — no admin-only RPC needed.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!canAccessAdminPanel(profile?.role)) {
    return (
      <main className="bg-[#F5F0E8] min-h-screen flex items-center justify-center px-8">
        <div className="w-full max-w-[440px] rounded-[24px] border border-[#0A0A0A]/8 bg-white shadow-[0_30px_80px_-24px_rgba(10,10,10,0.2)] p-10 text-center">
          <span className="label-refined text-[#B3564A] block mb-4">Доступ запрещён</span>
          <h1 className="heading-editorial text-[#0A0A0A] mb-4" style={{ fontSize: "1.75rem" }}>
            Это раздел для персонала
          </h1>
          <p className="text-[#0A0A0A]/50 text-sm font-body mb-8" style={{ letterSpacing: "0.02em" }}>
            У вашей учётной записи нет доступа к панели управления.
          </p>
          <div className="flex items-center justify-center gap-6">
            <Link
              href="/"
              className="label-refined text-[#0A0A0A]/60 hover:text-[#0A0A0A] transition-colors duration-300"
            >
              На главную
            </Link>
            <LogoutButton />
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
