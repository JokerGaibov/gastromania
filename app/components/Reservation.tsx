"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import FieldShell from "./reservation/FieldShell";
import Dropdown from "./reservation/Dropdown";
import Calendar from "./reservation/Calendar";
import PhoneField from "./reservation/PhoneField";
import { UserIcon, MailIcon, NoteIcon, ClockIcon, UsersIcon } from "./reservation/icons";
import {
  GUEST_COUNTS,
  TIME_SLOTS,
  isRuPhoneComplete,
  isValidEmail,
  pluralizeGuests,
  toDateOnlyISO,
} from "./reservation/utils";
import { submitReservation } from "./reservation/actions";

const ease = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];
const springIn = [0.16, 1, 0.3, 1] as [number, number, number, number];

const details = [
  { label: "Дегустационное меню", value: "2 800 DKK" },
  { label: "Винная пара", value: "1 400 DKK" },
  { label: "Длительность", value: "4–5 часов" },
  { label: "Дресс-код", value: "Smart Casual" },
];

const COMMENT_MAX = 240;

// Mirrors the `reservations` table columns from gastromania-spec.md (Этап 3)
// so Блок 5, задача 5.1 (gastromania-tasks.md) can wire this straight to a
// Supabase server action without reshaping the form state.
type ReservationForm = {
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  partySize: number | null;
  date: Date | null;
  time: string | null;
  comment: string;
};

const emptyForm: ReservationForm = {
  guestName: "",
  guestPhone: "",
  guestEmail: "",
  partySize: null,
  date: null,
  time: null,
  comment: "",
};

type FormErrors = Partial<Record<keyof ReservationForm, string>>;

function validate(form: ReservationForm): FormErrors {
  const errors: FormErrors = {};
  if (!form.guestName.trim()) errors.guestName = "Укажите имя";
  if (!isRuPhoneComplete(form.guestPhone)) errors.guestPhone = "Укажите номер полностью";
  if (!form.date) errors.date = "Выберите дату";
  if (!form.time) errors.time = "Выберите время";
  if (!form.partySize) errors.partySize = "Укажите количество гостей";
  if (form.guestEmail.trim() && !isValidEmail(form.guestEmail.trim())) {
    errors.guestEmail = "Проверьте адрес email";
  }
  return errors;
}

const cardVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
};
const fieldVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};
const fieldHover = { y: -3, transition: { type: "spring" as const, stiffness: 320, damping: 22 } };

type SubmitStatus = "idle" | "loading" | "success" | "error";

