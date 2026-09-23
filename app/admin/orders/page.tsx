import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { canAccessAdminPanel } from "@/lib/auth/roles";
import OrderStatusControl from "./OrderStatusControl";
import PaymentStatusBadge from "./PaymentStatusBadge";
import OrderEditor from "./OrderEditor";
import OrderRevisionHistory, { type OrderRevision, type RevisionItemSnapshot } from "./OrderRevisionHistory";
import { isOrderEditable } from "./constants";

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

const FILTERS = [{ value: "", label: "Все" }, ...Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({ value, label }))];

// Те же статусы в единственном числе — фильтры выше читаются как «Новые»,
// а фраза про конкретный заказ должна читаться как «Новый».
const ORDER_STATUS_SINGULAR: Record<string, string> = {
  new: "Новый",
  accepted: "Принят",
  preparing: "Готовится",
  ready: "Готов",
  out_for_delivery: "В доставке",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

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
      "id, order_number, created_at, guest_name, guest_phone, guest_email, delivery_address, comment, total_amount, delivery_fee, order_status, payment_status, paid_at, paid_amount, pending_balance_amount, order_items(id, menu_item_id, name, unit_price, quantity, subtotal)"
    )
    .order("created_at", { ascending: false });

  if (status) query = query.eq("order_status", status);

  const { data: orders, error } = await query;

  // Активное меню для выбора позиций в редакторе — один запрос на всю
  // страницу, а не по запросу на каждый заказ.
  const { data: menuItems } = await supabase
    .from("menu_items")
    .select("id, name, price, category")
    .eq("is_active", true)
    .order("category")
    .order("name");

  // История правок по всем показанным заказам — тоже одним запросом.
  const orderIds = (orders ?? []).map((o) => o.id);
  const { data: revisionRows } = orderIds.length
    ? await supabase
        .from("order_revisions")
        .select(
          "id, order_id, created_at, reason_code, reason_note, customer_confirmed, old_items, new_items, old_total, new_total, old_comment, new_comment, changed_by_profile:profiles(full_name)"
        )
        .in("order_id", orderIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  const revisionsByOrder = new Map<string, OrderRevision[]>();
  for (const row of revisionRows ?? []) {
    // PostgREST отдаёт embed по FK как объект (many-to-one), но на всякий
    // случай принимаем и массив — иначе одна неожиданная форма ответа
    // уронила бы всю страницу заказов из-за одного имени в истории.
    const rawProfile = row.changed_by_profile as
      | { full_name: string | null }
      | { full_name: string | null }[]
      | null;
    const profile = Array.isArray(rawProfile) ? (rawProfile[0] ?? null) : rawProfile;
    const revision: OrderRevision = {
      id: row.id,
      created_at: row.created_at,
      reason_code: row.reason_code,
      reason_note: row.reason_note,
      customer_confirmed: row.customer_confirmed,
      old_items: (row.old_items ?? []) as RevisionItemSnapshot[],
      new_items: (row.new_items ?? []) as RevisionItemSnapshot[],
      old_total: row.old_total,
      new_total: row.new_total,
      old_comment: row.old_comment,
      new_comment: row.new_comment,
      changed_by_name: profile?.full_name ?? null,
    };
    const list = revisionsByOrder.get(row.order_id) ?? [];
    list.push(revision);
    revisionsByOrder.set(row.order_id, list);
  }

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
          const isPending = order.payment_status === "pending";
          const balance = Number(order.pending_balance_amount ?? 0);
          const revisions = revisionsByOrder.get(order.id) ?? [];
          const editable = isOrderEditable(order.order_status);
          return (
            <div
              key={order.id}
              className={`rounded-[18px] border bg-white overflow-hidden shadow-[0_4px_16px_-8px_rgba(10,10,10,0.08)] ${
                isPaid ? "border-[#0A0A0A]/8" : "border-[#B3564A]/40"
              }`}
            >
              {/* pending gets the loudest possible treatment — a solid
                  full-width banner, not just a badge — per explicit
                  requirement that an unpaid order be unmissable. The other
                  three not-paid states (failed/refunded/cancelled) still
                  block the kitchen the same way (see OrderStatusControl)
                  but aren't "a customer might still pay any second", so a
                  quieter banner in their own badge color is enough. */}
              {isPending && (
                <div className="bg-[#B3564A] px-5 py-3 flex items-center gap-2">
                  <span className="text-white text-sm font-body font-semibold tracking-wide">⚠ НЕ ОПЛАЧЕН</span>
                  <span className="text-white/80 text-xs font-body">— не начинать приготовление</span>
                </div>
              )}
              {!isPaid && !isPending && (
                <div className="bg-[#0A0A0A]/[0.03] border-b border-[#0A0A0A]/8 px-5 py-2.5 flex items-center gap-2 flex-wrap">
                  <PaymentStatusBadge status={order.payment_status} />
                  <span className="text-[#0A0A0A]/50 text-xs font-body">— не начинать приготовление</span>
                </div>
              )}

              {/* Непогашенная разница после согласованной правки оплаченного
                  заказа. Ни возврат, ни доплата не выполняются автоматически —
                  платёжного провайдера нет; это указание сотруднику. */}
              {balance !== 0 && (
                <div className="bg-[#8C7355]/12 border-b border-[#8C7355]/25 px-5 py-3">
                  <p className="text-[#8C7355] text-sm font-body font-medium">
                    {balance < 0
                      ? `Нужно вернуть клиенту ${Math.abs(balance)} ₽`
                      : `Требуется доплата ${balance} ₽`}
                  </p>
                  <p className="text-[#8C7355]/70 text-xs font-body mt-0.5">
                    Заказ изменён после оплаты. Возврат/доплата пока обрабатываются вручную — провайдер не
                    подключён.
                  </p>
                </div>
              )}

              <div className="p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="text-[#0A0A0A] font-body font-medium text-[0.9375rem]">
                        {order.guest_name} · #{order.order_number}
                      </p>
                      {isPaid && <PaymentStatusBadge status={order.payment_status} />}
                    </div>
                    <p className="text-[#0A0A0A]/45 text-xs font-body">{formatDateTime(order.created_at)}</p>
                    {isPaid && order.paid_at && (
                      <p className="text-[#3F6B4F]/80 text-xs font-body mt-0.5">Оплачен {formatDateTime(order.paid_at)}</p>
                    )}
                  </div>
                  <div className="shrink-0">
                    <OrderStatusControl id={order.id} orderStatus={order.order_status} paymentStatus={order.payment_status} />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 mb-4 text-sm font-body">
                  <a href={`tel:${order.guest_phone}`} className="text-[#8C7355] underline underline-offset-2">
                    {order.guest_phone}
                  </a>
                  {order.guest_email && <span className="text-[#0A0A0A]/60 truncate">{order.guest_email}</span>}
                  <span className="text-[#0A0A0A]/60 sm:col-span-2">{order.delivery_address}</span>
                </div>

                <div className="flex flex-col gap-1 mb-4 border-t border-[#0A0A0A]/8 pt-3">
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="flex justify-between gap-3 text-sm font-body text-[#0A0A0A]/70">
                      <span className="min-w-0 truncate">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="shrink-0">{item.subtotal} ₽</span>
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
                  {isPaid && order.paid_amount != null && Number(order.paid_amount) !== order.total_amount && (
                    <div className="flex justify-between text-[#0A0A0A]/45 text-xs">
                      <span>Фактически оплачено</span>
                      <span>{order.paid_amount} ₽</span>
                    </div>
                  )}
                </div>

                {editable ? (
                  <div className="mt-4 pt-3 border-t border-[#0A0A0A]/8">
                    <OrderEditor
                      orderId={order.id}
                      orderNumber={order.order_number}
                      items={(order.order_items ?? []).map((i) => ({
                        id: i.id,
                        menu_item_id: i.menu_item_id,
                        name: i.name,
                        unit_price: i.unit_price,
                        quantity: i.quantity,
                      }))}
                      comment={order.comment}
                      deliveryFee={order.delivery_fee}
                      oldTotal={order.total_amount}
                      paymentStatus={order.payment_status}
                      paidAmount={order.paid_amount}
                      menuItems={menuItems ?? []}
                    />
                  </div>
                ) : (
                  <p className="mt-4 pt-3 border-t border-[#0A0A0A]/8 text-[#0A0A0A]/35 text-xs font-body">
                    Состав заказа в статусе «{ORDER_STATUS_SINGULAR[order.order_status] ?? order.order_status}»
                    уже не редактируется.
                  </p>
                )}

                <OrderRevisionHistory revisions={revisions} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
