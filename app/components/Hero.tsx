"use client";

import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import Image from "next/image";

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const shouldReduceMotion = useReducedMotion();

  const imageY = useTransform(scrollYProgress, [0, 1], shouldReduceMotion ? ["0%", "0%"] : ["0%", "25%"]);
  const textY = useTransform(scrollYProgress, [0, 1], shouldReduceMotion ? ["0%", "0%"] : ["0%", "12%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative h-screen min-h-[700px] overflow-hidden flex items-end"
    >
      {/* Background Image with Parallax */}
      <motion.div style={{ y: imageY }} className="absolute inset-0 scale-110">
        <Image
          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1800&q=85&auto=format&fit=crop"
          alt="Высокая кухня Gastromania"
          fill
          preload
          sizes="100vw"
          className="object-cover"
        />
        {/* Multi-layer overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/60 via-transparent to-transparent" />
      </motion.div>

      {/* Grain texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      {/* Content */}
      <motion.div
        style={{ y: textY, opacity }}
        className="relative z-10 w-full max-w-screen-xl mx-auto px-8 lg:px-16 pb-20 lg:pb-28"
      >
        <div className="max-w-3xl">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="flex items-center gap-5 mb-8"
          >
            <div className="w-8 h-px bg-[#8C7355]" />
            <span className="label-refined text-[#8C7355]">
              Три звезды Мишлен · Копенгаген
            </span>
          </motion.div>

          {/* Main Headline */}
          <div className="overflow-hidden mb-3">
            <motion.h1
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 1.1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="heading-editorial text-[clamp(4rem,10vw,9rem)] text-[#F5F0E8] leading-none"
            >
              Где
            </motion.h1>
          </div>
          <div className="overflow-hidden mb-3">
            <motion.h1
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 1.1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="heading-editorial italic text-[clamp(4rem,10vw,9rem)] text-[#8C7355] leading-none"
            >
              Ремесло
            </motion.h1>
          </div>
          <div className="overflow-hidden">
            <motion.h1
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 1.1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="heading-editorial text-[clamp(4rem,10vw,9rem)] text-[#F5F0E8] leading-none"
            >
              Становится Искусством
            </motion.h1>
          </div>

          {/* Subtext + CTA row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-8"
          >
            <p
              style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300, letterSpacing: "0.02em" }}
              className="text-[#F5F0E8]/65 text-xl italic max-w-xs"
            >
              Камерное путешествие сквозь сезоны. Восемнадцать гостей, одно вечернее видение.
            </p>
            <div className="flex items-center gap-6">
              <button
                onClick={() => {
                  document.querySelector("#reservation")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="group flex items-center gap-4"
              >
                <span className="label-refined text-[#F5F0E8] group-hover:text-[#8C7355] transition-colors duration-300">
                  Забронировать вечер
                </span>
                <span className="w-8 h-px bg-[#8C7355] group-hover:w-12 transition-all duration-500" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Bottom metadata row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.3 }}
          className="absolute bottom-8 right-8 lg:right-16 flex flex-col items-end gap-1"
        >
          <span className="label-refined text-[#F5F0E8]/30">Дегустационное меню</span>
          <span
            style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300, letterSpacing: "0.1em" }}
            className="text-[#F5F0E8]/50 text-sm"
          >
            18 блюд · 4,5 часа
          </span>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.8 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
      >
        <span className="label-refined text-[#F5F0E8]/25" style={{ fontSize: "0.55rem" }}>
          Скролл
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-8 bg-gradient-to-b from-[#8C7355]/60 to-transparent"
        />
      </motion.div>
    </section>
  );
}
