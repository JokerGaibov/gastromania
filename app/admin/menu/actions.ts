"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canAccessAdminPanel } from "@/lib/auth/roles";
import { MENU_CATEGORIES } from "./constants";

const CATEGORY_VALUES = MENU_CATEGORIES.map((c) => c.value);

export type MenuItemInput = {
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
};

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, ok: false as const, error: "Требуется вход." };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!canAccessAdminPanel(profile?.role)) {
    return { supabase, ok: false as const, error: "Недостаточно прав." };
  }
  return { supabase, ok: true as const };
}

// Mirrors the client-side checks in MenuItemForm.tsx, but this copy is what
// actually gates the write — same "не доверяем клиенту" principle as
// reservation/actions.ts and admin/reservations/actions.ts.
function validate(input: MenuItemInput): string | null {
  if (!input.name.trim()) return "Укажите название.";
  if (!Number.isFinite(input.price) || input.price < 0) return "Укажите корректную цену.";
  if (!CATEGORY_VALUES.includes(input.category as (typeof CATEGORY_VALUES)[number])) {
    return "Выберите категорию.";
  }
  return null;
}

export async function createMenuItem(input: MenuItemInput): Promise<ActionResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };

  const validationError = validate(input);
  if (validationError) return { ok: false, error: validationError };

  const { error } = await auth.supabase.from("menu_items").insert({
    name: input.name.trim(),
    description: input.description.trim() || null,
    price: input.price,
    category: input.category,
    image_url: input.imageUrl.trim() || null,
    is_active: input.isActive,
    sort_order: input.sortOrder,
  });

  if (error) {
    console.error("createMenuItem: insert failed", error);
    return { ok: false, error: "Не удалось создать блюдо. Попробуйте ещё раз." };
  }

  revalidatePath("/admin/menu");
  return { ok: true };
}

export async function updateMenuItem(id: string, input: MenuItemInput): Promise<ActionResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };

  const validationError = validate(input);
  if (validationError) return { ok: false, error: validationError };

  const { error } = await auth.supabase
    .from("menu_items")
    .update({
      name: input.name.trim(),
      description: input.description.trim() || null,
      price: input.price,
      category: input.category,
      image_url: input.imageUrl.trim() || null,
      is_active: input.isActive,
      sort_order: input.sortOrder,
    })
    .eq("id", id);

  if (error) {
    console.error("updateMenuItem: update failed", error);
    return { ok: false, error: "Не удалось сохранить изменения. Попробуйте ещё раз." };
  }

  revalidatePath("/admin/menu");
  return { ok: true };
}

// Separate from updateMenuItem — this is the fast stop-list action on the
// list page itself (spec: "снять блюдо со стоп-листа... меньше чем за пять
// секунд"), not routed through the full edit form.
export async function toggleMenuItemActive(id: string, isActive: boolean): Promise<ActionResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase.from("menu_items").update({ is_active: isActive }).eq("id", id);

  if (error) {
    console.error("toggleMenuItemActive: update failed", error);
    return { ok: false, error: "Не удалось изменить стоп-лист." };
  }

  revalidatePath("/admin/menu");
  return { ok: true };
}

export async function deleteMenuItem(id: string): Promise<ActionResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase.from("menu_items").delete().eq("id", id);

  if (error) {
    console.error("deleteMenuItem: delete failed", error);
    return { ok: false, error: "Не удалось удалить блюдо." };
  }

  revalidatePath("/admin/menu");
  return { ok: true };
}
