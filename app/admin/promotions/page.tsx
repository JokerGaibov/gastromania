import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { canAccessAdminPanel } from "@/lib/auth/roles";
import ActiveToggle from "./ActiveToggle";
import DeletePromotionButton from "./DeletePromotionButton";
import { PlusIcon, PencilIcon } from "../../components/reservation/icons";

export const metadata: Metadata = {
  title: "Акции — Gastromania",
};

function formatDateRange(startsAt: string | null, endsAt: string | null): string | null {
  if (!startsAt && !endsAt) return null;
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(new Date(iso));
  if (startsAt && endsAt) return `${fmt(startsAt)} — ${fmt(endsAt)}`;
  if (startsAt) return `с ${fmt(startsAt)}`;
  return `до ${fmt(endsAt as string)}`;
}

export default async function AdminPromotionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/promotions");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!canAccessAdminPanel(profile?.role)) redirect("/admin");

  const { data: promotions, error } = await supabase
    .from("promotions")
    .select("id, title, description, image_url, discount_percent, starts_at, ends_at, is_active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("AdminPromotionsPage: failed to load promotions", error);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
        <div>
          <span className="label-refined text-[#8C7355] block mb-2">Персонал</span>
          <h1 className="heading-editorial text-[#0A0A0A]" style={{ fontSize: "clamp(1.75rem,3vw,2.25rem)" }}>
            Акции
          </h1>
        </div>
        <Link
          href="/admin/promotions/new"
          className="inline-flex items-center gap-2 h-11 px-5 rounded-[12px] bg-[#0A0A0A] text-[#F5F0E8] label-refined hover:bg-[#8C7355] transition-colors duration-300 w-fit"
        >
          <span className="w-3.5 h-3.5">
            <PlusIcon />
          </span>
          Добавить акцию
        </Link>
      </div>

      {error && (
        <p className="text-[#B3564A] text-sm font-body mb-8">Не удалось загрузить акции. Обновите страницу.</p>
      )}

      {!error && (promotions ?? []).length === 0 && (
        <p className="text-[#0A0A0A]/45 text-sm font-body">Акций пока нет.</p>
      )}

      <div className="grid gap-4">
        {(promotions ?? []).map((promo) => {
          const dateRange = formatDateRange(promo.starts_at, promo.ends_at);
          return (
            <div
              key={promo.id}
              className="rounded-[18px] border border-[#0A0A0A]/8 bg-white p-5 sm:p-6 shadow-[0_4px_16px_-8px_rgba(10,10,10,0.08)] flex flex-col sm:flex-row sm:items-center gap-5"
            >
              <div className="w-16 h-16 rounded-[12px] bg-[#F5F0E8] overflow-hidden shrink-0">
                {promo.image_url && (
                  <Image
                    src={promo.image_url}
                    alt=""
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[#0A0A0A] font-body font-medium text-[0.9375rem] mb-1">{promo.title}</p>
                {promo.description && (
                  <p className="text-[#0A0A0A]/45 text-xs font-body line-clamp-2">{promo.description}</p>
                )}
                <p className="text-[#8C7355] font-body text-sm mt-1">
                  {promo.discount_percent != null && `−${promo.discount_percent}%`}
                  {promo.discount_percent != null && dateRange && " · "}
                  {dateRange}
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <ActiveToggle id={promo.id} isActive={promo.is_active} />
                <Link
                  href={`/admin/promotions/${promo.id}/edit`}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[#0A0A0A]/40 hover:text-[#0A0A0A] hover:bg-[#0A0A0A]/5 transition-colors duration-300"
                  aria-label={`Редактировать ${promo.title}`}
                >
                  <span className="w-4 h-4">
                    <PencilIcon />
                  </span>
                </Link>
                <DeletePromotionButton id={promo.id} title={promo.title} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
