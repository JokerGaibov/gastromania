import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canAccessAdminPanel } from "@/lib/auth/roles";
import LogoutButton from "./LogoutButton";

export const metadata: Metadata = {
  title: "Админ-панель — Gastromania",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Администратор",
  manager: "Менеджер",
  waiter: "Официант",
  courier: "Курьер",
  customer: "Гость",
};

// Overview screen — counts (Блок 7.6) still pending, this just shows who's
// signed in. Re-checks auth itself rather than trusting the layout blindly —
// see the "Auth checks in page components" guidance in
// node_modules/next/dist/docs/01-app/02-guides/authentication.md: layouts
// don't re-run on every client-side navigation, so each page under a
// protected layout should still verify its own data access once more
// /admin/* pages exist beyond this one.
export default async function AdminHomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!canAccessAdminPanel(profile?.role)) redirect("/admin");

  const roleLabel = (profile?.role && ROLE_LABELS[profile.role]) || profile?.role || "—";

  return (
    <div className="max-w-[440px] rounded-[24px] border border-[#0A0A0A]/8 bg-white shadow-[0_4px_16px_-8px_rgba(10,10,10,0.08)] p-10">
      <span className="label-refined text-[#8C7355] block mb-4">Панель персонала</span>
      <h1 className="heading-editorial text-[#0A0A0A] mb-8" style={{ fontSize: "1.75rem" }}>
        {profile?.full_name?.trim() || "Без имени"}
      </h1>

      <dl className="flex flex-col gap-5 mb-10">
        <div>
          <dt className="label-refined text-[#0A0A0A]/35 mb-1">Email</dt>
          <dd className="text-[#0A0A0A]/80 text-[0.9375rem] font-body">{user.email}</dd>
        </div>
        <div>
          <dt className="label-refined text-[#0A0A0A]/35 mb-1">Роль</dt>
          <dd className="text-[#0A0A0A]/80 text-[0.9375rem] font-body">{roleLabel}</dd>
        </div>
      </dl>

      <LogoutButton />
    </div>
  );
}
