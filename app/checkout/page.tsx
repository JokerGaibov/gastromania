import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Footer from "../components/Footer";
import CheckoutForm from "./CheckoutForm";

export const metadata: Metadata = {
  title: "Оформление заказа — Gastromania",
};

export default async function CheckoutPage() {
  const supabase = await createClient();

  const [{ data: settings }, {
    data: { user },
  }] = await Promise.all([
    supabase
      .from("delivery_settings")
      .select("is_delivery_enabled, min_order_amount, delivery_fee, free_delivery_from")
      .eq("id", 1)
      .single(),
    supabase.auth.getUser(),
  ]);

  let prefillName: string | undefined;
  let prefillEmail: string | undefined;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("full_name, email, phone").eq("id", user.id).single();
    prefillName = profile?.full_name ?? undefined;
    prefillEmail = profile?.email ?? user.email ?? undefined;
  }

  return (
    <>
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
            <Link
              href="/delivery"
              className="label-refined text-[#0A0A0A]/50 hover:text-[#0A0A0A] transition-colors duration-300"
            >
              ← К меню
            </Link>
          </div>
        </header>

        <div className="max-w-screen-xl mx-auto px-8 lg:px-16 py-16 lg:py-20">
          <div className="mb-10">
            <span className="label-refined text-[#8C7355] block mb-3">Доставка</span>
            <h1 className="heading-editorial text-[#0A0A0A]" style={{ fontSize: "clamp(2rem,4vw,2.75rem)" }}>
              Оформление заказа
            </h1>
          </div>

          <CheckoutForm
            settings={{
              isDeliveryEnabled: settings?.is_delivery_enabled ?? true,
              minOrderAmount: settings?.min_order_amount ?? 0,
              deliveryFee: settings?.delivery_fee ?? 0,
              freeDeliveryFrom: settings?.free_delivery_from ?? null,
            }}
            prefillName={prefillName}
            prefillEmail={prefillEmail}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
