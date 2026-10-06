import type { Metadata } from "next";
import Footer from "../components/Footer";
import LoginForm from "./LoginForm";
import PublicHeader from "../components/PublicHeader";
import { getPublicNavState } from "@/lib/auth/publicNav";

export const metadata: Metadata = {
  title: "Вход — Gastromania",
  description: "Вход для гостей и персонала Gastromania.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const nav = await getPublicNavState();
  const { next } = await searchParams;

  return (
    <>
      <main className="bg-[#F5F0E8] min-h-dvh">
        <PublicHeader {...nav} />

        <div className="max-w-screen-xl mx-auto px-8 lg:px-16 py-20 lg:py-28 flex justify-center">
          <div className="w-full max-w-[440px]">
            <div className="mb-10 text-center">
              <span className="label-refined text-[#8C7355] block mb-4">Вход</span>
              <h1 className="heading-editorial text-[#0A0A0A]" style={{ fontSize: "clamp(2rem,4vw,2.75rem)" }}>
                С возвращением
              </h1>
            </div>
            <LoginForm nextPath={typeof next === "string" ? next : undefined} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
