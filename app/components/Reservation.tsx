"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const ease = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];
const springIn = [0.16, 1, 0.3, 1] as [number, number, number, number];

const details = [
  { label: "Дегустационное меню", value: "2 800 DKK" },
  { label: "Винная пара", value: "1 400 DKK" },
  { label: "Длительность", value: "4–5 часов" },
  { label: "Дресс-код", value: "Smart Casual" },
];

export default function Reservation() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-10%" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section
      id="reservation"
      ref={sectionRef}
      className="relative bg-[#F5F0E8] overflow-hidden py-32 lg:py-56"
    >
      {/* Background grain */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      <div className="relative max-w-screen-xl mx-auto px-8 lg:px-16">
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-24">

          {/* Left — headline + details */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, ease }}
              className="flex items-center gap-4 mb-12"
            >
              <div className="w-8 h-px bg-[#8C7355]" />
              <span className="label-refined text-[#8C7355]">Забронируйте ваш вечер</span>
            </motion.div>

            {["Столик", "на восемнадцать.", "Ждёт вас."].map((line, i) => (
              <div key={line} className="overflow-hidden mb-2">
                <motion.h2
                  initial={{ y: "100%" }}
                  animate={inView ? { y: "0%" } : {}}
                  transition={{ duration: 1, delay: i * 0.1, ease: springIn }}
                  className={`heading-editorial ${i === 1 ? "italic text-[#8C7355]" : "text-[#0A0A0A]"}`}
                  style={{ fontSize: "clamp(2.5rem,5vw,4.5rem)", lineHeight: 1 }}
                >
                  {line}
                </motion.h2>
              </div>
            ))}

            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.9, delay: 0.6, ease }}
            >
              <p className="text-[#0A0A0A]/50 text-sm leading-loose font-body mb-10 mt-8" style={{ letterSpacing: "0.02em" }}>
                Приём гостей доступен со вторника по субботу, начиная с 19:00.
                Мы принимаем до шести гостей на одно бронирование. Особые требования к питанию
                учитываются при уведомлении за двадцать четыре часа.
              </p>

              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-[#0A0A0A]/10">
                {details.map((item) => (
                  <div key={item.label}>
                    <span className="label-refined text-[#0A0A0A]/35 block mb-1">{item.label}</span>
                    <span
                      style={{ fontFamily: "var(--font-cormorant)", fontWeight: 400, letterSpacing: "0.02em" }}
                      className="text-[#0A0A0A]/75 text-lg"
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right — Form */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.9, delay: 0.3, ease }}
              className="border border-[#0A0A0A]/10 p-10 lg:p-16"
            >
              {!submitted ? (
                <form onSubmit={handleSubmit} className="flex flex-col gap-10">
                  <div className="grid sm:grid-cols-2 gap-10">
                    {["Имя", "Фамилия"].map((ph, i) => (
                      <motion.div
                        key={ph}
                        initial={{ opacity: 0, y: 20 }}
                        animate={inView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.7, delay: 0.4 + i * 0.07, ease }}
                      >
                        <input type="text" required placeholder={ph} className="refined" style={{ color: "#0A0A0A" }} />
                      </motion.div>
                    ))}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-10">
                    {[
                      { type: "email", ph: "Email" },
                      { type: "tel", ph: "Номер телефона" },
                    ].map(({ type, ph }, i) => (
                      <motion.div
                        key={ph}
                        initial={{ opacity: 0, y: 20 }}
                        animate={inView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.7, delay: 0.55 + i * 0.07, ease }}
                      >
                        <input type={type} required={type === "email"} placeholder={ph} className="refined" style={{ color: "#0A0A0A" }} />
                      </motion.div>
                    ))}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-10">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={inView ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.7, delay: 0.7, ease }}
                    >
                      <input type="date" required className="refined" style={{ color: "#0A0A0A", colorScheme: "light" }} />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={inView ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.7, delay: 0.77, ease }}
                      className="relative"
                    >
                      <select required className="refined" style={{ color: "#0A0A0A" }} defaultValue="">
                        <option value="" disabled>Гостей</option>
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                          <option key={n} value={n}>{n} {n === 1 ? "гость" : "гостя(ей)"}</option>
                        ))}
                      </select>
                      <div className="absolute right-0 bottom-4 pointer-events-none text-[#8C7355] text-xs">▾</div>
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7, delay: 0.84, ease }}
                  >
                    <textarea
                      placeholder="Особый повод или требования к питанию"
                      rows={2}
                      className="refined resize-none"
                      style={{ color: "#0A0A0A" }}
                    />
                  </motion.div>

                  {/* Wine pairing toggle */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7, delay: 0.91, ease }}
                    className="flex items-center justify-between py-4 border-b border-[#0A0A0A]/10"
                  >
                    <div>
                      <span className="label-refined text-[#0A0A0A]/60">Винная пара — 1 400 DKK</span>
                      <p className="text-[#0A0A0A]/40 text-xs mt-0.5 font-body" style={{ letterSpacing: "0.02em" }}>
                        12 вин, подобранных сомелье Никласом Равном
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-10 h-5 bg-[#0A0A0A]/15 rounded-full peer peer-checked:bg-[#8C7355] transition-colors duration-300 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-5" />
                    </label>
                  </motion.div>

                  {/* Submit */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7, delay: 0.98, ease }}
                  >
                    <button
                      type="submit"
                      className="w-full py-4 bg-[#0A0A0A] text-[#F5F0E8] label-refined hover:bg-[#1C1C1C] transition-colors duration-300 relative overflow-hidden group"
                    >
                      <span className="relative z-10">Отправить запрос</span>
                      <span className="absolute inset-0 bg-[#8C7355] translate-y-full group-hover:translate-y-0 transition-transform duration-500" style={{ transitionTimingFunction: "cubic-bezier(0.25,0.46,0.45,0.94)" }} />
                    </button>
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : {}}
                    transition={{ duration: 0.7, delay: 1.05, ease }}
                    className="text-[#0A0A0A]/35 text-xs font-body text-center"
                    style={{ letterSpacing: "0.04em" }}
                  >
                    Ваш запрос будет подтверждён в течение 24 часов. Для удержания брони требуется банковская карта.
                  </motion.p>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <div className="w-12 h-px bg-[#8C7355] mb-8 mx-auto" />
                  <h3 className="heading-editorial text-[#0A0A0A] mb-4" style={{ fontSize: "2rem" }}>
                    Спасибо
                  </h3>
                  <p style={{ fontFamily: "var(--font-cormorant)", fontWeight: 300 }} className="text-[#0A0A0A]/55 text-xl italic mb-6">
                    Ваш запрос на бронирование получен.
                  </p>
                  <p className="text-[#0A0A0A]/45 text-sm font-body" style={{ letterSpacing: "0.03em" }}>
                    Мы свяжемся с вами в течение 24 часов, чтобы подтвердить ваш вечер.
                  </p>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
