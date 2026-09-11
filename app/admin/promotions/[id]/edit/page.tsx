import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canAccessAdminPanel } from "@/lib/auth/roles";
import PromotionForm from "../../PromotionForm";
import { updatePromotion } from "../../actions";

export const metadata: Metadata = {
  title: "Редактирование акции — Gastromania",
};

export default async function EditPromotionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/admin/promotions/${id}/edit`);

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!canAccessAdminPanel(profile?.role)) redirect("/admin");

  const { data: promo } = await supabase
    .from("promotions")
    .select("id, title, description, image_url, discount_percent, starts_at, ends_at, is_active")
    .eq("id", id)
    .single();

  if (!promo) notFound();

  const boundUpdate = updatePromotion.bind(null, id);

  return (
    <div>
      <span className="label-refined text-[#8C7355] block mb-2">Акции</span>
      <h1 className="heading-editorial text-[#0A0A0A] mb-8" style={{ fontSize: "clamp(1.75rem,3vw,2.25rem)" }}>
        {promo.title}
      </h1>
      <PromotionForm
        initial={{
          title: promo.title,
          description: promo.description ?? "",
          imageUrl: promo.image_url ?? "",
          discountPercent: promo.discount_percent != null ? String(promo.discount_percent) : "",
          startsAt: promo.starts_at ? promo.starts_at.slice(0, 10) : "",
          endsAt: promo.ends_at ? promo.ends_at.slice(0, 10) : "",
          isActive: promo.is_active,
        }}
        onSubmit={boundUpdate}
        submitLabel="Сохранить изменения"
      />
    </div>
  );
}
