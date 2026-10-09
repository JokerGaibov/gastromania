import Link from "next/link";
import Footer from "./components/Footer";
import PublicHeader from "./components/PublicHeader";
import { getPublicNavState } from "@/lib/auth/publicNav";

// Глобальная 404. Next.js сам отдаёт статус 404 и добавляет noindex.
// Шапка та же, что на остальных публичных страницах, чтобы посетитель не
// оказался в тупике: отсюда можно уйти и на главную, и в доставку, и в акции.
export default async function NotFound() {
  const nav = await getPublicNavState();

  return (
    <>
      <main className="bg-[#0A0A0A] min-h-dvh flex flex-col">
        <PublicHeader {...nav} />

        <div className="flex-1 flex items-center justify-center px-8 py-20 lg:py-28">
          <div className="max-w-[680px] text-center">
            <span className="label-refined text-[#8C7355] block mb-6">Ошибка 404</span>
            <h1
              className="heading-editorial text-[#F5F0E8] mb-6"
              style={{ fontSize: "clamp(2.25rem,6vw,4rem)" }}
            >
              Такой страницы <span className="italic text-[#8C7355]">нет</span>
            </h1>
            <p className="text-sm leading-relaxed text-[#F5F0E8]/60 mb-10" style={{ fontFamily: "var(--font-inter)" }}>
              Возможно, ссылка устарела или адрес набран с ошибкой. Вернитесь на главную: там бронирование
              столика, доставка и текущие акции.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/"
                className="label-refined bg-[#8C7355] text-[#0A0A0A] rounded-full px-7 py-3.5 hover:bg-[#F5F0E8] transition-colors duration-300"
              >
                На главную
              </Link>
              <Link
                href="/delivery"
                className="label-refined text-[#F5F0E8]/80 border border-[rgba(245,240,232,0.15)] rounded-full px-7 py-3.5 hover:border-[#8C7355] hover:text-[#8C7355] transition-colors duration-300"
              >
                Доставка
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
