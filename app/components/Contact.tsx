"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const ease = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

// Real advantages of the location — nothing here is invented, all three
// come directly from the owner (2026-09-12).
const advantages = [
  { label: "Рядом с метро", detail: "Выход из м. Дубровка ведёт прямо к нам" },
  { label: "Отдельный вход", detail: "Через трап, отдельно от ТЦ «Мозаика»" },
  { label: "Собственная парковка", detail: "Для гостей ресторана" },
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

        <div className="grid lg:grid-cols-12 gap-16 lg:gap-24 mb-20 lg:mb-28">

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
              Один из выходов метро «Дубровка» ведёт буквально к нашей двери — отдельный вход через трап,
              без необходимости идти через торговый центр.
            </motion.p>

            {/* Advantage badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.65, ease }}
              className="flex flex-col gap-3 mt-10"
            >
              {advantages.map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8C7355] mt-2 shrink-0" />
                  <div>
                    <span className="label-refined text-[#F5F0E8]/85 block">{item.label}</span>
                    <span className="text-[#F5F0E8]/40 text-xs font-body">{item.detail}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Contact details */}
          <div className="lg:col-span-6 lg:col-start-7 flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2, ease }}
              className="py-8 border-b border-[rgba(245,240,232,0.08)]"
            >
              <span className="label-refined text-[#8C7355] block mb-4">Адрес</span>
              <p style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300 }} className="text-[#F5F0E8]/75 text-xl leading-relaxed">
                Москва, ул. 7-я Кожуховская, 9<br />
                ТЦ «Мозаика»
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3, ease }}
              className="py-8 border-b border-[rgba(245,240,232,0.08)]"
            >
              <span className="label-refined text-[#8C7355] block mb-4">Метро</span>
              <p style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300 }} className="text-[#F5F0E8]/75 text-xl leading-relaxed">
                Дубровка
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4, ease }}
              className="py-8"
            >
              <span className="label-refined text-[#8C7355] block mb-4">Часы работы</span>
              <p className="text-[#F5F0E8]/40 text-sm font-body italic">Уточняется</p>
            </motion.div>
          </div>
        </div>

        {/* Map placeholder — no external map API wired up yet, on purpose:
            no key configured, and pulling one in wasn't necessary for this
            pass. Swapping this block for a real embed later doesn't touch
            anything else on the page. */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, delay: 0.3, ease }}
          className="rounded-[4px] border border-[rgba(245,240,232,0.1)] bg-[#0F0F0D] aspect-[21/9] flex flex-col items-center justify-center gap-3"
        >
          <span className="label-refined text-[#F5F0E8]/25">Карта появится здесь</span>
          <span
            style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300 }}
            className="text-[#F5F0E8]/40 text-lg italic text-center px-8"
          >
            Москва, ул. 7-я Кожуховская, 9, ТЦ «Мозаика» · м. Дубровка
          </span>
        </motion.div>
      </div>
    </section>
  );
}
