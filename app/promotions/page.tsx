import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Акции — Gastromania",
  description: "Текущие акции и предложения ресторана Gastromania.",
};

function formatDateRange(startsAt: string | null, endsAt: string | null): string | null {
  if (!startsAt && !endsAt) return null;
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(new Date(iso));
  if (startsAt && endsAt) return `${fmt(startsAt)} — ${fmt(endsAt)}`;
  if (startsAt) return `с ${fmt(startsAt)}`;
  return `до ${fmt(endsAt as string)}`;
}

export default async function PromotionsPage() {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  // Same "currently live" window as the /admin dashboard's count (is_active
  // plus starts_at/ends_at bounds) — public visitors shouldn't see a promo
  // that's technically active but hasn't started yet or already ended.
  const { data: promotions, error } = await supabase
    .from("promotions")
    .select("id, title, description, image_url, discount_percent, starts_at, ends_at")
    .eq("is_active", true)
    .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
    .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
    .order("created_at", { ascending: false });

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
                Москва · м. Дубровка
              </span>
            </Link>
            <Link href="/" className="label-refined text-[#0A0A0A]/50 hover:text-[#0A0A0A] transition-colors duration-300">
              ← На главную
            </Link>
          </div>
        </header>

        <div className="max-w-screen-xl mx-auto px-8 lg:px-16 py-16 lg:py-20">
          <div className="mb-12">
            <span className="label-refined text-[#8C7355] block mb-3">Акции</span>
            <h1 className="heading-editorial text-[#0A0A0A]" style={{ fontSize: "clamp(2rem,4vw,2.75rem)" }}>
              Текущие предложения
            </h1>
          </div>

          {error && <p className="text-[#B3564A] text-sm font-body">Не удалось загрузить акции. Обновите страницу.</p>}

          {!error && (promotions ?? []).length === 0 && (
            <p className="text-[#0A0A0A]/45 text-sm font-body">Сейчас активных акций нет — загляните позже.</p>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(promotions ?? []).map((promo) => {
              const dateRange = formatDateRange(promo.starts_at, promo.ends_at);
              return (
                <div
                  key={promo.id}
                  className="rounded-[18px] border border-[#0A0A0A]/8 bg-white overflow-hidden shadow-[0_4px_16px_-8px_rgba(10,10,10,0.08)]"
                >
                  <div className="aspect-[4/3] bg-[#F5F0E8] relative">
                    {promo.image_url && <Image src={promo.image_url} alt={promo.title} fill className="object-cover" />}
                    {promo.discount_percent != null && (
                      <span className="absolute top-4 left-4 label-refined bg-[#8C7355] text-white px-3 py-1.5 rounded-full">
                        −{promo.discount_percent}%
                      </span>
                    )}
                  </div>
                  <div className="p-6">
                    <h2 className="heading-editorial text-[#0A0A0A] mb-2" style={{ fontSize: "1.375rem" }}>
                      {promo.title}
                    </h2>
                    {promo.description && (
                      <p className="text-[#0A0A0A]/55 text-sm font-body leading-relaxed mb-3">{promo.description}</p>
                    )}
                    {dateRange && <p className="text-[#0A0A0A]/35 text-xs font-body">{dateRange}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
