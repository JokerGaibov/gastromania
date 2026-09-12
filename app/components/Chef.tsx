"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const ease = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

// No real photos yet (2026-09-12) — see gastromania-tasks.md. Deliberately
// not using a stock/AI portrait in their place: showing a photo that isn't
// really them would be worse than showing none. The slot below keeps the
// exact proportions a real <Image fill> will need, so adding one later is
// a one-element swap, not a layout change.
const team = [
  {
    name: "Рюстем Умидович",
    role: "Шеф-повар / помощник шефа",
    detail: "Работает вместе с Эргюном Даи",
  },
  {
    name: "Хайри Алпарслан",
    role: "Специалист по кебабам",
    detail: "Опыт работы с ресторанной сетью Kolcuoğlu",
  },
  {
    name: "Абдулла Сезгин",
    role: "Шеф-кондитер",
    detail: "Десерты и пахлава · опыт работы в Турции и за рубежом",
  },
];

export default function Chef() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const teamRef = useRef<HTMLDivElement>(null);

  const textInView = useInView(textRef, { once: true, margin: "-10%" });
  const imageInView = useInView(imageRef, { once: true, margin: "-10%" });
  const videoInView = useInView(videoRef, { once: true, margin: "-10%" });
  const teamInView = useInView(teamRef, { once: true, margin: "-10%" });

  return (
    <section id="chef" ref={sectionRef} className="bg-[#F5F0E8] overflow-hidden">
      <div className="max-w-screen-xl mx-auto">

        {/* Full-bleed editorial layout */}
        <div className="grid lg:grid-cols-2 min-h-[90vh]">

          {/* Left — photo slot placeholder. Replace this whole <div> with a
              <MotionImage fill .../> (see Chef.tsx git history before this
              rewrite for the exact pattern) once a real portrait exists —
              the parent grid/aspect proportions already match. */}
          <div ref={imageRef} className="relative overflow-hidden bg-[#1C1C1C] lg:min-h-[90vh] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={imageInView ? { opacity: 1 } : {}}
              transition={{ duration: 1.2 }}
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                backgroundSize: "200px 200px",
              }}
            />
            <motion.span
              initial={{ opacity: 0, scale: 0.92 }}
              animate={imageInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 1.2, ease }}
              className="heading-editorial text-[#F5F0E8]/[0.06] select-none"
              style={{ fontSize: "clamp(10rem, 22vw, 20rem)", lineHeight: 1 }}
            >
              ЭД
            </motion.span>

            {/* Floating name badge, same position a photo caption would use */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={imageInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.4 }}
              className="absolute bottom-12 left-12 z-10"
            >
              <span className="label-refined text-[#8C7355] block mb-2">Шеф-повар</span>
              <h3 className="heading-editorial text-[#F5F0E8]" style={{ fontSize: "clamp(2rem, 3vw, 2.75rem)" }}>
                Эргюн Даи
              </h3>
            </motion.div>
          </div>

          {/* Right — Text */}
          <div
            ref={textRef}
            className="bg-[#F5F0E8] flex flex-col justify-center px-12 lg:px-20 py-20 lg:py-32"
          >
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={textInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex items-center gap-4 mb-12"
            >
              <div className="w-8 h-px bg-[#8C7355]" />
              <span className="label-refined text-[#8C7355]">Шеф-повар Gastromania</span>
            </motion.div>

            {/* Headline */}
            <div className="overflow-hidden mb-2">
              <motion.h2
                initial={{ y: "100%" }}
                animate={textInView ? { y: "0%" } : {}}
                transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="heading-editorial text-[#0A0A0A]"
                style={{ fontSize: "clamp(2.5rem,5vw,4.5rem)", lineHeight: 1 }}
              >
                От Стамбула
              </motion.h2>
            </div>
            <div className="overflow-hidden mb-2">
              <motion.h2
                initial={{ y: "100%" }}
                animate={textInView ? { y: "0%" } : {}}
                transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="heading-editorial italic text-[#8C7355]"
                style={{ fontSize: "clamp(2.5rem,5vw,4.5rem)", lineHeight: 1 }}
              >
                до Москвы —
              </motion.h2>
            </div>
            <div className="overflow-hidden mb-12">
              <motion.h2
                initial={{ y: "100%" }}
                animate={textInView ? { y: "0%" } : {}}
                transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="heading-editorial text-[#0A0A0A]"
                style={{ fontSize: "clamp(2.5rem,5vw,4.5rem)", lineHeight: 1 }}
              >
                путь через весь мир
              </motion.h2>
            </div>

            {/* Bio — real text from the owner, unedited beyond paragraph breaks */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={textInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.5 }}
            >
              <p
                className="text-[#0A0A0A]/55 text-sm leading-loose mb-6 font-body"
                style={{ letterSpacing: "0.02em" }}
              >
                Мой профессиональный путь начался в Турции, в ресторане S CAFE, после чего я продолжил
                работу в отелях Dedeman в Стамбуле. Далее моя карьера развивалась уже на международном
                уровне: я работал шеф-поваром ресторана Grande в Катаре, возглавлял кухню ресторанной
                группы Simitçi Dünyası в Дубае и Омане, в течение четырёх лет был шеф-поваром ресторана
                HANEDAN в Украине, а затем продолжил работу в Ираке, в ресторане Papesedo.
              </p>
              <p
                className="text-[#0A0A0A]/55 text-sm leading-loose font-body"
                style={{ letterSpacing: "0.02em" }}
              >
                С 2025 года я продолжаю свой профессиональный путь в Москве, в Gastromania, развивая
                кухню ресторана вместе со своей командой.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Real kitchen footage — a cinematic break before the team grid.
            Only mounts (and only then fetches video bytes) once in view. */}
        <div ref={videoRef} className="relative w-full aspect-[21/9] lg:aspect-[32/9] overflow-hidden bg-[#1C1C1C]">
          {videoInView && (
            <video
              muted
              autoPlay
              loop
              playsInline
              preload="none"
              poster="/videos/gastromania-kitchen-poster.jpg"
              className="absolute inset-0 w-full h-full object-cover"
              ref={(el) => { el?.play().catch(() => {}); }}
            >
              <source src="/videos/gastromania-kitchen.mp4" type="video/mp4" />
            </video>
          )}
        </div>

        {/* Kitchen team */}
        <div ref={teamRef} className="px-8 lg:px-16 py-24 lg:py-32 border-t border-[#0A0A0A]/8">
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={teamInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="flex items-center gap-4 mb-16"
          >
            <div className="w-8 h-px bg-[#8C7355]" />
            <span className="label-refined text-[#8C7355]">Команда кухни</span>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-8 lg:gap-12 mb-20">
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 30 }}
                animate={teamInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: i * 0.1, ease }}
                className="border-t border-[#0A0A0A]/15 pt-6"
              >
                <h3 className="heading-editorial text-[#0A0A0A] mb-2" style={{ fontSize: "1.5rem" }}>
                  {member.name}
                </h3>
                <span className="label-refined text-[#8C7355] block mb-3">{member.role}</span>
                <p className="text-[#0A0A0A]/50 text-sm font-body leading-relaxed">{member.detail}</p>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={teamInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.4, ease }}
            style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300 }}
            className="text-[#0A0A0A]/70 text-2xl lg:text-3xl italic text-center leading-snug"
          >
            Международный опыт. Восточная традиция. Современная Gastromania.
          </motion.p>
        </div>
      </div>
    </section>
  );
}
