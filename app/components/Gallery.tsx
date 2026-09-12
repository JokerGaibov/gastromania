"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

// Live video gallery — 8 short, hand-picked scenes cut from the 4 real
// Gastromania source videos (not just their poster frames — the earlier
// "3 static thumbnails" version looked weak and random). Each clip is a
// complete beat (arrival, prep, plating, etc.), not an arbitrary time
// slice — see main.md changelog for exact in/out points per source.
// No Unsplash left here at all (2026-09-12).
type GalleryItem = {
  src: string;
  poster: string;
  span: string;
  caption: string;
  description: string;
};

const videos: GalleryItem[] = [
  {
    src: "/videos/gallery/gastromania-atmosphere-arrival.mp4",
    poster: "/videos/gallery/gastromania-atmosphere-arrival-poster.jpg",
    span: "col-span-2 row-span-2",
    caption: "Прибытие",
    description: "Гостья подъезжает и заходит в Gastromania",
  },
  {
    src: "/videos/gallery/gastromania-kitchen-prep.mp4",
    poster: "/videos/gallery/gastromania-kitchen-prep-poster.jpg",
    span: "col-span-1 row-span-1",
    caption: "Подготовка",
    description: "Шеф нарезает овощи на кухне",
  },
  {
    src: "/videos/gallery/gastromania-desserts-assembly.mp4",
    poster: "/videos/gallery/gastromania-desserts-assembly-poster.jpg",
    span: "col-span-1 row-span-1",
    caption: "Сборка десерта",
    description: "Нанесение шоколадной глазури на торт",
  },
  {
    src: "/videos/gallery/gastromania-coffee-shop.mp4",
    poster: "/videos/gallery/gastromania-coffee-shop-poster.jpg",
    span: "col-span-1 row-span-2",
    caption: "Кофейня",
    description: "Барная стойка ESPRESSO.RU",
  },
  {
    src: "/videos/gallery/gastromania-kitchen-action.mp4",
    poster: "/videos/gallery/gastromania-kitchen-action-poster.jpg",
    span: "col-span-2 row-span-1",
    caption: "Кухня в работе",
    description: "Открытый огонь на воке во время готовки",
  },
  {
    src: "/videos/gallery/gastromania-desserts-finished.mp4",
    poster: "/videos/gallery/gastromania-desserts-finished-poster.jpg",
    span: "col-span-1 row-span-1",
    caption: "Готовый десерт",
    description: "Глянцевая шоколадная глазурь на готовом торте",
  },
  {
    src: "/videos/gallery/gastromania-coffee-brewing.mp4",
    poster: "/videos/gallery/gastromania-coffee-brewing-poster.jpg",
    span: "col-span-1 row-span-1",
    caption: "Приготовление кофе",
    description: "Бариста готовит латте",
  },
  {
    src: "/videos/gallery/gastromania-atmosphere-dining.mp4",
    poster: "/videos/gallery/gastromania-atmosphere-dining-poster.jpg",
    span: "col-span-1 row-span-1",
    caption: "За столом",
    description: "Полный стол блюд и гости за ужином",
  },
];

export default function Gallery() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-5%" });

  return (
    <section id="gallery" ref={sectionRef} className="bg-[#0A0A0A] py-32 lg:py-48 overflow-hidden">
      <div className="max-w-screen-xl mx-auto px-8 lg:px-16">

        {/* Header */}
        <div className="flex items-end justify-between mb-16 lg:mb-20">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="flex items-center gap-4 mb-8"
            >
              <div className="w-8 h-px bg-[#8C7355]" />
              <span className="label-refined text-[#8C7355]">Визуальный дневник</span>
            </motion.div>

            <div className="overflow-hidden">
              <motion.h2
                initial={{ y: "100%" }}
                animate={inView ? { y: "0%" } : {}}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="heading-editorial text-[#F5F0E8]"
                style={{ fontSize: "clamp(2.5rem,5vw,4.5rem)", lineHeight: 1 }}
              >
                Мир{" "}
                <span className="italic text-[#8C7355]">Gastromania</span>
              </motion.h2>
            </div>
          </div>

          <motion.span
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hidden lg:block label-refined text-[#F5F0E8]/25"
          >
            {videos.length} видео
          </motion.span>
        </div>

        {/* Editorial Grid — same span vocabulary as before (one 2x2 anchor,
            one 1x2 tall, one 2x1 wide, rest 1x1), extended to 8 tiles. */}
        <div className="grid grid-cols-2 lg:grid-cols-4 grid-rows-auto gap-2 lg:gap-3">
          {videos.map((clip, i) => (
            <motion.div
              key={clip.src}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
              className={`${clip.span} group relative overflow-hidden bg-[#1A1A1A]`}
              style={{ minHeight: "220px" }}
              aria-label={clip.description}
            >
              {/* Only mounts — and only then fetches video bytes — once the
                  gallery is actually in view, so nothing here loads on
                  initial page load or while scrolled past. */}
              {inView && (
                <video
                  muted
                  autoPlay
                  loop
                  playsInline
                  preload="none"
                  poster={clip.poster}
                  className="absolute inset-0 w-full h-full object-cover"
                  ref={(el) => { el?.play().catch(() => {}); }}
                >
                  <source src={clip.src} type="video/mp4" />
                </video>
              )}
              <div className="absolute inset-0 bg-[#0A0A0A]/0 group-hover:bg-[#0A0A0A]/50 transition-all duration-700 flex items-end p-6">
                <span className="label-refined text-[#F5F0E8] opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-y-2 group-hover:translate-y-0 transform">
                  {clip.caption}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
