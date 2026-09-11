"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import FieldShell from "../components/reservation/FieldShell";
import { MailIcon, LockIcon } from "../components/reservation/icons";
import { isValidEmail } from "../components/reservation/utils";

type Status = "idle" | "loading" | "error";

// Only ever follow an internal path — `next` comes from a URL query param,
// so an unvalidated value could be `//evil.com` (protocol-relative) or a
// full external URL. Same defensive pattern belongs anywhere a redirect
// target is read from user-controlled input.
function safeNextPath(next: string | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

function mapAuthError(message: string): string {
  if (message.toLowerCase().includes("invalid login credentials")) {
    return "Неверный email или пароль.";
  }
  if (message.toLowerCase().includes("email not confirmed")) {
    return "Email ещё не подтверждён. Проверьте почту.";
  }
  return "Не удалось войти. Попробуйте ещё раз.";
}

export default function LoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return; // ignore repeat clicks/Enter while in flight

    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) errors.email = "Укажите email";
    else if (!isValidEmail(email.trim())) errors.email = "Проверьте адрес email";
    if (!password) errors.password = "Укажите пароль";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setStatus("loading");
    setServerError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setServerError(mapAuthError(error.message));
        setStatus("error");
        return;
      }

      // Full data re-fetch so Server Components (layouts, pages) see the
      // freshly-set session cookie rather than a stale pre-login render.
      router.push(safeNextPath(nextPath));
      router.refresh();
    } catch (err) {
      // Must still land on a visible error state, never leave the button
      // stuck on "Входим…" — mirrors the same guard in Reservation.tsx.
      console.error("signInWithPassword threw unexpectedly:", err);
      setServerError("Не удалось войти. Попробуйте ещё раз.");
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
        <FieldShell label="Email" icon={<MailIcon />} htmlFor="login-email" error={fieldErrors.email}>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: undefined }));
            }}
            className="w-full bg-transparent outline-none text-[0.9375rem] text-[#0A0A0A] font-body placeholder:text-[#0A0A0A]/30"
          />
        </FieldShell>

        <FieldShell label="Пароль" icon={<LockIcon />} htmlFor="login-password" error={fieldErrors.password}>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: undefined }));
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
            {status === "loading" ? "Входим…" : "Войти"}
          </span>
          {status !== "loading" && (
            <span className="absolute inset-0 bg-[#8C7355] translate-y-full group-hover:translate-y-0 transition-transform duration-500" style={{ transitionTimingFunction: "cubic-bezier(0.25,0.46,0.45,0.94)" }} />
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}
