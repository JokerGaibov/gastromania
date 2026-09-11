import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { canAccessAdminPanel } from "@/lib/auth/roles";
import OrderStatusControl from "./OrderStatusControl";

export const metadata: Metadata = {
  title: "Заказы — Gastromania",
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  new: "Новые",
  accepted: "Принятые",
  preparing: "Готовятся",
  ready: "Готовы",
  out_for_delivery: "В доставке",
  delivered: "Доставленные",
  cancelled: "Отменённые",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает оплаты",
  paid: "Оплачен",
  failed: "Оплата не прошла",
  refunded: "Возврат",
  cancelled: "Оплата отменена",
};

const FILTERS = [{ value: "", label: "Все" }, ...Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({ value, label }))];

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/orders");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!canAccessAdminPanel(profile?.role)) redirect("/admin");

  let query = supabase
    .from("orders")
    .select(
      "id, created_at, guest_name, guest_phone, guest_email, delivery_address, comment, total_amount, delivery_fee, order_status, payment_status, paid_at, order_items(id, name, unit_price, quantity, subtotal)"
    )
    .order("created_at", { ascending: false });

  if (status) query = query.eq("order_status", status);

  const { data: orders, error } = await query;

  return (
    <div>
      <div className="mb-8">
        <span className="label-refined text-[#8C7355] block mb-2">Персонал</span>
        <h1 className="heading-editorial text-[#0A0A0A]" style={{ fontSize: "clamp(1.75rem,3vw,2.25rem)" }}>
          Заказы
        </h1>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/admin/orders?status=${f.value}` : "/admin/orders"}
            className={`label-refined px-4 py-2 rounded-full border transition-colors duration-300 ${
              (status ?? "") === f.value
                ? "bg-[#0A0A0A] border-[#0A0A0A] text-[#F5F0E8]"
                : "border-[#0A0A0A]/15 text-[#0A0A0A]/60 hover:border-[#8C7355]"
            }`}
            style={{ fontSize: "0.6875rem" }}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {error && <p className="text-[#B3564A] text-sm font-body">Не удалось загрузить заказы. Обновите страницу.</p>}

      {!error && (orders ?? []).length === 0 && (
        <p className="text-[#0A0A0A]/45 text-sm font-body">{status ? "Заказов с этим статусом нет." : "Заказов пока нет."}</p>
      )}

      <div className="grid gap-4">
        {(orders ?? []).map((order) => {
          const subtotal = order.total_amount - order.delivery_fee;
          const isPaid = order.payment_status === "paid";
          return (
            <div
              key={order.id}
              className={`rounded-[18px] border bg-white p-5 sm:p-6 shadow-[0_4px_16px_-8px_rgba(10,10,10,0.08)] ${
                isPaid ? "border-[#0A0A0A]/8" : "border-[#B3564A]/40"
              }`}
            >
              {!isPaid && (
                <div className="rounded-[10px] bg-[#B3564A]/10 px-3 py-2 mb-4">
                  <p className="label-refined text-[#B3564A]" style={{ fontSize: "0.6875rem" }}>
                    {PAYMENT_STATUS_LABELS[order.payment_status] ?? order.payment_status} — не начинать приготовление
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-[#0A0A0A] font-body font-medium text-[0.9375rem] mb-1">
                    {order.guest_name} · № {order.id.slice(0, 8)}
                  </p>
                  <p className="text-[#0A0A0A]/45 text-xs font-body">{formatDateTime(order.created_at)}</p>
                  {isPaid && order.paid_at && (
                    <p className="text-[#3F6B4F]/80 text-xs font-body mt-0.5">Оплачен {formatDateTime(order.paid_at)}</p>
                  )}
                </div>
                <OrderStatusControl id={order.id} orderStatus={order.order_status} paymentStatus={order.payment_status} />
              </div>

              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 mb-4 text-sm font-body">
                <a href={`tel:${order.guest_phone}`} className="text-[#8C7355] underline underline-offset-2">
                  {order.guest_phone}
                </a>
                {order.guest_email && <span className="text-[#0A0A0A]/60">{order.guest_email}</span>}
                <span className="text-[#0A0A0A]/60 sm:col-span-2">{order.delivery_address}</span>
              </div>

              <div className="flex flex-col gap-1 mb-4 border-t border-[#0A0A0A]/8 pt-3">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm font-body text-[#0A0A0A]/70">
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>{item.subtotal} ₽</span>
                  </div>
                ))}
              </div>

              {order.comment && <p className="text-[#0A0A0A]/50 text-sm font-body italic mb-4">«{order.comment}»</p>}

              <div className="flex flex-col gap-1 text-sm font-body border-t border-[#0A0A0A]/8 pt-3">
                <div className="flex justify-between text-[#0A0A0A]/60">
                  <span>Блюда</span>
                  <span>{subtotal} ₽</span>
                </div>
                <div className="flex justify-between text-[#0A0A0A]/60">
                  <span>Доставка</span>
                  <span>{order.delivery_fee} ₽</span>
                </div>
                <div className="flex justify-between text-[#0A0A0A] font-medium">
                  <span>Итого</span>
                  <span>{order.total_amount} ₽</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
