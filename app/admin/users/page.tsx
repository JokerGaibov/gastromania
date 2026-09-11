import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RoleSelect from "./RoleSelect";

export const metadata: Metadata = {
  title: "Пользователи — Gastromania",
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(iso)
  );
}

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/users");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  // Now equivalent to the outer /admin gate in app/admin/layout.tsx (both
  // are 'admin'-only since the role model simplified to admin/customer —
  // see lib/auth/roles.ts) but kept as its own explicit check anyway,
  // matching the same defense-in-depth reasoning as every other /admin/*
  // page: a layout doesn't re-run on every client-side navigation between
  // its sibling pages, so each page verifies itself.
  if (profile?.role !== "admin") {
    return (
      <div className="max-w-[440px] rounded-[24px] border border-[#0A0A0A]/8 bg-white shadow-[0_4px_16px_-8px_rgba(10,10,10,0.08)] p-10 text-center">
        <span className="label-refined text-[#B3564A] block mb-4">Доступ запрещён</span>
        <h1 className="heading-editorial text-[#0A0A0A] mb-4" style={{ fontSize: "1.75rem" }}>
          Только для администратора
        </h1>
        <p className="text-[#0A0A0A]/50 text-sm font-body">
          Управление пользователями и ролями доступно только роли «Администратор».
        </p>
      </div>
    );
  }

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <span className="label-refined text-[#8C7355] block mb-2">Персонал</span>
      <h1 className="heading-editorial text-[#0A0A0A] mb-8" style={{ fontSize: "clamp(1.75rem,3vw,2.25rem)" }}>
        Пользователи
      </h1>

      {error && (
        <p className="text-[#B3564A] text-sm font-body">Не удалось загрузить пользователей. Обновите страницу.</p>
      )}

      {!error && (
        <div className="grid gap-3">
          {(profiles ?? []).map((p) => (
            <div
              key={p.id}
              className="rounded-[16px] border border-[#0A0A0A]/8 bg-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[#0A0A0A] font-body font-medium text-[0.9375rem]">
                  {p.full_name?.trim() || "Без имени"}
                  {p.id === user.id && <span className="text-[#8C7355] text-xs ml-2">(вы)</span>}
                </p>
                <p className="text-[#0A0A0A]/45 text-xs font-body mt-0.5">{p.email ?? "email не найден"}</p>
                <p className="text-[#0A0A0A]/35 text-xs font-body mt-0.5">С {formatDate(p.created_at)}</p>
              </div>
              <RoleSelect id={p.id} role={p.role} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
