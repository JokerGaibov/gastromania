"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import FieldShell from "../components/reservation/FieldShell";
import ConsentCheckbox from "../components/reservation/ConsentCheckbox";
import { UserIcon, MailIcon, LockIcon } from "../components/reservation/icons";
import { isValidEmail } from "../components/reservation/utils";

type Status = "idle" | "loading" | "error" | "check-email";

const MIN_PASSWORD_LENGTH = 8;

// Same guard as LoginForm.tsx — `next` comes from a URL query param, so an
// unvalidated value could be an external/protocol-relative URL.
function safeNextPath(next: string | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

function mapAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already exists") || m.includes("user already")) {
    return "Этот email уже используется. Попробуйте войти.";
  }
  if (m.includes("password") && (m.includes("weak") || m.includes("short") || m.includes("at least") || m.includes("characters"))) {
    return "Пароль слишком короткий или простой. Используйте минимум 8 символов.";
  }
  if (m.includes("rate limit") || m.includes("for security purposes")) {
    return "Слишком много попыток. Подождите немного и попробуйте снова.";
  }
  return "Не удалось создать аккаунт. Попробуйте ещё раз.";
}

export default function RegisterForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    consentGiven?: string;
  }>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;

    const errors: typeof fieldErrors = {};
    if (!fullName.trim()) errors.fullName = "Укажите имя";
    if (!email.trim()) errors.email = "Укажите email";
    else if (!isValidEmail(email.trim())) errors.email = "Проверьте адрес email";
    if (password.length < MIN_PASSWORD_LENGTH) errors.password = `Пароль должен быть не менее ${MIN_PASSWORD_LENGTH} символов`;
    if (password !== confirmPassword) errors.confirmPassword = "Пароли не совпадают";
    if (!consentGiven) errors.consentGiven = "Нужно согласие на обработку персональных данных";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setStatus("loading");
    setServerError(null);

    try {
      const supabase = createClient();
      // Никакой роли здесь не передаётся и не может быть передана — новая
      // строка в profiles всегда получает role='customer' по умолчанию
      // (handle_new_user() не читает role из meta, колонка сама берёт
      // default 'customer' из схемы). Сделать admin через публичную форму
      // невозможно структурно, а не только по соглашению.
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(safeNextPath(nextPath) === "/" ? "/account/orders" : safeNextPath(nextPath))}`,
        },
      });

      if (error) {
        setServerError(mapAuthError(error.message));
        setStatus("error");
        return;
      }

      // Supabase's anti-enumeration behaviour: signUp() on an email that's
      // already registered returns success (no error) but a user object
      // with an empty `identities` array and no session — otherwise this
      // would silently look like a brand-new "check your email" signup.
      if (data.user && data.user.identities?.length === 0) {
        setServerError("Этот email уже используется. Попробуйте войти.");
        setStatus("error");
        return;
      }

      if (data.session) {
        // Подтверждение email отключено в проекте — сессия уже создана.
        router.push(safeNextPath(nextPath));
        router.refresh();
        return;
      }

      // Подтверждение email включено — сессии ещё нет, пользователь не
      // считается вошедшим, пока не перейдёт по ссылке из письма.
      setStatus("check-email");
    } catch (err) {
      // Некоторые ошибки Supabase (например превышение лимита отправки
      // писем — реальный случай, пойманный при живом тестировании) SDK
      // выбрасывает как исключение, а не возвращает как {error} — тоже
      // должны показываться по-человечески, не только те, что пришли
      // через обычный путь выше.
      console.error("signUp threw unexpectedly:", err);
      setServerError(mapAuthError(err instanceof Error ? err.message : String(err)));
      setStatus("error");
    }
  }

  if (status === "check-email") {
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
          Мы отправили письмо на {email.trim()} — перейдите по ссылке из письма, чтобы подтвердить регистрацию.
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
        <FieldShell label="Имя" icon={<UserIcon />} htmlFor="register-name" error={fieldErrors.fullName}>
          <input
            id="register-name"
            type="text"
            autoComplete="name"
            placeholder="Введите имя"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (fieldErrors.fullName) setFieldErrors((f) => ({ ...f, fullName: undefined }));
            }}
            className="w-full bg-transparent outline-none text-[0.9375rem] text-[#0A0A0A] font-body placeholder:text-[#0A0A0A]/30"
          />
        </FieldShell>

        <FieldShell label="Email" icon={<MailIcon />} htmlFor="register-email" error={fieldErrors.email}>
          <input
            id="register-email"
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

        <FieldShell label="Пароль" icon={<LockIcon />} htmlFor="register-password" error={fieldErrors.password}>
          <input
            id="register-password"
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

        <FieldShell label="Повторите пароль" icon={<LockIcon />} htmlFor="register-confirm-password" error={fieldErrors.confirmPassword}>
          <input
            id="register-confirm-password"
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

        <ConsentCheckbox
          id="register-consent"
          checked={consentGiven}
          onChange={(v) => {
            setConsentGiven(v);
            if (fieldErrors.consentGiven) setFieldErrors((f) => ({ ...f, consentGiven: undefined }));
          }}
          error={fieldErrors.consentGiven}
        />

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
            {status === "loading" ? "Создаём аккаунт…" : "Зарегистрироваться"}
          </span>
          {status !== "loading" && (
            <span className="absolute inset-0 bg-[#8C7355] translate-y-full group-hover:translate-y-0 transition-transform duration-500" style={{ transitionTimingFunction: "cubic-bezier(0.25,0.46,0.45,0.94)" }} />
          )}
        </motion.button>

        <p className="text-center text-sm font-body text-[#0A0A0A]/50" style={{ letterSpacing: "0.01em" }}>
          Уже есть аккаунт?{" "}
          <Link
            href={nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login"}
            className="text-[#8C7355] underline underline-offset-2 hover:text-[#0A0A0A] transition-colors"
          >
            Войти
          </Link>
        </p>
      </form>
    </motion.div>
  );
}
