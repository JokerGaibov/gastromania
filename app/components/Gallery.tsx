"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Image from "next/image";

const images = [
  {
    src: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80&auto=format&fit=crop",
    alt: "Зал Gastromania",
    span: "col-span-2 row-span-2",
    caption: "Обеденный зал",
  },
  {
    src: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=80&auto=format&fit=crop",
    alt: "Деталь сервированного блюда",
    span: "col-span-1 row-span-1",
    caption: "Камень и Берег",
  },
  {
    src: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80&auto=format&fit=crop",
    alt: "Сезонная композиция",
    span: "col-span-1 row-span-1",
    caption: "Первый Снег",
  },
  {
    src: "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&q=80&auto=format&fit=crop",
    alt: "Винный погреб",
    span: "col-span-1 row-span-2",
    caption: "Погреб",
  },
  {
    src: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=900&q=80&auto=format&fit=crop",
    alt: "Деталь кухни",
    span: "col-span-2 row-span-1",
    caption: "Кухня на рассвете",
  },
  {
    src: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&q=80&auto=format&fit=crop",
    alt: "Сервировка стола",
    span: "col-span-1 row-span-1",
    caption: "Композиция стола",
  },
];

export default function Gallery() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-5%" });
  const [lightbox, setLightbox] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastTriggerRef = useRef<HTMLElement | null>(null);

  const openLightbox = (index: number, trigger: HTMLElement) => {
    lastTriggerRef.current = trigger;
    setLightbox(index);
  };

  const closeLightbox = () => setLightbox(null);

  useEffect(() => {
    if (lightbox === null) return;

    const dialogNode = dialogRef.current;
    dialogNode?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeLightbox();
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setLightbox((i) => (i === null ? i : (i + 1) % images.length));
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setLightbox((i) => (i === null ? i : (i - 1 + images.length) % images.length));
        return;
      }
      if (e.key === "Tab" && dialogNode) {
        const focusable = dialogNode.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      lastTriggerRef.current?.focus();
    };
  }, [lightbox]);

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
            {images.length} изображений
          </motion.span>
        </div>

        {/* Editorial Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 grid-rows-auto gap-2 lg:gap-3">
          {images.map((img, i) => (
            <motion.button
              type="button"
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
              className={`${img.span} img-zoom group relative cursor-pointer overflow-hidden bg-[#1A1A1A] text-left appearance-none border-0 p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8C7355] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]`}
              style={{ minHeight: "220px" }}
              onClick={(e) => openLightbox(i, e.currentTarget)}
              aria-label={`Открыть изображение «${img.caption}» на весь экран`}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-cover"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-[#0A0A0A]/0 group-hover:bg-[#0A0A0A]/50 transition-all duration-700 flex items-end p-6">
                <span className="label-refined text-[#F5F0E8] opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-y-2 group-hover:translate-y-0 transform">
                  {img.caption}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-md flex items-center justify-center p-8 cursor-pointer"
            onClick={closeLightbox}
          >
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label={images[lightbox].caption}
              tabIndex={-1}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative max-w-4xl max-h-[85vh] w-full cursor-auto outline-none"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full aspect-[4/3]">
                <Image
                  src={images[lightbox].src.replace("w=900", "w=1400").replace("w=600", "w=1000")}
                  alt={images[lightbox].alt}
                  fill
                  sizes="90vw"
                  className="object-contain"
                />
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="label-refined text-[#F5F0E8]/50">{images[lightbox].caption}</span>
                <span className="label-refined text-[#F5F0E8]/30">
                  {lightbox + 1} / {images.length}
                </span>
              </div>
              <button
                type="button"
                onClick={closeLightbox}
                className="absolute top-0 right-0 -translate-y-10 label-refined text-[#F5F0E8]/50 hover:text-[#F5F0E8] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8C7355]"
              >
                Закрыть
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
