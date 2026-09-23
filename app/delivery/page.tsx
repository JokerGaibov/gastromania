import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Footer from "../components/Footer";
import DeliveryMenuGrid from "./DeliveryMenuGrid";
import CartBar from "./CartBar";
import PublicHeader from "../components/PublicHeader";
import { getPublicNavState } from "@/lib/auth/publicNav";

export const metadata: Metadata = {
  title: "Доставка — Gastromania",
  description: "Меню Gastromania на заказ с доставкой.",
};

export default async function DeliveryPage() {
  const nav = await getPublicNavState();
  const supabase = await createClient();

  const [{ data: items, error }, { data: settings }] = await Promise.all([
    // Категория блюда («узбекский», «фирменные блюда», десерты…) больше
    // не решает, возим ли мы его — за это отвечает отдельный флаг
    // available_for_delivery (20260923100000). is_active остаётся
    // стоп-листом и сильнее флага: снятое с продажи блюдо здесь не
    // появится, даже если оно помечено доступным для доставки.
    supabase
      .from("menu_items")
      .select("id, name, description, price, image_url")
      .eq("available_for_delivery", true)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("delivery_settings")
      .select("is_delivery_enabled, min_order_amount, delivery_fee, free_delivery_from, zones")
      .eq("id", 1)
      .single(),
  ]);

  const deliveryEnabled = settings?.is_delivery_enabled ?? true;
  const zones = Array.isArray(settings?.zones) ? (settings!.zones as string[]) : [];

  return (
    <>
      <main className="bg-[#F5F0E8] min-h-screen pb-28">
        <PublicHeader {...nav} />

        <div className="max-w-screen-xl mx-auto px-8 lg:px-16 py-16 lg:py-20">
          <div className="mb-10">
            <span className="label-refined text-[#8C7355] block mb-3">Доставка</span>
            <h1 className="heading-editorial text-[#0A0A0A] mb-4" style={{ fontSize: "clamp(2rem,4vw,2.75rem)" }}>
              Меню на заказ
            </h1>
            {zones.length > 0 && (
              <p className="text-[#0A0A0A]/45 text-sm font-body">Доставляем: {zones.join(", ")}</p>
            )}
            {settings && (
              <p className="text-[#0A0A0A]/45 text-sm font-body">
                Минимальный заказ — {settings.min_order_amount} ₽
              </p>
            )}
          </div>

          {!deliveryEnabled && (
            <div className="rounded-[16px] border border-[#B3564A]/25 bg-[#B3564A]/[0.06] px-5 py-4 mb-10">
              <p className="text-[#B3564A] text-sm font-body">
                Доставка сейчас недоступна. Загляните позже или забронируйте столик в зале.
              </p>
            </div>
          )}

          {error && (
            <p className="text-[#B3564A] text-sm font-body">Не удалось загрузить меню. Обновите страницу.</p>
          )}

          {!error && (items ?? []).length === 0 && (
            <p className="text-[#0A0A0A]/45 text-sm font-body">Меню на доставку скоро появится.</p>
          )}

          {!error && deliveryEnabled && (items ?? []).length > 0 && <DeliveryMenuGrid items={items!} />}
        </div>
      </main>
      <Footer />
      <CartBar
        settings={{
          deliveryFee: settings?.delivery_fee ?? 0,
          freeDeliveryFrom: settings?.free_delivery_from ?? null,
          minOrderAmount: settings?.min_order_amount ?? 0,
        }}
      />
    </>
  );
}
