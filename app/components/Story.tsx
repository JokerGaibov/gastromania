"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";

const ease = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

function FadeUp({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function RevealLine({ delay = 0 }: { delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  return (
    <motion.div
      ref={ref}
      initial={{ scaleX: 0 }}
      animate={inView ? { scaleX: 1 } : {}}
      transition={{ duration: 1.2, delay, ease }}
      className="origin-left h-px w-12 bg-[#8C7355]"
    />
  );
}

export default function Story() {
  const imgRef = useRef<HTMLDivElement>(null);
  const imgInView = useInView(imgRef, { once: true, margin: "-10%" });
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-10%" });

  return (
    <section id="story" className="bg-[#0A0A0A] py-40 lg:py-56 overflow-hidden">
      <div className="max-w-screen-xl mx-auto px-8 lg:px-16">

        {/* Top label row */}
        <div className="flex items-center gap-5 mb-24">
          <RevealLine />
          <FadeUp>
            <span className="label-refined text-[#8C7355]">Наша философия</span>
          </FadeUp>
        </div>

        {/* Two-column editorial layout */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-start">

          {/* Left column — headline */}
          <div className="lg:col-span-6">
            <div className="overflow-hidden mb-2">
              <FadeUp>
                <h2 className="heading-editorial text-[#F5F0E8] leading-none" style={{ fontSize: "clamp(3rem,6vw,5.5rem)" }}>
                  Еда как
                </h2>
              </FadeUp>
            </div>
            <div className="overflow-hidden mb-2">
              <FadeUp delay={0.1}>
                <h2 className="heading-editorial italic text-[#8C7355] leading-none" style={{ fontSize: "clamp(3rem,6vw,5.5rem)" }}>
                  Память,
                </h2>
              </FadeUp>
            </div>
            <div className="overflow-hidden">
              <FadeUp delay={0.2}>
                <h2 className="heading-editorial text-[#F5F0E8] leading-none" style={{ fontSize: "clamp(3rem,6vw,5.5rem)" }}>
                  Ритуал и Место
                </h2>
              </FadeUp>
            </div>
          </div>

          {/* Right column — narrative text */}
          <div className="lg:col-span-5 lg:col-start-8 lg:pt-8">
            <FadeUp delay={0.1}>
              <p
                style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300, letterSpacing: "0.01em" }}
                className="text-[#F5F0E8]/70 text-2xl italic leading-relaxed mb-8"
              >
                &ldquo;Кухня без границ — там, где восточная традиция встречает современную подачу.&rdquo;
              </p>
            </FadeUp>
            <FadeUp delay={0.2}>
              <p
                className="text-[#F5F0E8]/55 text-sm leading-loose mb-8 font-body"
                style={{ letterSpacing: "0.02em" }}
              >
                Gastromania объединяет шеф-поваров, чей профессиональный путь прошёл через Турцию, Катар,
                Объединённые Арабские Эмираты, Оман, Украину и Ирак. Каждый принёс с собой часть своей
                кухонной традиции — вместе они выстраивают меню, которое говорит на языке международного
                гостеприимства.
              </p>
            </FadeUp>
            <FadeUp delay={0.3}>
              <p
                className="text-[#F5F0E8]/55 text-sm leading-loose font-body"
                style={{ letterSpacing: "0.02em" }}
              >
                Мы верим, что современная подача не противоречит традиции, а раскрывает её. Каждое блюдо
                задумано так, чтобы быть одновременно узнаваемым и неожиданным — с вниманием к деталям,
                которое приходит только с большим опытом.
              </p>
            </FadeUp>
          </div>
        </div>

        {/* Cinematic image block */}
        <motion.div
          ref={imgRef}
          initial={{ opacity: 0, y: 60 }}
          animate={imgInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1.2, ease }}
          className="mt-24 lg:mt-32 grid lg:grid-cols-3 gap-px"
        >
          <div className="relative lg:col-span-2 img-zoom aspect-[16/10] overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1600891964092-4316c288032e?w=1200&q=80&auto=format&fit=crop"
              alt="Кухня Gastromania"
              fill
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col gap-px">
            <div className="relative img-zoom flex-1 overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=600&q=80&auto=format&fit=crop"
                alt="Сезонные ингредиенты"
                fill
                sizes="(max-width: 1024px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
            <div className="relative img-zoom flex-1 overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=600&q=80&auto=format&fit=crop"
                alt="Процесс приготовления"
                fill
                sizes="(max-width: 1024px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
          </div>
        </motion.div>

        {/* International presence — real countries our kitchen team has
            worked in (see Chef.tsx bios), not an invented rating/award. No
            fabricated numbers here in place of the old (fictitious)
            Michelin/World's 50 Best claims. */}
        <div className="mt-24 pt-16 border-t border-[rgba(245,240,232,0.08)]">
          <span className="label-refined text-[#F5F0E8]/30 block mb-8">Опыт нашей команды</span>
          <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-16">
            {["Турция", "Катар", "ОАЭ и Оман", "Украина", "Ирак", "Россия"].map((country, i) => (
              <motion.div
                key={country}
                initial={{ opacity: 0, y: 30 }}
                animate={statsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: i * 0.08, ease }}
              >
                <span
                  className="heading-editorial text-[#8C7355] block"
                  style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}
                >
                  {country}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
