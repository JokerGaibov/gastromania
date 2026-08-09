"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Image from "next/image";

const MotionImage = motion.create(Image);

const dishes = [
  {
    id: "01",
    name: "Камень и Берег",
    subtitle: "Морской ёж · Цвет бузины · Холодный гранитный бульон",
    season: "Весна",
    description:
      "Размышление о береговой линии на рассвете. Морской ёж добыт во время отлива в течение двух часов до подачи. Гранитный бульон — 48-часовой отвар из прибрежных камней, водорослей и утренней росы — наливается прямо за столом.",
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?w=900&q=85&auto=format&fit=crop",
    index: 1,
  },
  {
    id: "02",
    name: "Корень и Дым",
    subtitle: "Выдержанная свёкла · Хвойный пепел · Ферментированные сливки",
    season: "Осень",
    description:
      "Свёкла, запечённая в углях шесть часов. Корка из хвойного пепла. Под ней — мякоть настолько концентрированная, что читается как пикантная. Крем-фреш, выдержанный девять месяцев в том же погребе, где росла свёкла.",
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=900&q=85&auto=format&fit=crop",
    index: 2,
  },
  {
    id: "03",
    name: "Первый Снег",
    subtitle: "Белый трюфель · Замороженный молочный снег · Выдержанное масло",
    season: "Зима",
    description:
      "Трюфель из Альбы, тонко срезанный над замороженным покровом из цельномолочного снега. Под ним — лужица масла, выдержанного сорок дней в пчелином воске — самая насыщенная, самая терпеливая версия себя. Блюдо, которое нужно съесть менее чем за девяносто секунд.",
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&q=85&auto=format&fit=crop",
    index: 3,
  },
  {
    id: "04",
    name: "Утро на Лугу",
    subtitle: "Дикие травы · Зелёная клубника · Луговой уксус",
    season: "Лето",
    description:
      "Сорок два диких травяных растения, собранных до 7 утра, расставленных по кислотности и аромату. Незрелая клубника, мацерированная в нашем домашнем уксусе три недели. Блюдо, которое пахнет самим июнем.",
    image:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&q=85&auto=format&fit=crop",
    index: 4,
  },
];

