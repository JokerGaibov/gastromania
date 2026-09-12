"use client";

import Link from "next/link";

// Only real, working links — no href="#" placeholders to nowhere.
const legalLinks = [{ label: "Конфиденциальность", href: "/privacy" }];

export default function Footer() {
  return (
    <footer className="bg-[#0A0A0A] border-t border-[rgba(245,240,232,0.06)] py-16">
      <div className="max-w-screen-xl mx-auto px-8 lg:px-16">
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-10">

          {/* Logo */}
          <div className="flex flex-col items-center lg:items-start">
            <span
              style={{ fontFamily: "var(--font-playfair)", fontWeight: 400, letterSpacing: "0.25em", fontSize: "0.875rem" }}
              className="text-[#F5F0E8]/60 uppercase"
            >
              Gastromania
            </span>
            <span
              style={{ fontFamily: "var(--font-inter)", fontWeight: 300, letterSpacing: "0.3em", fontSize: "0.5rem" }}
              className="text-[#8C7355]/60 uppercase mt-1"
            >
              Москва · м. Дубровка
            </span>
          </div>

          {/* Center — location + phone (real, from the owner — 2026-09-12) */}
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="label-refined text-[#F5F0E8]/40">ул. 7-я Кожуховская, 9</span>
            <span className="label-refined text-[#F5F0E8]/25">ТЦ «Мозаика»</span>
            <a
              href="tel:+79955552227"
              className="label-refined text-[#8C7355]/70 hover:text-[#8C7355] transition-colors duration-300 mt-1"
            >
              +7 995 555-22-27
            </a>
          </div>

          {/* Right — Links */}
          <div className="flex gap-8">
            {legalLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="label-refined text-[#F5F0E8]/55 hover:text-[#F5F0E8]/90 transition-colors duration-300"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-[rgba(245,240,232,0.05)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="label-refined text-[#F5F0E8]/18" style={{ fontSize: "0.55rem" }}>
            © {new Date().getFullYear()} Gastromania. Все права защищены.
          </span>
          <span
            style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300, fontStyle: "italic", letterSpacing: "0.04em" }}
            className="text-[#F5F0E8]/18 text-sm"
          >
            Где ремесло становится искусством.
          </span>
        </div>
      </div>
    </footer>
  );
}
