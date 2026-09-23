"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canAccessAdminPanel } from "@/lib/auth/roles";
import { REASON_CODES } from "./constants";

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

export type OrderEditPayload = {
  orderId: string;
  items: { menuItemId: string; quantity: number }[];
  reasonCode: string;
  reasonNote: string;
  customerConfirmed: boolean;
  comment: string;
};

export type OrderEditResult =
  | { ok: true; oldTotal: number; newTotal: number; pendingBalance: number; paymentStatus: string }
  | { ok: false; error: string };

// Ничего не считает сама — только передаёт menu_item_id+quantity в
// admin_update_order_items() (security definer, 20260919100000). Цены,
// subtotal, total и финансовая разница считаются в БД по реальным
// menu_items.price; здесь нет и не должно быть ни одного числа, пришедшего
// с клиента и попадающего в деньги.
export async function updateOrderItems(payload: OrderEditPayload): Promise<OrderEditResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Требуется вход." };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!canAccessAdminPanel(profile?.role)) {
    return { ok: false, error: "Недостаточно прав." };
  }

  // Зеркало серверных проверок — ради понятного сообщения без обращения к
  // БД. Настоящий гейт — в самой RPC, эти проверки его не заменяют.
  if (!payload.customerConfirmed) {
    return { ok: false, error: "Подтвердите, что изменение согласовано с клиентом." };
  }
  if (!REASON_CODES.some((r) => r.value === payload.reasonCode)) {
    return { ok: false, error: "Выберите причину изменения." };
  }
  if (payload.reasonCode === "other" && !payload.reasonNote.trim()) {
    return { ok: false, error: "Опишите причину изменения." };
  }
  if (payload.items.length === 0) {
    return { ok: false, error: "В заказе должна остаться хотя бы одна позиция." };
  }
  if (payload.items.some((i) => !Number.isInteger(i.quantity) || i.quantity <= 0)) {
    return { ok: false, error: "Некорректное количество." };
  }

  const { data, error } = await supabase.rpc("admin_update_order_items", {
    p_order_id: payload.orderId,
    p_items: payload.items.map((i) => ({ menu_item_id: i.menuItemId, quantity: i.quantity })),
    p_reason_code: payload.reasonCode,
    p_customer_confirmed: payload.customerConfirmed,
    p_comment: payload.comment,
    p_reason_note: payload.reasonNote.trim() || null,
  });

  if (error) {
    console.error("updateOrderItems: rpc failed", error);
    // Сообщения из raise exception внутри RPC написаны по-русски и
    // предназначены персоналу — показываем как есть, если они пришли.
    return { ok: false, error: error.message || "Не удалось сохранить изменения. Попробуйте ещё раз." };
  }

  const result = data as {
    old_total: number;
    new_total: number;
    pending_balance_amount: number;
    payment_status: string;
  };

  revalidatePath("/admin/orders");
  return {
    ok: true,
    oldTotal: Number(result.old_total),
    newTotal: Number(result.new_total),
    pendingBalance: Number(result.pending_balance_amount),
    paymentStatus: result.payment_status,
  };
}
