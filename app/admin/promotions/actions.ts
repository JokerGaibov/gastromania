"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canAccessAdminPanel } from "@/lib/auth/roles";

export type PromotionInput = {
  title: string;
  description: string;
  imageUrl: string;
  discountPercent: string; // empty string = null, kept as string for the form
  startsAt: string; // "YYYY-MM-DD" or ""
  endsAt: string; // "YYYY-MM-DD" or ""
  isActive: boolean;
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

function validate(input: PromotionInput): string | null {
  if (!input.title.trim()) return "Укажите заголовок.";
  if (input.discountPercent.trim()) {
    const n = Number(input.discountPercent);
    if (!Number.isFinite(n) || n < 0 || n > 100) return "Скидка должна быть числом от 0 до 100.";
  }
  if (input.startsAt && input.endsAt && input.startsAt > input.endsAt) {
    return "Дата окончания раньше даты начала.";
  }
  return null;
}

function toRow(input: PromotionInput) {
  return {
    title: input.title.trim(),
    description: input.description.trim() || null,
    image_url: input.imageUrl.trim() || null,
    discount_percent: input.discountPercent.trim() ? Number(input.discountPercent) : null,
    starts_at: input.startsAt || null,
    ends_at: input.endsAt || null,
    is_active: input.isActive,
  };
}

export async function createPromotion(input: PromotionInput): Promise<ActionResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };

  const validationError = validate(input);
  if (validationError) return { ok: false, error: validationError };

  const { error } = await auth.supabase.from("promotions").insert(toRow(input));

  if (error) {
    console.error("createPromotion: insert failed", error);
    return { ok: false, error: "Не удалось создать акцию. Попробуйте ещё раз." };
  }

  revalidatePath("/admin/promotions");
  return { ok: true };
}

export async function updatePromotion(id: string, input: PromotionInput): Promise<ActionResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };

  const validationError = validate(input);
  if (validationError) return { ok: false, error: validationError };

  const { error } = await auth.supabase.from("promotions").update(toRow(input)).eq("id", id);

  if (error) {
    console.error("updatePromotion: update failed", error);
    return { ok: false, error: "Не удалось сохранить изменения. Попробуйте ещё раз." };
  }

  revalidatePath("/admin/promotions");
  return { ok: true };
}

export async function togglePromotionActive(id: string, isActive: boolean): Promise<ActionResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase.from("promotions").update({ is_active: isActive }).eq("id", id);

  if (error) {
    console.error("togglePromotionActive: update failed", error);
    return { ok: false, error: "Не удалось изменить статус." };
  }

  revalidatePath("/admin/promotions");
  return { ok: true };
}

export async function deletePromotion(id: string): Promise<ActionResult> {
  const auth = await requireStaff();
  if (!auth.ok) return { ok: false, error: auth.error };

  const { error } = await auth.supabase.from("promotions").delete().eq("id", id);

  if (error) {
    console.error("deletePromotion: delete failed", error);
    return { ok: false, error: "Не удалось удалить акцию." };
  }

  revalidatePath("/admin/promotions");
  return { ok: true };
}