export default function SignatureDishes() {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = useState<number>();
  const inView = useInView(sectionRef, { once: true, margin: "-5%" });

  // On mobile the list and image stack into separate grid rows, so the image's
  // wrapper has no extra height for its inner `sticky` panel to pin within.
  // Matching it to the list's measured height gives sticky the room it needs
  // (desktop already gets this for free via grid row-stretch).
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const update = () => setListHeight(el.offsetHeight);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="dishes" ref={sectionRef} className="bg-[#0F0F0D] py-32 lg:py-48">
      <div className="max-w-screen-xl mx-auto px-8 lg:px-16">

        {/* Header */}
        <div className="grid lg:grid-cols-2 gap-12 mb-20 lg:mb-28 overflow-hidden">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="flex items-center gap-4 mb-10"
            >
              <div className="w-8 h-px bg-[#8C7355]" />
              <span className="label-refined text-[#8C7355]">Авторские композиции</span>
            </motion.div>

            <div className="overflow-hidden">
              <motion.h2
                initial={{ y: "100%" }}
                animate={inView ? { y: "0%" } : {}}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="heading-editorial text-[#F5F0E8]"
                style={{ fontSize: "clamp(2.5rem,5.5vw,5rem)", lineHeight: 1 }}
              >
                Блюда, что
              </motion.h2>
            </div>
            <div className="overflow-hidden">
              <motion.h2
                initial={{ y: "100%" }}
                animate={inView ? { y: "0%" } : {}}
                transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="heading-editorial italic text-[#8C7355]"
                style={{ fontSize: "clamp(2.5rem,5.5vw,5rem)", lineHeight: 1 }}
              >
                Бросают вызов сезонам
              </motion.h2>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.4 }}
            className="flex flex-col justify-end"
          >
            <p
              className="text-[#F5F0E8]/50 text-sm leading-loose font-body"
              style={{ letterSpacing: "0.02em" }}
            >
              Следующие композиции представляют сердце нашего постоянного репертуара —
              блюда настолько тесно связанные с сезоном, что они могут появиться лишь когда позволяет природа.
              Каждое незаметно меняется из года в год.
            </p>
          </motion.div>
        </div>

        {/* Interactive Dish Explorer */}
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-12">

          {/* Dish List */}
          <div ref={listRef} className="order-2 lg:order-1 lg:col-span-5 flex flex-col overflow-hidden">
            {dishes.map((dish, i) => (
              <motion.button
                key={dish.id}
                initial={{ opacity: 0, x: -20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.2 + i * 0.1 }}
                onClick={() => setActiveIndex(i)}
                className={`group flex items-start gap-6 py-7 border-b text-left transition-all duration-500 ${
                  i === 0 ? "border-t" : ""
                } ${
                  activeIndex === i
                    ? "border-[#8C7355]/40"
                    : "border-[rgba(245,240,232,0.08)] hover:border-[rgba(245,240,232,0.15)]"
                }`}
              >
                <span
                  className={`label-refined transition-colors duration-300 mt-1 ${
                    activeIndex === i ? "text-[#8C7355]" : "text-[#F5F0E8]/25"
                  }`}
                >
                  {dish.id}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3
                      className={`heading-editorial transition-colors duration-300 ${
                        activeIndex === i ? "text-[#F5F0E8]" : "text-[#F5F0E8]/60"
                      }`}
                      style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.75rem)" }}
                    >
                      {dish.name}
                    </h3>
                    <span
                      className={`label-refined flex-shrink-0 transition-colors duration-300 mt-1 ${
                        activeIndex === i ? "text-[#8C7355]" : "text-[#F5F0E8]/20"
                      }`}
                    >
                      {dish.season}
                    </span>
                  </div>
                  <p className="text-[#F5F0E8]/35 text-xs font-body" style={{ letterSpacing: "0.04em" }}>
                    {dish.subtitle}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Dish Image & Detail */}
          <div
            className="order-1 lg:order-2 lg:col-span-7"
            style={listHeight ? { minHeight: listHeight } : undefined}
          >
            <div className="sticky top-28 bg-[#0F0F0D] pb-6 lg:pb-0">
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden bg-[#1A1A1A] mb-5 lg:mb-8">
                <AnimatePresence mode="wait">
                  <MotionImage
                    key={activeIndex}
                    src={dishes[activeIndex].image}
                    alt={dishes[activeIndex].name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    initial={{ opacity: 0, scale: 1.06 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="object-cover"
                  />
                </AnimatePresence>
                {/* Dish number overlay */}
                <div className="absolute bottom-0 right-0 p-6">
                  <span
                    className="heading-editorial text-[#F5F0E8]/10"
                    style={{ fontSize: "5rem", lineHeight: 1 }}
                  >
                    {dishes[activeIndex].id}
                  </span>
                </div>
              </div>

              {/* Compact caption — mobile only. Keeps the sticky panel short enough
                  to actually have room to pin above the (comparably tall) list;
                  the full description moves below the list on mobile instead. */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.4 }}
                  className="flex items-center justify-between gap-4 lg:hidden"
                >
                  <h3 className="heading-editorial text-[#F5F0E8]" style={{ fontSize: "clamp(1.1rem, 4vw, 1.4rem)" }}>
                    {dishes[activeIndex].name}
                  </h3>
                  <span className="label-refined text-[#8C7355] flex-shrink-0">
                    {dishes[activeIndex].season}
                  </span>
                </motion.div>
              </AnimatePresence>

              {/* Description — desktop only, inside the sticky panel */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.5 }}
                  className="hidden lg:block"
                >
                  <p
                    style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300, letterSpacing: "0.01em" }}
                    className="text-[#F5F0E8]/65 text-lg italic leading-relaxed"
                  >
                    {dishes[activeIndex].description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Description — mobile only, below the list */}
          <div className="order-3 lg:hidden pt-10 border-t border-[rgba(245,240,232,0.08)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.5 }}
              >
                <p
                  style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300, letterSpacing: "0.01em" }}
                  className="text-[#F5F0E8]/65 text-lg italic leading-relaxed"
                >
                  {dishes[activeIndex].description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.9, delay: 1 }}
          className="mt-20 pt-16 border-t border-[rgba(245,240,232,0.08)] flex items-center justify-between"
        >
          <p className="text-[#F5F0E8]/35 text-sm font-body" style={{ letterSpacing: "0.06em" }}>
            ДЕГУСТАЦИОННОЕ МЕНЮ · 18 БЛЮД · СЕЗОННОЕ
          </p>
          <button
            onClick={() => document.querySelector("#reservation")?.scrollIntoView({ behavior: "smooth" })}
            className="group flex items-center gap-4 hover:gap-6 transition-all duration-500"
          >
            <span className="label-refined text-[#F5F0E8]/70 group-hover:text-[#F5F0E8] transition-colors">
              Полное меню
            </span>
            <div className="w-8 h-px bg-[#8C7355]" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
