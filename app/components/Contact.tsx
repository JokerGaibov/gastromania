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

        {/* gap-24 (96px) только с xl (1280px+), не с lg — на 12-колоночной
            сетке 11 внутренних gap по 96px уже сами по себе шире, чем
            доступная ширина контента на 1024px (частый реальный breakpoint,
            iPad landscape), и вся секция уезжала вправо, создавая
            горизонтальный скролл страницы. gap-16 на диапазоне
            1024–1279px визуально почти не отличается от прежнего. */}
        <div className="grid lg:grid-cols-12 gap-16 xl:gap-24 mb-20 lg:mb-28">

          {/* Large headline. min-w-0: без этого grid-колонка не сжимается
              уже своего содержимого (дефолт min-width:auto у grid-item'ов) —
              «Прочувствуйте.» как один неразрывный кириллический токен
              раздвигал всю секцию и давал горизонтальный скролл страницы
              на 320–375px. */}
          <div className="lg:col-span-5 min-w-0">
            {["Придите.", "Прочувствуйте.", "Запомните."].map((word, i) => (
              <div key={word} className="overflow-hidden mb-1">
                <motion.h2
                  initial={{ y: "100%" }}
                  animate={inView ? { y: "0%" } : {}}
                  transition={{ duration: 1, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                  className={`heading-editorial ${i === 1 ? "italic text-[#8C7355]" : "text-[#F5F0E8]"}`}
                  // Нижняя граница clamp() была 3rem (48px) — на экранах
                  // уже ~600px это и есть фактический размер (6vw ещё
                  // меньше), а "Прочувствуйте." на 48px не помещается в
                  // доступную ширину на 320–375px даже после min-w-0 (слово
                  // просто обрезалось бы). 2.25rem — всё ещё крупный
                  // редакционный заголовок, но укладывается с запасом.
                  // Верхняя граница (5.5rem) и поведение на планшетах/
                  // десктопе не меняются — там 6vw давно больше 2.25rem.
                  style={{ fontSize: "clamp(2.25rem,6vw,5.5rem)", lineHeight: 1 }}
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
              transition={{ duration: 0.8, delay: 0.25, ease }}
              className="py-8 border-b border-[rgba(245,240,232,0.08)]"
            >
              <span className="label-refined text-[#8C7355] block mb-4">Телефон</span>
              <a
                href="tel:+79955552227"
                style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300 }}
                className="text-[#F5F0E8]/75 text-xl leading-relaxed hover:text-[#8C7355] transition-colors duration-300"
              >
                +7 995 555-22-27
              </a>
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
              <p style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300 }} className="text-[#F5F0E8]/75 text-xl leading-relaxed">
                Круглосуточно
              </p>
            </motion.div>
          </div>
        </div>

        {/* Real footage of the route/entrance/parking, replacing the map
            placeholder — no map API key configured, and this is more useful
            than a text box anyway. Only mounts (and only then starts
            fetching video bytes) once this section is actually in view. */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, delay: 0.3, ease }}
          className="relative rounded-[4px] overflow-hidden border border-[rgba(245,240,232,0.1)] bg-[#0F0F0D] aspect-[21/9]"
        >
          {inView && (
            <video
              muted
              autoPlay
              loop
              playsInline
              preload="none"
              poster="/videos/gastromania-directions-poster.jpg"
              className="absolute inset-0 w-full h-full object-cover"
              ref={(el) => { el?.play().catch(() => {}); }}
            >
              <source src="/videos/gastromania-directions.mp4" type="video/mp4" />
            </video>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/80 via-transparent to-transparent" />
          <span
            style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300 }}
            className="absolute bottom-5 left-6 right-6 text-[#F5F0E8]/85 text-lg italic text-center sm:text-left"
          >
            Москва, ул. 7-я Кожуховская, 9, ТЦ «Мозаика» · м. Дубровка
          </span>
        </motion.div>
      </div>
    </section>
  );
}
