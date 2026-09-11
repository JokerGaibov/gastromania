import Link from "next/link";
import LogoutButton from "./LogoutButton";

// Shared chrome for every page under the authorized branch of
// app/admin/layout.tsx. Introduced alongside the first real nested page
// (/admin/reservations, Блок 7.2) — with only the Блок 3 placeholder page,
// each screen owning its own full-page wrapper was fine; with a second real
// page it stopped being fine; hence pulling it up here now instead of
// duplicating header/nav/logout per page.
const NAV_ITEMS = [
  { href: "/admin", label: "Обзор" },
  { href: "/admin/reservations", label: "Брони" },
  { href: "/admin/menu", label: "Меню" },
  { href: "/admin/promotions", label: "Акции" },
  { href: "/admin/delivery", label: "Доставка" },
  // Матчит требование Блока 7.7: manager не должен иметь доступ к
  // /admin/users, поэтому пункт скрыт для всех, кроме role === 'admin'.
  // Сама страница защищена ещё раз на сервере (app/admin/users/page.tsx) —
  // это только про то, чтобы не показывать ссылку в тупик.
  { href: "/admin/users", label: "Пользователи", adminOnly: true },
];

export default function AdminShell({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: string | null;
}) {
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || role === "admin");

  return (
    <div className="bg-[#F5F0E8] min-h-screen">
      <header className="border-b border-[#0A0A0A]/8 bg-white">
        <div className="max-w-screen-xl mx-auto px-6 sm:px-8 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-8 overflow-x-auto">
            <span
              style={{ fontFamily: "var(--font-playfair)", fontWeight: 400, letterSpacing: "0.2em", fontSize: "0.8125rem" }}
              className="text-[#0A0A0A] uppercase shrink-0"
            >
              Gastromania
            </span>
            <nav className="flex items-center gap-6 shrink-0">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="label-refined text-[#0A0A0A]/55 hover:text-[#0A0A0A] transition-colors duration-300"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <LogoutButton />
        </div>
      </header>
      <div className="max-w-screen-xl mx-auto px-6 sm:px-8 py-10 lg:py-14">{children}</div>
    </div>
  );
}
