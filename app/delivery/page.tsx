import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Footer from "../components/Footer";
import DeliveryMenuGrid from "./DeliveryMenuGrid";
import CartBar from "./CartBar";

export const metadata: Metadata = {
  title: "Доставка — Gastromania",
  description: "Меню Gastromania на заказ с доставкой.",
};

export default async function DeliveryPage() {
  const supabase = await createClient();

  const [{ data: items, error }, { data: settings }] = await Promise.all([
    supabase
      .from("menu_items")
      .select("id, name, description, price, image_url")
      .eq("category", "delivery")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("delivery_settings")
      .select("is_delivery_enabled, min_order_amount, zones")
      .eq("id", 1)
      .single(),
  ]);

  const deliveryEnabled = settings?.is_delivery_enabled ?? true;
  const zones = Array.isArray(settings?.zones) ? (settings!.zones as string[]) : [];

  return (
    <>
      <main className="bg-[#F5F0E8] min-h-screen pb-28">
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
                Москва · м. Дубровка
              </span>
            </Link>
            <Link
              href="/"
              className="label-refined text-[#0A0A0A]/50 hover:text-[#0A0A0A] transition-colors duration-300"
            >
              ← На главную
            </Link>
          </div>
        </header>

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
      <CartBar />
    </>
  );
}
