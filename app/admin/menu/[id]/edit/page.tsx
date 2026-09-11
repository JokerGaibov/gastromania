import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canAccessAdminPanel } from "@/lib/auth/roles";
import MenuItemForm from "../../MenuItemForm";
import { updateMenuItem } from "../../actions";

export const metadata: Metadata = {
  title: "Редактирование блюда — Gastromania",
};

export default async function EditMenuItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/admin/menu/${id}/edit`);

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!canAccessAdminPanel(profile?.role)) redirect("/admin");

  const { data: item } = await supabase
    .from("menu_items")
    .select("id, name, description, price, category, image_url, is_active, sort_order")
    .eq("id", id)
    .single();

  if (!item) notFound();

  const boundUpdate = updateMenuItem.bind(null, id);

  return (
    <div>
      <span className="label-refined text-[#8C7355] block mb-2">Меню</span>
      <h1 className="heading-editorial text-[#0A0A0A] mb-8" style={{ fontSize: "clamp(1.75rem,3vw,2.25rem)" }}>
        {item.name}
      </h1>
      <MenuItemForm
        initial={{
          name: item.name,
          description: item.description ?? "",
          price: item.price,
          category: item.category,
          imageUrl: item.image_url ?? "",
          isActive: item.is_active,
          sortOrder: item.sort_order ?? 0,
        }}
        onSubmit={boundUpdate}
        submitLabel="Сохранить изменения"
      />
    </div>
  );
}
