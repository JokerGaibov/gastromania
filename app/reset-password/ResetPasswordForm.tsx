"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import FieldShell from "../components/reservation/FieldShell";
import { LockIcon } from "../components/reservation/icons";

type Status = "idle" | "loading" | "error";

const MIN_PASSWORD_LENGTH = 8;

function mapAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("password") && (m.includes("weak") || m.includes("short") || m.includes("at least") || m.includes("characters"))) {
    return "Пароль слишком короткий или простой. Используйте минимум 8 символов.";
  }
  if (m.includes("same") && m.includes("password")) {
    return "Новый пароль должен отличаться от текущего.";
  }
  return "Не удалось обновить пароль. Попробуйте ещё раз.";
}

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;

    const errors: typeof fieldErrors = {};
    if (password.length < MIN_PASSWORD_LENGTH) errors.password = `Пароль должен быть не менее ${MIN_PASSWORD_LENGTH} символов`;
    if (password !== confirmPassword) errors.confirmPassword = "Пароли не совпадают";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setStatus("loading");
    setServerError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setServerError(mapAuthError(error.message));
        setStatus("error");
        return;
      }

      // updateUser() на восстановленной сессии превращает её в обычную
      // полноценную сессию — пользователя можно сразу вести в кабинет, без
      // повторного входа.
      router.push("/account/orders");
      router.refresh();
    } catch (err) {
      console.error("updateUser threw unexpectedly:", err);
      setServerError(mapAuthError(err instanceof Error ? err.message : String(err)));
      setStatus("error");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full rounded-[24px] border border-[#0A0A0A]/8 bg-white shadow-[0_30px_80px_-24px_rgba(10,10,10,0.2)] p-7 sm:p-10"
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <FieldShell label="Новый пароль" icon={<LockIcon />} htmlFor="reset-password" error={fieldErrors.password}>
          <input
            id="reset-password"
            type="password"
            autoComplete="new-password"
            placeholder="Минимум 8 символов"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: undefined }));
            }}
            className="w-full bg-transparent outline-none text-[0.9375rem] text-[#0A0A0A] font-body placeholder:text-[#0A0A0A]/30"
          />
        </FieldShell>

        <FieldShell label="Повторите пароль" icon={<LockIcon />} htmlFor="reset-confirm-password" error={fieldErrors.confirmPassword}>
          <input
            id="reset-confirm-password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (fieldErrors.confirmPassword) setFieldErrors((f) => ({ ...f, confirmPassword: undefined }));
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
            {status === "loading" ? "Обновляем…" : "Обновить пароль"}
          </span>
          {status !== "loading" && (
            <span className="absolute inset-0 bg-[#8C7355] translate-y-full group-hover:translate-y-0 transition-transform duration-500" style={{ transitionTimingFunction: "cubic-bezier(0.25,0.46,0.45,0.94)" }} />
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}
