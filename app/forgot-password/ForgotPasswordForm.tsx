"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import FieldShell from "../components/reservation/FieldShell";
import { MailIcon } from "../components/reservation/icons";
import { isValidEmail } from "../components/reservation/utils";

type Status = "idle" | "loading" | "error" | "sent";

// Превышение лимита отправки писем — единственная ошибка этого запроса,
// которую можно показать честно: она ничего не говорит о том, существует
// ли аккаунт с этим email (это лимит всего проекта, не конкретного
// адреса), в отличие от любой другой ошибки. Найдено живым тестированием
// (2026-09-15) — встроенный email-провайдер Supabase по умолчанию имеет
// очень низкий лимит, реальные пользователи могут упереться в него.
function isRateLimitError(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("rate limit") || m.includes("for security purposes");
}

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [status, setStatus] = useState<Status>("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;

    if (!email.trim()) {
      setFieldError("Укажите email");
      return;
    }
    if (!isValidEmail(email.trim())) {
      setFieldError("Проверьте адрес email");
      return;
    }
    setFieldError(undefined);
    setStatus("loading");
    setServerError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent("/reset-password")}`,
      });

      if (error && isRateLimitError(error.message)) {
        setServerError("Слишком много попыток. Подождите немного и попробуйте снова.");
        setStatus("error");
        return;
      }

      // Любой другой исход (успех или ошибка, включая «пользователь не
      // найден», если Supabase вообще её возвращает) — тот же ответ, иначе
      // форма превращается в способ проверить, зарегистрирован ли
      // конкретный email (утечка факта существования аккаунта).
      setStatus("sent");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("resetPasswordForEmail threw unexpectedly:", err);
      if (isRateLimitError(message)) {
        setServerError("Слишком много попыток. Подождите немного и попробуйте снова.");
        setStatus("error");
        return;
      }
      setStatus("sent");
    }
  }

  if (status === "sent") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full rounded-[24px] border border-[#0A0A0A]/8 bg-white shadow-[0_30px_80px_-24px_rgba(10,10,10,0.2)] p-7 sm:p-10 text-center"
      >
        <div className="w-12 h-px bg-[#8C7355] mb-8 mx-auto" />
        <h3 className="heading-editorial text-[#0A0A0A] mb-4" style={{ fontSize: "1.75rem" }}>
          Проверьте почту
        </h3>
        <p className="text-[#0A0A0A]/55 text-sm font-body leading-relaxed" style={{ letterSpacing: "0.02em" }}>
          Если аккаунт с таким email существует, мы отправили на него ссылку для восстановления пароля.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full rounded-[24px] border border-[#0A0A0A]/8 bg-white shadow-[0_30px_80px_-24px_rgba(10,10,10,0.2)] p-7 sm:p-10"
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <p className="text-[#0A0A0A]/50 text-sm font-body leading-relaxed" style={{ letterSpacing: "0.02em" }}>
          Укажите email, с которым вы регистрировались — мы отправим ссылку для восстановления пароля.
        </p>

        <FieldShell label="Email" icon={<MailIcon />} htmlFor="forgot-email" error={fieldError}>
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldError) setFieldError(undefined);
            }}
            className="w-full bg-transparent outline-none text-[0.9375rem] text-[#0A0A0A] font-body placeholder:text-[#0A0A0A]/30"
          />
        </FieldShell>

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
            {status === "loading" ? "Отправляем…" : "Отправить ссылку"}
          </span>
          {status !== "loading" && (
            <span className="absolute inset-0 bg-[#8C7355] translate-y-full group-hover:translate-y-0 transition-transform duration-500" style={{ transitionTimingFunction: "cubic-bezier(0.25,0.46,0.45,0.94)" }} />
          )}
        </motion.button>

        <p className="text-center text-sm font-body text-[#0A0A0A]/50" style={{ letterSpacing: "0.01em" }}>
          <Link href="/login" className="text-[#8C7355] underline underline-offset-2 hover:text-[#0A0A0A] transition-colors">
            ← Вернуться ко входу
          </Link>
        </p>
      </form>
    </motion.div>
  );
}
