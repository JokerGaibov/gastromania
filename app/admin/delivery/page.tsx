import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canAccessAdminPanel } from "@/lib/auth/roles";
import DeliveryForm from "./DeliveryForm";

export const metadata: Metadata = {
  title: "Доставка — Gastromania",
};

export default async function AdminDeliveryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/delivery");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!canAccessAdminPanel(profile?.role)) redirect("/admin");

  const { data: settings, error } = await supabase
    .from("delivery_settings")
    .select("is_delivery_enabled, min_order_amount, delivery_fee, free_delivery_from, kitchen_opens, kitchen_closes, zones")
    .eq("id", 1)
    .single();

  return (
    <div>
      <span className="label-refined text-[#8C7355] block mb-2">Персонал</span>
      <h1 className="heading-editorial text-[#0A0A0A] mb-8" style={{ fontSize: "clamp(1.75rem,3vw,2.25rem)" }}>
        Доставка
      </h1>

      {error || !settings ? (
        <p className="text-[#B3564A] text-sm font-body">
          Не удалось загрузить настройки доставки. Обновите страницу.
        </p>
      ) : (
        <DeliveryForm
          initial={{
            isDeliveryEnabled: settings.is_delivery_enabled,
            minOrderAmount: String(settings.min_order_amount),
            deliveryFee: String(settings.delivery_fee),
            freeDeliveryFrom: settings.free_delivery_from != null ? String(settings.free_delivery_from) : "",
            kitchenOpens: (settings.kitchen_opens ?? "11:00").slice(0, 5),
            kitchenCloses: (settings.kitchen_closes ?? "22:00").slice(0, 5),
            zones: Array.isArray(settings.zones) ? (settings.zones as string[]) : [],
          }}
        />
      )}
    </div>
  );
}
