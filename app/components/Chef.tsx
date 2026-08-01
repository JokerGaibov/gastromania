"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform, useReducedMotion } from "framer-motion";
import Image from "next/image";

const MotionImage = motion.create(Image);

export default function Chef() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  const textInView = useInView(textRef, { once: true, margin: "-10%" });
  const imageInView = useInView(imageRef, { once: true, margin: "-10%" });

  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], shouldReduceMotion ? ["0%", "0%"] : ["-6%", "6%"]);

  return (
    <section id="chef" ref={sectionRef} className="bg-[#F5F0E8] overflow-hidden">
      <div className="max-w-screen-xl mx-auto">

        {/* Full-bleed editorial layout */}
        <div className="grid lg:grid-cols-2 min-h-[90vh]">

          {/* Left — Portrait */}
          <div ref={imageRef} className="relative overflow-hidden bg-[#1C1C1C] lg:min-h-[90vh]">
            <motion.div
              style={{ y: imgY }}
              className="absolute inset-0 scale-110"
            >
              <MotionImage
                initial={{ scale: 1.1, opacity: 0 }}
                animate={imageInView ? { scale: 1, opacity: 1 } : {}}
                transition={{ duration: 1.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                src="https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=900&q=85&auto=format&fit=crop&crop=face"
                alt="Шеф-повар — Gastromania"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1C1C1C]/80 via-transparent to-transparent" />
            </motion.div>

            {/* Floating name badge on image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={imageInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.6 }}
              className="absolute bottom-12 left-12 z-10"
            >
              <span className="label-refined text-[#8C7355] block mb-2">Шеф-повар</span>
              <h3
                className="heading-editorial text-[#F5F0E8]"
                style={{ fontSize: "clamp(2rem, 3vw, 2.75rem)" }}
              >
                Элара Восс
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
              <span className="label-refined text-[#8C7355]">Визионер</span>
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
                Обучалась в
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
                Токио и Лионе,
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
                с корнями на Севере
              </motion.h2>
            </div>

            {/* Bio */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={textInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.5 }}
            >
              <p
                style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300, letterSpacing: "0.01em" }}
                className="text-[#0A0A0A]/60 text-xl italic leading-relaxed mb-6"
              >
                &ldquo;Я не гонюсь за совершенством. Я гонюсь за честностью. Хорошо выращенный ингредиент почти не нуждается во мне.&rdquo;
              </p>
              <p
                className="text-[#0A0A0A]/55 text-sm leading-loose mb-6 font-body"
                style={{ letterSpacing: "0.02em" }}
              >
                Элара Восс провела шесть лет в Kikunoi в Киото, прежде чем вернуться в родную Скандинавию,
                чтобы учиться у пионеров новой скандинавской кухни. Её кухня опирается на обе традиции — японское
                почитание единственного ингредиента и скандинавскую одержимость происхождением продукта.
              </p>
              <p
                className="text-[#0A0A0A]/55 text-sm leading-loose font-body"
                style={{ letterSpacing: "0.02em" }}
              >
                Она открыла Gastromania в 2018 году в 31 год. Две звезды Мишлен пришли уже в первый год.
                Третья последовала через восемнадцать месяцев — рекорд.
              </p>
            </motion.div>

            {/* Timeline row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={textInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.9, delay: 0.8 }}
              className="mt-14 pt-10 border-t border-[#0A0A0A]/10 grid grid-cols-3 gap-6"
            >
              {[
                { year: "2012", desc: "Kikunoi, Киото" },
                { year: "2015", desc: "Geranium, Копенгаген" },
                { year: "2018", desc: "Основание Gastromania" },
              ].map((item) => (
                <div key={item.year}>
                  <span
                    className="heading-editorial text-[#8C7355] block"
                    style={{ fontSize: "1.5rem" }}
                  >
                    {item.year}
                  </span>
                  <span className="label-refined text-[#0A0A0A]/45 mt-1 block">{item.desc}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
