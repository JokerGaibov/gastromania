"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { smoothScrollTo } from "@/lib/motion";

const ease = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

// No phone/social links here — the owner hasn't given us real ones yet
// (see gastromania-tasks.md). Every action below goes somewhere real.
// No "Посмотреть меню" action — SignatureDishes (#dishes) isn't rendered
// on the page right now (invented dish content, see app/page.tsx), and
// there's no other menu section to point to yet.
const actions = [
  { label: "Забронировать стол", onClick: () => smoothScrollTo("#reservation") },
  { label: "Как добраться", onClick: () => smoothScrollTo("#contact") },
];

export default function CallToAction() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-10%" });

  return (
    <section ref={sectionRef} className="bg-[#0A0A0A] border-t border-[rgba(245,240,232,0.08)] py-20 lg:py-28">
      <div className="max-w-screen-xl mx-auto px-8 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease }}
          className="flex flex-col items-center text-center mb-12"
        >
          <span className="label-refined text-[#8C7355] block mb-4">Готовы начать?</span>
          <h2 className="heading-editorial text-[#F5F0E8]" style={{ fontSize: "clamp(1.75rem,3.5vw,2.75rem)" }}>
            Стол или доставка — выбирайте
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.15, ease }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className="label-refined text-[#F5F0E8]/80 border border-[rgba(245,240,232,0.15)] rounded-full px-7 py-3.5 hover:border-[#8C7355] hover:text-[#8C7355] transition-colors duration-300"
            >
              {action.label}
            </button>
          ))}
          <Link
            href="/delivery"
            className="label-refined bg-[#8C7355] text-[#0A0A0A] rounded-full px-7 py-3.5 hover:bg-[#F5F0E8] transition-colors duration-300"
          >
            Заказать доставку
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
