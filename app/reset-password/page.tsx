import type { Metadata } from "next";
import Link from "next/link";
import Footer from "../components/Footer";
import { createClient } from "@/lib/supabase/server";
import ResetPasswordForm from "./ResetPasswordForm";
import PublicHeader from "../components/PublicHeader";
import { getPublicNavState } from "@/lib/auth/publicNav";

export const metadata: Metadata = {
  title: "Новый пароль — Gastromania",
  description: "Установите новый пароль для аккаунта Gastromania.",
};

export default async function ResetPasswordPage() {
  const nav = await getPublicNavState();
  // Эта страница достижима только через /auth/confirm (успешный verifyOtp
  // по ссылке восстановления пароля из письма) — та ссылка уже установила
  // настоящую сессию через cookies. Прямой заход сюда без такой сессии
  // (например, старая вкладка, просроченная ссылка) не должен показывать
  // форму смены пароля — нечего менять без активной сессии.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <main className="bg-[#F5F0E8] min-h-dvh">
        <PublicHeader {...nav} />

        <div className="max-w-screen-xl mx-auto px-8 lg:px-16 py-20 lg:py-28 flex justify-center">
          <div className="w-full max-w-[440px]">
            <div className="mb-10 text-center">
              <span className="label-refined text-[#8C7355] block mb-4">Восстановление пароля</span>
              <h1 className="heading-editorial text-[#0A0A0A]" style={{ fontSize: "clamp(2rem,4vw,2.75rem)" }}>
                Новый пароль
              </h1>
            </div>

            {user ? (
              <ResetPasswordForm />
            ) : (
              <div className="w-full rounded-[24px] border border-[#0A0A0A]/8 bg-white shadow-[0_30px_80px_-24px_rgba(10,10,10,0.2)] p-7 sm:p-10 text-center">
                <p className="text-[#0A0A0A]/55 text-sm font-body leading-relaxed mb-6" style={{ letterSpacing: "0.02em" }}>
                  Ссылка недействительна или устарела. Запросите новую.
                </p>
                <Link
                  href="/forgot-password"
                  className="label-refined text-[#8C7355] underline underline-offset-2 hover:text-[#0A0A0A] transition-colors"
                >
                  Запросить новую ссылку
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