export default function Reservation() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-10%" });
  const [form, setForm] = useState<ReservationForm>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  const setField = <K extends keyof ReservationForm>(key: K, value: ReservationForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return; // already in flight — ignore repeat clicks/Enter

    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("loading");
    setServerError(null);

    try {
      const result = await submitReservation({
        guestName: form.guestName,
        guestPhone: form.guestPhone,
        guestEmail: form.guestEmail,
        partySize: form.partySize,
        dateISO: form.date ? toDateOnlyISO(form.date) : null,
        time: form.time,
        comment: form.comment,
      });

      if (result.ok) {
        setForm(emptyForm);
        setErrors({});
        setStatus("success");
      } else {
        setServerError(result.error);
        setStatus("error");
      }
    } catch (err) {
      // The server action threw instead of returning {ok:false} — e.g. a
      // network failure or the Supabase client failing to even construct.
      // Must still land on a visible error state, never leave the button
      // stuck on "Отправляем…" forever.
      console.error("submitReservation threw unexpectedly:", err);
      setServerError("Не удалось отправить заявку. Проверьте соединение и попробуйте ещё раз.");
      setStatus("error");
    }
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
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-12">

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

          {/* Right — Booking card */}
          <div className="lg:col-span-7 flex lg:justify-end">
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.25, ease }}
              className="w-full max-w-[520px] rounded-[24px] border border-[#0A0A0A]/8 bg-white shadow-[0_30px_80px_-24px_rgba(10,10,10,0.2)] p-7 sm:p-10"
            >
              {status !== "success" ? (
                <>
                  <div className="mb-8">
                    <h3 className="heading-editorial text-[#0A0A0A] mb-2" style={{ fontSize: "1.75rem" }}>
                      Оформление брони
                    </h3>
                    <p className="text-[#0A0A0A]/45 text-sm font-body" style={{ letterSpacing: "0.02em" }}>
                      Ответ приходит в течение 24 часов
                    </p>
                  </div>

                  <motion.form
                    variants={cardVariants}
                    initial="hidden"
                    animate={inView ? "show" : "hidden"}
                    onSubmit={handleSubmit}
                    noValidate
                    className="flex flex-col gap-5"
                  >
                    <motion.div variants={fieldVariants} whileHover={fieldHover}>
                      <FieldShell label="Имя" icon={<UserIcon />} htmlFor="res-name" error={errors.guestName}>
                        <input
                          id="res-name"
                          type="text"
                          autoComplete="name"
                          placeholder="Введите имя"
                          value={form.guestName}
                          onChange={(e) => setField("guestName", e.target.value)}
                          className="w-full bg-transparent outline-none text-[0.9375rem] text-[#0A0A0A] font-body placeholder:text-[#0A0A0A]/30"
                        />
                      </FieldShell>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <motion.div variants={fieldVariants} whileHover={fieldHover}>
                        <PhoneField
                          id="res-phone"
                          value={form.guestPhone}
                          onChange={(v) => setField("guestPhone", v)}
                          error={errors.guestPhone}
                        />
                      </motion.div>
                      <motion.div variants={fieldVariants} whileHover={fieldHover}>
                        <FieldShell label="Email (необязательно)" icon={<MailIcon />} htmlFor="res-email" error={errors.guestEmail}>
                          <input
                            id="res-email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={form.guestEmail}
                            onChange={(e) => setField("guestEmail", e.target.value)}
                            className="w-full bg-transparent outline-none text-[0.9375rem] text-[#0A0A0A] font-body placeholder:text-[#0A0A0A]/30"
                          />
                        </FieldShell>
                      </motion.div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <motion.div variants={fieldVariants} whileHover={fieldHover}>
                        <Calendar
                          id="res-date"
                          label="Дата"
                          placeholder="Выберите дату"
                          value={form.date}
                          onChange={(d) => setField("date", d)}
                          error={errors.date}
                        />
                      </motion.div>
                      <motion.div variants={fieldVariants} whileHover={fieldHover}>
                        <Dropdown
                          id="res-time"
                          label="Время"
                          icon={<ClockIcon />}
                          placeholder="Выберите время"
                          options={TIME_SLOTS.map((t) => ({ value: t, label: t }))}
                          value={form.time}
                          onChange={(v) => setField("time", v)}
                          error={errors.time}
                        />
                      </motion.div>
                      <motion.div variants={fieldVariants} whileHover={fieldHover} className="sm:col-span-2">
                        <Dropdown
                          id="res-guests"
                          label="Гости"
                          icon={<UsersIcon />}
                          placeholder="Количество гостей"
                          options={GUEST_COUNTS.map((n) => ({ value: String(n), label: `${n} ${pluralizeGuests(n)}` }))}
                          value={form.partySize ? String(form.partySize) : null}
                          onChange={(v) => setField("partySize", Number(v))}
                          error={errors.partySize}
                        />
                      </motion.div>
                    </div>

                    <motion.div variants={fieldVariants} whileHover={fieldHover}>
                      <FieldShell label="Комментарий (необязательно)" icon={<NoteIcon />} htmlFor="res-comment">
                        <textarea
                          id="res-comment"
                          rows={3}
                          maxLength={COMMENT_MAX}
                          placeholder="День рождения, стол у окна, будем с ребёнком…"
                          value={form.comment}
                          onChange={(e) => setField("comment", e.target.value)}
                          className="w-full bg-transparent outline-none resize-none text-[0.9375rem] text-[#0A0A0A] font-body placeholder:text-[#0A0A0A]/30"
                        />
                        <span
                          className={`block text-right mt-1 text-xs font-body ${
                            form.comment.length >= COMMENT_MAX ? "text-[#8C7355]" : "text-[#0A0A0A]/25"
                          }`}
                        >
                          {form.comment.length}/{COMMENT_MAX}
                        </span>
                      </FieldShell>
                    </motion.div>

                    {status === "error" && serverError && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-[12px] border border-[#B3564A]/25 bg-[#B3564A]/[0.06] px-4 py-3"
                      >
                        <p className="text-[#B3564A] text-sm font-body" style={{ letterSpacing: "0.01em" }}>
                          {serverError}
                        </p>
                      </motion.div>
                    )}

                    <motion.div variants={fieldVariants}>
                      <motion.button
                        type="submit"
                        disabled={status === "loading"}
                        whileHover={status === "loading" ? undefined : { scale: 1.015, boxShadow: "0 16px 40px -10px rgba(10,10,10,0.35)" }}
                        whileTap={status === "loading" ? undefined : { scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 24 }}
                        className="w-full mt-2 rounded-[14px] bg-[#0A0A0A] text-[#F5F0E8] label-refined relative overflow-hidden group disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{ height: "56px" }}
                      >
                        <span className="relative z-10 flex items-center justify-center gap-3">
                          {status === "loading" && (
                            <span className="w-3.5 h-3.5 rounded-full border-2 border-[#F5F0E8]/30 border-t-[#F5F0E8] animate-spin" />
                          )}
                          {status === "loading" ? "Отправляем…" : "Отправить запрос"}
                        </span>
                        {status !== "loading" && (
                          <span className="absolute inset-0 bg-[#8C7355] translate-y-full group-hover:translate-y-0 transition-transform duration-500" style={{ transitionTimingFunction: "cubic-bezier(0.25,0.46,0.45,0.94)" }} />
                        )}
                      </motion.button>
                    </motion.div>

                    <motion.p
                      variants={fieldVariants}
                      className="text-[#0A0A0A]/35 text-xs font-body text-center"
                      style={{ letterSpacing: "0.04em" }}
                    >
                      Ваш запрос будет подтверждён в течение 24 часов.
                    </motion.p>
                  </motion.form>
                </>
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
