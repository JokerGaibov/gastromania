import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { canAccessAdminPanel } from "@/lib/auth/roles";
import { MENU_CATEGORIES } from "./constants";
import StopListToggle from "./StopListToggle";
import DeleteMenuItemButton from "./DeleteMenuItemButton";
import { PlusIcon, PencilIcon } from "../../components/reservation/icons";

export const metadata: Metadata = {
  title: "Меню — Gastromania",
};

export default async function AdminMenuPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/menu");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!canAccessAdminPanel(profile?.role)) redirect("/admin");

  // menu_public_read allows admin to see inactive rows too (originally via
  // is_staff() in 20260911160000, now is_admin() — see 20260911220000)
  // — without that, staff couldn't find 86'd items to take them back off
  // the stop-list.
  const { data: items, error } = await supabase
    .from("menu_items")
    .select("id, name, description, price, category, image_url, is_active, sort_order")
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("AdminMenuPage: failed to load menu_items", error);
  }

  const grouped = MENU_CATEGORIES.map((c) => ({
    ...c,
    items: (items ?? []).filter((i) => i.category === c.value),
  }));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
        <div>
          <span className="label-refined text-[#8C7355] block mb-2">Персонал</span>
          <h1 className="heading-editorial text-[#0A0A0A]" style={{ fontSize: "clamp(1.75rem,3vw,2.25rem)" }}>
            Меню
          </h1>
        </div>
        <Link
          href="/admin/menu/new"
          className="inline-flex items-center gap-2 h-11 px-5 rounded-[12px] bg-[#0A0A0A] text-[#F5F0E8] label-refined hover:bg-[#8C7355] transition-colors duration-300 w-fit"
        >
          <span className="w-3.5 h-3.5">
            <PlusIcon />
          </span>
          Добавить блюдо
        </Link>
      </div>

      {error && (
        <p className="text-[#B3564A] text-sm font-body mb-8">Не удалось загрузить меню. Обновите страницу.</p>
      )}

      {!error && (items ?? []).length === 0 && (
        <p className="text-[#0A0A0A]/45 text-sm font-body">Меню пока пустое.</p>
      )}

      <div className="flex flex-col gap-12">
        {grouped.map((group) =>
          group.items.length === 0 ? null : (
            <div key={group.value}>
              <h2 className="label-refined text-[#0A0A0A]/40 mb-4">{group.label}</h2>
              <div className="grid gap-4">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-[18px] border bg-white p-5 sm:p-6 shadow-[0_4px_16px_-8px_rgba(10,10,10,0.08)] flex flex-col sm:flex-row sm:items-center gap-5 ${
                      item.is_active ? "border-[#0A0A0A]/8" : "border-[#B3564A]/25"
                    }`}
                  >
                    <div className="w-16 h-16 rounded-[12px] bg-[#F5F0E8] overflow-hidden shrink-0">
                      {item.image_url && (
                        <Image
                          src={item.image_url}
                          alt=""
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[#0A0A0A] font-body font-medium text-[0.9375rem] mb-1">{item.name}</p>
                      {item.description && (
                        <p className="text-[#0A0A0A]/45 text-xs font-body line-clamp-2">{item.description}</p>
                      )}
                      <p className="text-[#8C7355] font-body text-sm mt-1">{item.price} ₽</p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <StopListToggle id={item.id} isActive={item.is_active} />
                      <Link
                        href={`/admin/menu/${item.id}/edit`}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-[#0A0A0A]/40 hover:text-[#0A0A0A] hover:bg-[#0A0A0A]/5 transition-colors duration-300"
                        aria-label={`Редактировать ${item.name}`}
                      >
                        <span className="w-4 h-4">
                          <PencilIcon />
                        </span>
                      </Link>
                      <DeleteMenuItemButton id={item.id} name={item.name} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
