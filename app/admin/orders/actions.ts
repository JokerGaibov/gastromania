"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canAccessAdminPanel } from "@/lib/auth/roles";

const VALID_STATUSES = [
  "new",
  "accepted",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;
type OrderStatus = (typeof VALID_STATUSES)[number];

export type ActionResult = { ok: true } | { ok: false; error: string };

// Only ever touches order_status. payment_status/paid_at are not — and
// cannot be, by anyone through this action or any other normal client
// session — writable here: the orders_guard_payment_status trigger
// (20260911230000) rejects any change to those two columns unless
// auth.role() = 'service_role', which a signed-in admin's own session
// never is. That's the real backstop; this function just never attempts it.
export async function updateOrderStatus(id: string, status: string): Promise<ActionResult> {
  if (!VALID_STATUSES.includes(status as OrderStatus)) {
    return { ok: false, error: "Некорректный статус." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Требуется вход." };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!canAccessAdminPanel(profile?.role)) {
    return { ok: false, error: "Недостаточно прав." };
  }

  const { error } = await supabase.from("orders").update({ order_status: status }).eq("id", id);

  if (error) {
    console.error("updateOrderStatus: update failed", error);
    return { ok: false, error: "Не удалось изменить статус. Попробуйте ещё раз." };
  }

  revalidatePath("/admin/orders");
  return { ok: true };
}
