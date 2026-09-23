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

export type RepeatOrderLine = {
  menuItemId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
};

export type RepeatOrderResult =
  | { ok: true; lines: RepeatOrderLine[]; unavailable: string[] }
  | { ok: false; error: string };

// Готовит состав для повторного заказа — НЕ создаёт заказ. Возвращает то,
// что можно положить в корзину сейчас, и список позиций, которые повторить
// нельзя. Дальше клиент сам проходит обычный checkout.
//
// Цены берутся текущие из menu_items, а не старые unit_price из
// order_items: повторять прошлогоднюю цену нельзя, а create_order() всё
// равно пересчитает всё по menu_items — расхождение только сбивало бы с
// толку ещё в корзине.
export async function prepareRepeatOrder(orderId: string): Promise<RepeatOrderResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Требуется вход." };

  // RLS (order_items_select_own_or_admin) сама ограничивает выборку своими
  // заказами — чужой orderId просто вернёт пустой список.
  const { data: items, error } = await supabase
    .from("order_items")
    .select("menu_item_id, name, quantity")
    .eq("order_id", orderId);

  if (error) {
    console.error("prepareRepeatOrder: select order_items failed", error);
    return { ok: false, error: "Не удалось загрузить состав заказа." };
  }
  if (!items || items.length === 0) {
    return { ok: false, error: "Состав заказа недоступен." };
  }

  const menuItemIds = items.map((i) => i.menu_item_id).filter((id): id is string => !!id);

  // menu_public_read показывает обычному пользователю только is_active =
  // true, поэтому снятое с продажи блюдо сюда просто не попадёт. Флаг
  // доставки проверяем явно — те же условия, что и в create_order().
  const { data: currentItems } = menuItemIds.length
    ? await supabase
        .from("menu_items")
        .select("id, name, price, image_url")
        .in("id", menuItemIds)
        .eq("is_active", true)
        .eq("available_for_delivery", true)
    : { data: [] };

  const byId = new Map((currentItems ?? []).map((m) => [m.id, m]));

  const lines: RepeatOrderLine[] = [];
  const unavailable: string[] = [];

  for (const item of items) {
    // menu_item_id = null означает, что блюдо удалили из меню совсем
    // (order_items.menu_item_id → on delete set null) — повторить нечего.
    const current = item.menu_item_id ? byId.get(item.menu_item_id) : undefined;
    if (!current) {
      unavailable.push(item.name);
      continue;
    }
    lines.push({
      menuItemId: current.id,
      name: current.name,
      price: current.price,
      imageUrl: current.image_url,
      quantity: item.quantity,
    });
  }

  return { ok: true, lines, unavailable };
}
