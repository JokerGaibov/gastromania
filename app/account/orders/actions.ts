"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CancelOrderResult = { ok: true } | { ok: false; error: string };

// Тонкая обёртка над cancel_own_order() (20260921100000). Все реальные
// проверки — владение заказом, order_status='new', payment_status='pending'
// — живут в самой функции в БД, а не здесь: клиент не получает никакого
// прямого UPDATE на orders, и обойти эти условия, вызвав RPC напрямую,
// тоже нельзя.
export async function cancelOwnOrder(orderId: string): Promise<CancelOrderResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Требуется вход." };

  const { error } = await supabase.rpc("cancel_own_order", { p_order_id: orderId });

  if (error) {
    console.error("cancelOwnOrder: rpc failed", error);
    // Сообщения из raise exception написаны по-русски и предназначены
    // клиенту — показываем как есть, если пришли.
    return { ok: false, error: error.message || "Не удалось отменить заказ. Попробуйте ещё раз." };
  }

  revalidatePath("/account/orders");
  return { ok: true };
}

