import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { canAccessAdminPanel, roleLabel } from "@/lib/auth/roles";

export const metadata: Metadata = {
  title: "Админ-панель — Gastromania",
};

// No adminOnly filtering — with the role model simplified to 'admin'/
// 'customer' (lib/auth/roles.ts), anyone reaching this page is already
// 'admin' (canAccessAdminPanel check below), so every link applies.
const QUICK_LINKS = [
  { href: "/admin/reservations", label: "Брони" },
  { href: "/admin/menu", label: "Меню" },
  { href: "/admin/promotions", label: "Акции" },
  { href: "/admin/delivery", label: "Доставка" },
  { href: "/admin/users", label: "Пользователи" },
];

function StatTile({ label, value, href, accent }: { label: string; value: string; href?: string; accent?: "warn" }) {
  const content = (
    <div className="rounded-[18px] border border-[#0A0A0A]/8 bg-white p-5 sm:p-6 h-full">
      <p className="label-refined text-[#0A0A0A]/40 mb-3">{label}</p>
      <p
        className="heading-editorial"
        style={{ fontSize: "2.25rem", color: accent === "warn" ? "#B3564A" : "#0A0A0A" }}
      >
        {value}
      </p>
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} className="block hover:opacity-80 transition-opacity duration-300">
      {content}
    </Link>
  );
}

// Real counts from Supabase, not sample/demo data — per the owner's
// request this dashboard deliberately stops at operational counts, no
// charts or trend analytics.
export default async function AdminHomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).single();
  if (!canAccessAdminPanel(profile?.role)) redirect("/admin");

  // Same "no explicit restaurant timezone yet" caveat as the reservations
  // list/filter (app/admin/reservations/page.tsx) and Блок 6.4 in
  // gastromania-tasks.md — today's bounds are the server's own wall clock.
  const now = new Date();
  const todayStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T00:00:00`;
  const todayEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T23:59:59.999`;
  const nowIso = now.toISOString();

  const [
    newReservations,
    todayReservations,
    activeMenuItems,
    stopListedMenuItems,
    activePromotions,
    deliverySettings,
  ] = await Promise.all([
    supabase.from("reservations").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .gte("reserved_at", todayStart)
      .lt("reserved_at", todayEnd),
    supabase.from("menu_items").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("menu_items").select("id", { count: "exact", head: true }).eq("is_active", false),
    supabase
      .from("promotions")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
      .or(`ends_at.is.null,ends_at.gte.${nowIso}`),
    supabase.from("delivery_settings").select("is_delivery_enabled").eq("id", 1).single(),
  ]);

  return (
    <div>
      <div className="mb-10">
        <span className="label-refined text-[#8C7355] block mb-2">
          Здравствуйте, {profile?.full_name?.trim() || "коллега"} · {roleLabel(profile?.role ?? "")}
        </span>
        <h1 className="heading-editorial text-[#0A0A0A]" style={{ fontSize: "clamp(1.75rem,3vw,2.25rem)" }}>
          Обзор
        </h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        <StatTile label="Новые брони" value={String(newReservations.count ?? 0)} href="/admin/reservations" />
        <StatTile label="Брони на сегодня" value={String(todayReservations.count ?? 0)} href="/admin/reservations" />
        <StatTile label="Активные позиции меню" value={String(activeMenuItems.count ?? 0)} href="/admin/menu" />
        <StatTile
          label="В стоп-листе"
          value={String(stopListedMenuItems.count ?? 0)}
          href="/admin/menu"
          accent={stopListedMenuItems.count ? "warn" : undefined}
        />
        <StatTile label="Активные акции" value={String(activePromotions.count ?? 0)} href="/admin/promotions" />
        <StatTile
          label="Доставка"
          value={deliverySettings.data?.is_delivery_enabled ? "Включена" : "Выключена"}
          href="/admin/delivery"
          accent={deliverySettings.data?.is_delivery_enabled === false ? "warn" : undefined}
        />
      </div>

      <div>
        <p className="label-refined text-[#0A0A0A]/40 mb-4">Быстрые переходы</p>
        <div className="flex flex-wrap gap-3">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center h-11 px-5 rounded-[12px] border border-[#0A0A0A]/10 bg-white label-refined text-[#0A0A0A]/70 hover:border-[#8C7355] hover:text-[#0A0A0A] transition-colors duration-300"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
