"use server";

import { createClient } from "@/lib/supabase/server";
import { isRuPhoneComplete, isValidEmail } from "../components/reservation/utils";

export type CheckoutItem = { menuItemId: string; quantity: number };

export type SubmitOrderInput = {
  items: CheckoutItem[];
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  deliveryAddress: string;
  comment: string;
  consentGiven: boolean;
};

export type SubmitOrderResult = { ok: true; orderId: string } | { ok: false; error: string };

// Mirrors the client-side checks in CheckoutForm.tsx, same "не доверяем
// клиенту" principle as reservation/actions.ts — but the real backstop for
// price/total integrity here is create_order() itself (20260911240000),
// which re-reads menu_items and delivery_settings server-side regardless
// of anything checked here.
function validate(input: SubmitOrderInput): string | null {
  if (input.items.length === 0) return "Корзина пуста.";
  if (!input.guestName.trim()) return "Укажите имя.";
  if (!isRuPhoneComplete(input.guestPhone)) return "Укажите номер телефона полностью.";
  if (input.guestEmail.trim() && !isValidEmail(input.guestEmail.trim())) return "Проверьте адрес email.";
  if (!input.deliveryAddress.trim()) return "Укажите адрес доставки.";
  if (!input.consentGiven) return "Нужно согласие на обработку персональных данных.";
  return null;
}

export async function submitOrder(input: SubmitOrderInput): Promise<SubmitOrderResult> {
  const validationError = validate(input);
  if (validationError) return { ok: false, error: validationError };

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("create_order", {
    p_items: input.items.map((i) => ({ menu_item_id: i.menuItemId, quantity: i.quantity })),
    p_guest_name: input.guestName.trim(),
    p_guest_phone: input.guestPhone,
    p_guest_email: input.guestEmail.trim() || null,
    p_delivery_address: input.deliveryAddress.trim(),
    p_comment: input.comment.trim() || null,
  });

  if (error) {
    console.error("submitOrder: create_order RPC failed", error);
    // create_order() raises plain-language exceptions (Russian, meant to
    // be read directly) for every validation failure it owns — minimum
    // order, delivery disabled, unavailable dish, etc. PostgREST surfaces
    // those as error.message verbatim. Anything longer/unfamiliar is a
    // genuine server error and gets the generic fallback instead of a
    // raw Postgres message.
    const message = error.message?.trim();
    return {
      ok: false,
      error: message && message.length < 200 ? message : "Не удалось оформить заказ. Попробуйте ещё раз.",
    };
  }

  return { ok: true, orderId: data as string };
}
