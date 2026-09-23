"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const DEFAULT_CLASS_NAME = "label-refined text-[#0A0A0A]/60 hover:text-[#0A0A0A] transition-colors duration-300 disabled:opacity-50";

// Общий компонент для /admin (AdminShell, экран "Доступ запрещён") и
// публичной навигации (Navigation.tsx) — поведение выхода должно быть
// одинаковым везде, поэтому не дублируется, а переиспользуется с другим
// className под тёмную/светлую тему вызывающей стороны.
export default function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    // На главную, а не на /login — logout доступен из любой публичной
    // страницы, не только из мест, где следующим шагом логично снова
    // входить. /admin всё равно немедленно требует новый вход — сессии
    // больше нет, это гарантирует signOut() + refresh() ниже, а не то,
    // куда именно редиректим.
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={className ?? DEFAULT_CLASS_NAME}
    >
      {loading ? "Выходим…" : "Выйти"}
    </button>
  );
}
