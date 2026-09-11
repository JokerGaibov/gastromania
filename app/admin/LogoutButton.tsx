"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="label-refined text-[#0A0A0A]/60 hover:text-[#0A0A0A] transition-colors duration-300 disabled:opacity-50"
    >
      {loading ? "Выходим…" : "Выйти"}
    </button>
  );
}
