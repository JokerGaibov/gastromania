import type { Metadata } from "next";
import { NO_INDEX } from "@/lib/seo";
import Footer from "../components/Footer";
import ForgotPasswordForm from "./ForgotPasswordForm";
import PublicHeader from "../components/PublicHeader";
import { getPublicNavState } from "@/lib/auth/publicNav";

export const metadata: Metadata = {
  title: "Восстановление пароля — Gastromania",
  description: "Запросите ссылку для восстановления пароля от аккаунта Gastromania.",
  robots: NO_INDEX,
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string }>;
}) {
  const nav = await getPublicNavState();
  const { expired } = await searchParams;

  return (
    <>
      <main className="bg-[#F5F0E8] min-h-dvh">
        <PublicHeader {...nav} />

        <div className="max-w-screen-xl mx-auto px-8 lg:px-16 py-20 lg:py-28 flex justify-center">
          <div className="w-full max-w-[440px]">
            <div className="mb-10 text-center">
              <span className="label-refined text-[#8C7355] block mb-4">Восстановление пароля</span>
              <h1 className="heading-editorial text-[#0A0A0A]" style={{ fontSize: "clamp(2rem,4vw,2.75rem)" }}>
                Забыли пароль?
              </h1>
            </div>
            {expired === "1" && (
              <div className="mb-6 rounded-[12px] border border-[#B3564A]/25 bg-[#B3564A]/[0.06] px-4 py-3">
                <p className="text-[#B3564A] text-sm font-body text-center" style={{ letterSpacing: "0.01em" }}>
                  Ссылка недействительна или устарела. Запросите новую ниже.
                </p>
              </div>
            )}
            <ForgotPasswordForm />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
