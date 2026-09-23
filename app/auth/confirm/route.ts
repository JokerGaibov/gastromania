import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Обменивает токен из ссылки в письме (восстановление пароля, а также
// подтверждение регистрации, если Supabase-шаблон письма когда-нибудь
// будет указывать сюда) на настоящую сессию через verifyOtp — тот же
// server-side механизм, который Supabase официально рекомендует для
// @supabase/ssr + App Router (Route Handler может писать cookies, в
// отличие от рендера Server Component — см. комментарий в
// lib/supabase/server.ts). `type` не импортируется как EmailOtpType из
// @supabase/supabase-js — сам тип объявлен как `... | (string & {})`,
// поэтому обычная строка и так ему присваивается.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      redirect(next);
    }
  }

  // Ссылка невалидна или устарела — в этом проекте единственный реальный
  // источник таких ссылок сейчас это восстановление пароля (см.
  // ForgotPasswordForm.tsx), поэтому ведём обратно туда с понятным поводом
  // запросить новую ссылку, а не на общий /login.
  redirect("/forgot-password?expired=1");
}
