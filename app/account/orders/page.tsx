import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Мои заказы — Gastromania",
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  new: "Новый",
  accepted: "Принят",
  preparing: "Готовится",
  ready: "Готов",
  out_for_delivery: "В доставке",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает оплаты",
  paid: "Оплачен",
  failed: "Оплата не прошла",
  refunded: "Возврат выполнен",
  cancelled: "Отменена",
};

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default async function AccountOrdersPage() {
  const supabase = await createClient();

  // RLS (orders_select_own_or_admin / order_items_select_own_or_admin,
  // 20260911230000) already scopes this to the signed-in user's own
  // orders — no extra .eq('profile_id', ...) needed or even possible to
  // get wrong here.
  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      "id, created_at, order_status, payment_status, total_amount, delivery_fee, order_items(id, name, unit_price, quantity, subtotal)"
    )
    .order("created_at", { ascending: false });

  return (
    <main className="bg-[#F5F0E8] min-h-screen">
      <header className="border-b border-[#0A0A0A]/8">
        <div className="max-w-screen-xl mx-auto px-8 lg:px-16 h-20 flex items-center justify-between">
          <Link href="/" className="flex flex-col leading-none">
            <span
              style={{ fontFamily: "var(--font-playfair)", fontWeight: 400, letterSpacing: "0.25em", fontSize: "0.875rem" }}
              className="text-[#0A0A0A] uppercase"
            >
              Gastromania
            </span>
            <span
              style={{ fontFamily: "var(--font-inter)", fontWeight: 300, letterSpacing: "0.3em", fontSize: "0.5rem" }}
              className="text-[#8C7355] uppercase mt-0.5"
            >
              С 2018 года
            </span>
          </Link>
          <Link href="/" className="label-refined text-[#0A0A0A]/50 hover:text-[#0A0A0A] transition-colors duration-300">
            ← На главную
          </Link>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-8 lg:px-16 py-16 lg:py-20">
        <div className="mb-10">
          <span className="label-refined text-[#8C7355] block mb-3">Личный кабинет</span>
          <h1 className="heading-editorial text-[#0A0A0A]" style={{ fontSize: "clamp(2rem,4vw,2.75rem)" }}>
            Мои заказы
          </h1>
        </div>

        {error && <p className="text-[#B3564A] text-sm font-body">Не удалось загрузить заказы. Обновите страницу.</p>}

        {!error && (orders ?? []).length === 0 && (
          <div className="rounded-[24px] border border-[#0A0A0A]/8 bg-white p-10 text-center max-w-md">
            <p className="text-[#0A0A0A]/50 text-sm font-body mb-6">Заказов пока нет.</p>
            <Link href="/delivery" className="label-refined text-[#8C7355] hover:text-[#0A0A0A] transition-colors duration-300">
              Перейти к меню
            </Link>
          </div>
        )}

        <div className="grid gap-5 max-w-2xl">
          {(orders ?? []).map((order) => (
            <div
              key={order.id}
              className="rounded-[20px] border border-[#0A0A0A]/8 bg-white p-6 shadow-[0_4px_16px_-8px_rgba(10,10,10,0.08)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-[#0A0A0A]/40 text-xs font-body">Заказ № {order.id.slice(0, 8)}</p>
                  <p className="text-[#0A0A0A]/40 text-xs font-body">{formatDateTime(order.created_at)}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="label-refined px-3 py-1 rounded-full bg-[#0A0A0A]/5 text-[#0A0A0A]/70" style={{ fontSize: "0.625rem" }}>
                    {ORDER_STATUS_LABELS[order.order_status] ?? order.order_status}
                  </span>
                  <span
                    className={`label-refined px-3 py-1 rounded-full ${
                      order.payment_status === "paid" ? "bg-[#3F6B4F]/10 text-[#3F6B4F]" : "bg-[#B3564A]/10 text-[#B3564A]"
                    }`}
                    style={{ fontSize: "0.625rem" }}
                  >
                    {PAYMENT_STATUS_LABELS[order.payment_status] ?? order.payment_status}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 mb-4">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm font-body text-[#0A0A0A]/70">
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>{item.subtotal} ₽</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between text-[#0A0A0A] font-medium text-sm font-body pt-3 border-t border-[#0A0A0A]/8">
                <span>Итого</span>
                <span>{order.total_amount} ₽</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
