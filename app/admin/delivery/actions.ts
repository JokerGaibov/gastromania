"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canAccessAdminPanel } from "@/lib/auth/roles";

export type DeliverySettingsInput = {
  isDeliveryEnabled: boolean;
  minOrderAmount: string;
  deliveryFee: string;
  freeDeliveryFrom: string; // "" = no free-delivery threshold
  kitchenOpens: string; // "HH:MM"
  kitchenCloses: string; // "HH:MM"
  zones: string[];
};

export type ActionResult = { ok: true } | { ok: false; error: string };

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function parseNonNegative(value: string): number | null {
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function validate(input: DeliverySettingsInput): string | null {
  if (parseNonNegative(input.minOrderAmount) === null) return "Укажите корректную минимальную сумму заказа.";
  if (parseNonNegative(input.deliveryFee) === null) return "Укажите корректную стоимость доставки.";
  if (input.freeDeliveryFrom.trim() && parseNonNegative(input.freeDeliveryFrom) === null) {
    return "Укажите корректную сумму для бесплатной доставки.";
  }
  if (!TIME_RE.test(input.kitchenOpens)) return "Укажите время открытия кухни.";
  if (!TIME_RE.test(input.kitchenCloses)) return "Укажите время закрытия кухни.";
  return null;
}

export async function updateDeliverySettings(input: DeliverySettingsInput): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Требуется вход." };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!canAccessAdminPanel(profile?.role)) return { ok: false, error: "Недостаточно прав." };

  const validationError = validate(input);
  if (validationError) return { ok: false, error: validationError };

  // validate() already guarantees these parse to non-negative numbers —
  // the non-null assertions just reflect that back to TypeScript.
  const minOrderAmount = parseNonNegative(input.minOrderAmount)!;
  const deliveryFee = parseNonNegative(input.deliveryFee)!;

  // Always an UPDATE against the fixed id=1 singleton row (seeded in
  // 20260801000001_create_core_tables.sql) — never an insert, so there is
  // no code path that could create a second settings row.
  const { error } = await supabase
    .from("delivery_settings")
    .update({
      is_delivery_enabled: input.isDeliveryEnabled,
      min_order_amount: minOrderAmount,
      delivery_fee: deliveryFee,
      free_delivery_from: input.freeDeliveryFrom.trim() ? parseNonNegative(input.freeDeliveryFrom) : null,
      kitchen_opens: input.kitchenOpens,
      kitchen_closes: input.kitchenCloses,
      zones: input.zones.length > 0 ? input.zones : null,
    })
    .eq("id", 1);

  if (error) {
    console.error("updateDeliverySettings: update failed", error);
    return { ok: false, error: "Не удалось сохранить настройки. Попробуйте ещё раз." };
  }

  revalidatePath("/admin/delivery");
  revalidatePath("/admin");
  return { ok: true };
}
