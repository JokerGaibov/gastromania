import type { Metadata } from "next";
import Link from "next/link";
import Footer from "../components/Footer";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Вход — Gastromania",
  description: "Вход для гостей и персонала Gastromania.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <>
      <main className="bg-[#F5F0E8] min-h-screen">
        {/* Minimal page header — same pattern as /privacy: this isn't the
            marketing Navigation, its section links assume homepage anchors
            that don't exist here. */}
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
                С 2018 года
              </span>
            </Link>
            <Link
              href="/"
              className="label-refined text-[#0A0A0A]/50 hover:text-[#0A0A0A] transition-colors duration-300"
            >
              ← На главную
            </Link>
          </div>
        </header>

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
