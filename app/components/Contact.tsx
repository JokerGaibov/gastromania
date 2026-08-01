"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const ease = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

const contactItems = [
  {
    label: "Адрес",
    content: (
      <p style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300 }} className="text-[#F5F0E8]/75 text-xl leading-relaxed">
        Strandgade 93<br />
        Копенгаген K, 1401<br />
        Дания
      </p>
    ),
  },
  {
    label: "Часы работы",
    content: (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="label-refined text-[#F5F0E8]/40 mb-2">Ужин</p>
          <p className="text-[#F5F0E8]/70 text-sm font-body" style={{ letterSpacing: "0.02em" }}>
            Вторник – Субботa<br />19:00 — Один приём
          </p>
        </div>
        <div>
          <p className="label-refined text-[#F5F0E8]/40 mb-2">Кухня</p>
          <p className="text-[#F5F0E8]/70 text-sm font-body" style={{ letterSpacing: "0.02em" }}>
            Закрыто в воскресенье<br />и понедельник
          </p>
        </div>
      </div>
    ),
  },
  {
    label: "Контакты",
    content: (
      <div className="flex flex-col gap-2">
        <a href="mailto:reservations@gastronomia.dk" className="text-[#F5F0E8]/65 hover:text-[#F5F0E8] transition-colors duration-300 text-sm font-body nav-link inline-block w-fit" style={{ letterSpacing: "0.02em" }}>
          reservations@gastronomia.dk
        </a>
        <a href="tel:+4512345678" className="text-[#F5F0E8]/65 hover:text-[#F5F0E8] transition-colors duration-300 text-sm font-body nav-link inline-block w-fit" style={{ letterSpacing: "0.02em" }}>
          +45 12 34 56 78
        </a>
      </div>
    ),
  },
  {
    label: "Мы в соцсетях",
    content: (
      <div className="flex gap-8">
        {["Instagram", "Pinterest"].map((p) => (
          <a key={p} href="#" className="label-refined text-[#F5F0E8]/40 hover:text-[#F5F0E8] transition-colors duration-300 nav-link">{p}</a>
        ))}
      </div>
    ),
    noBorder: true,
  },
];

export default function Contact() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-10%" });

  return (
    <section id="contact" ref={sectionRef} className="bg-[#0A0A0A] border-t border-[rgba(245,240,232,0.08)] py-32 lg:py-48">
      <div className="max-w-screen-xl mx-auto px-8 lg:px-16">

        {/* Top label */}
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, ease }}
          className="flex items-center gap-4 mb-20"
        >
          <div className="w-8 h-px bg-[#8C7355]" />
          <span className="label-refined text-[#8C7355]">Как нас найти</span>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-16 lg:gap-24">

          {/* Large headline */}
          <div className="lg:col-span-5">
            {["Придите.", "Прочувствуйте.", "Запомните."].map((word, i) => (
              <div key={word} className="overflow-hidden mb-1">
                <motion.h2
                  initial={{ y: "100%" }}
                  animate={inView ? { y: "0%" } : {}}
                  transition={{ duration: 1, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                  className={`heading-editorial ${i === 1 ? "italic text-[#8C7355]" : "text-[#F5F0E8]"}`}
                  style={{ fontSize: "clamp(3rem,6vw,5.5rem)", lineHeight: 1 }}
                >
                  {word}
                </motion.h2>
              </div>
            ))}

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.5, ease }}
              style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300, letterSpacing: "0.01em" }}
              className="text-[#F5F0E8]/50 text-xl italic leading-relaxed mt-12"
            >
              Мы не принимаем гостей без бронирования. Каждый вечер — это тщательно выстроенное событие. Мы будем рады видеть вас частью этого.
            </motion.p>
          </div>

          {/* Contact details */}
          <div className="lg:col-span-6 lg:col-start-7 flex flex-col">
            {contactItems.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 25 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease }}
                className={`py-8 ${item.noBorder ? "" : "border-b border-[rgba(245,240,232,0.08)]"}`}
              >
                <span className="label-refined text-[#8C7355] block mb-4">{item.label}</span>
                {item.content}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
