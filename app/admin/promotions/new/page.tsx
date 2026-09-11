import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canAccessAdminPanel } from "@/lib/auth/roles";
import PromotionForm from "../PromotionForm";
import { createPromotion } from "../actions";

export const metadata: Metadata = {
  title: "Новая акция — Gastromania",
};

export default async function NewPromotionPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/promotions/new");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!canAccessAdminPanel(profile?.role)) redirect("/admin");

  return (
    <div>
      <span className="label-refined text-[#8C7355] block mb-2">Акции</span>
      <h1 className="heading-editorial text-[#0A0A0A] mb-8" style={{ fontSize: "clamp(1.75rem,3vw,2.25rem)" }}>
        Новая акция
      </h1>
      <PromotionForm onSubmit={createPromotion} submitLabel="Добавить акцию" />
    </div>
  );
}
