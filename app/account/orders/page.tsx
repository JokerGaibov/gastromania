import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PublicHeader from "../../components/PublicHeader";
import { getPublicNavState } from "@/lib/auth/publicNav";
import OrdersTabs, { type AccountOrder } from "./OrdersTabs";

export const metadata: Metadata = {
  title: "Мои заказы — Gastromania",
};

export default async function AccountOrdersPage() {
  const nav = await getPublicNavState();
  const supabase = await createClient();

  // RLS (orders_select_own_or_admin / order_items_select_own_or_admin,
  // 20260911230000) already scopes this to the signed-in user's own
  // orders — no extra .eq('profile_id', ...) needed or even possible to
  // get wrong here. Сортировка от новых к старым — история в ТЗ требует
  // именно такого порядка, актуальным он тоже подходит.
  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, created_at, order_status, payment_status, total_amount, delivery_fee, delivery_address, comment, order_items(id, name, unit_price, quantity, subtotal)"
    )
    .order("created_at", { ascending: false });

  // Какие заказы ресторан правил по согласованию. RLS
  // order_revisions_select_own_or_admin (20260919100000) отдаёт клиенту
  // только ревизии его собственных заказов, поэтому отдельная фильтрация
  // здесь не нужна. Нужен только факт наличия правок, не их содержимое.
  const { data: revisions } = await supabase.from("order_revisions").select("order_id");
  const revisedOrderIds = new Set((revisions ?? []).map((r) => r.order_id));

  const accountOrders: AccountOrder[] = (orders ?? []).map((order) => ({
    id: order.id,
    order_number: order.order_number,
    created_at: order.created_at,
    order_status: order.order_status,
    payment_status: order.payment_status,
    total_amount: order.total_amount,
    delivery_fee: order.delivery_fee,
    delivery_address: order.delivery_address,
    comment: order.comment,
    was_revised: revisedOrderIds.has(order.id),
    items: order.order_items ?? [],
  }));

  return (
    <main className="bg-[#F5F0E8] min-h-screen">
      <PublicHeader {...nav} />

      <div className="max-w-screen-xl mx-auto px-8 lg:px-16 py-16 lg:py-20">
        <div className="mb-10">
          <span className="label-refined text-[#8C7355] block mb-3">Личный кабинет</span>
          <h1 className="heading-editorial text-[#0A0A0A]" style={{ fontSize: "clamp(2rem,4vw,2.75rem)" }}>
            Мои заказы
          </h1>
        </div>

        {error && <p className="text-[#B3564A] text-sm font-body">Не удалось загрузить заказы. Обновите страницу.</p>}

        {!error && accountOrders.length === 0 && (
          <div className="rounded-[24px] border border-[#0A0A0A]/8 bg-white p-10 text-center max-w-md">
            <p className="text-[#0A0A0A]/50 text-sm font-body mb-6">Заказов пока нет.</p>
            <Link href="/delivery" className="label-refined text-[#8C7355] hover:text-[#0A0A0A] transition-colors duration-300">
              Перейти к меню
            </Link>
          </div>
        )}

        {!error && accountOrders.length > 0 && <OrdersTabs orders={accountOrders} />}
      </div>
    </main>
  );
}
