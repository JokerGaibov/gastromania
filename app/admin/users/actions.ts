"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ALL_ROLES } from "@/lib/auth/roles";

const VALID_ROLES = ALL_ROLES.map((r) => r.value);

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, ok: false as const, error: "Требуется вход." };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return { supabase, ok: false as const, error: "Только администратор может менять роли." };
  }
  return { supabase, ok: true as const };
}

export async function updateUserRole(id: string, role: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    return { ok: false, error: "Некорректная роль." };
  }

  // Friendly pre-check for the common case — guard_profile_role_change
  // (see the 20260911200000 migration) is the real backstop for both the
  // admin-only check above and this one; a raw DB exception would still
  // block an unsafe change even if this count were somehow stale.
  const { data: target } = await auth.supabase.from("profiles").select("role").eq("id", id).single();
  if (target?.role === "admin" && role !== "admin") {
    const { count } = await auth.supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin")
      .neq("id", id);
    if (!count) {
      return { ok: false, error: "Нельзя понизить последнего администратора." };
    }
  }

  const { error } = await auth.supabase.from("profiles").update({ role }).eq("id", id);

  if (error) {
    console.error("updateUserRole: update failed", error);
    // The trigger's own exception text (e.g. "Нельзя понизить последнего
    // администратора") is ours and safe to surface — not a raw Postgres
    // internals leak.
    return { ok: false, error: error.message || "Не удалось изменить роль." };
  }

  revalidatePath("/admin/users");
  return { ok: true };
}
