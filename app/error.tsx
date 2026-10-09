"use client";

import Link from "next/link";
import { useEffect } from "react";

// Граница ошибок для всех маршрутов под корневым layout. Клиентский
// компонент (требование Next.js), поэтому шапка с серверным определением
// сессии здесь недоступна: показываем только имя и действия. Корневой
// layout (шрифты, стили) при этом остаётся на месте.
// Телефон — реальный (см. Contact.tsx / Footer.tsx).
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // Отчёта во внешний сервис пока нет (мониторинг не подключён) — как
    // минимум остаётся в консоли браузера и в логах Vercel по digest.
    console.error(error);
  }, [error]);

  return (
    <main className="bg-[#0A0A0A] min-h-dvh flex flex-col">
      <header className="px-8 lg:px-16 py-8 text-center">
        <Link
          href="/"
          style={{ fontFamily: "var(--font-playfair)", fontWeight: 400, letterSpacing: "0.25em", fontSize: "0.875rem" }}
          className="text-[#F5F0E8] tracking-widest uppercase"
        >
          Gastromania
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="max-w-[560px] text-center">
          <span className="label-refined text-[#8C7355] block mb-6">Что-то пошло не так</span>
          <h1
            className="heading-editorial text-[#F5F0E8] mb-6"
            style={{ fontSize: "clamp(2.25rem,6vw,4rem)" }}
          >
            Страница не <span className="italic text-[#8C7355]">загрузилась</span>
          </h1>
          <p className="text-sm leading-relaxed text-[#F5F0E8]/60 mb-3" style={{ fontFamily: "var(--font-inter)" }}>
            Произошла непредвиденная ошибка. Попробуйте ещё раз, а если она повторится, вернитесь на главную
            или позвоните нам:{" "}
            <a href="tel:+79955552227" className="text-[#F5F0E8] hover:text-[#8C7355] transition-colors duration-300 whitespace-nowrap">
              +7 995 555-22-27
            </a>
            .
          </p>
          {error.digest && (
            <p className="text-xs text-[#F5F0E8]/30 mb-10" style={{ fontFamily: "var(--font-inter)" }}>
              Код ошибки: {error.digest}
            </p>
          )}
          <div className={`flex flex-wrap items-center justify-center gap-4 ${error.digest ? "" : "mt-10"}`}>
            <button
              type="button"
              onClick={() => unstable_retry()}
              className="label-refined bg-[#8C7355] text-[#0A0A0A] rounded-full px-7 py-3.5 hover:bg-[#F5F0E8] transition-colors duration-300"
            >
              Попробовать снова
            </button>
            <Link
              href="/"
              className="label-refined text-[#F5F0E8]/80 border border-[rgba(245,240,232,0.15)] rounded-full px-7 py-3.5 hover:border-[#8C7355] hover:text-[#8C7355] transition-colors duration-300"
            >
              На главную
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
