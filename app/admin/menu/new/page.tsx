import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canAccessAdminPanel } from "@/lib/auth/roles";
import MenuItemForm from "../MenuItemForm";
import { createMenuItem } from "../actions";

export const metadata: Metadata = {
  title: "Новое блюдо — Gastromania",
};

export default async function NewMenuItemPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/menu/new");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!canAccessAdminPanel(profile?.role)) redirect("/admin");

  return (
    <div>
      <span className="label-refined text-[#8C7355] block mb-2">Меню</span>
      <h1 className="heading-editorial text-[#0A0A0A] mb-8" style={{ fontSize: "clamp(1.75rem,3vw,2.25rem)" }}>
        Новое блюдо
      </h1>
      <MenuItemForm onSubmit={createMenuItem} submitLabel="Добавить блюдо" />
    </div>
  );
}
