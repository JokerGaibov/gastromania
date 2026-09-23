import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Footer from "../components/Footer";
import CheckoutForm from "./CheckoutForm";
import PublicHeader from "../components/PublicHeader";
import { getPublicNavState } from "@/lib/auth/publicNav";

export const metadata: Metadata = {
  title: "Оформление заказа — Gastromania",
};

export default async function CheckoutPage() {
  const nav = await getPublicNavState();
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
        <PublicHeader {...nav} />

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
