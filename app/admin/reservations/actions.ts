"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canAccessAdminPanel } from "@/lib/auth/roles";

const VALID_STATUSES = ["new", "confirmed", "cancelled", "completed"] as const;
type ReservationStatus = (typeof VALID_STATUSES)[number];

export type UpdateStatusResult = { ok: true } | { ok: false; error: string };

export async function updateReservationStatus(
  id: string,
  status: string
): Promise<UpdateStatusResult> {
  if (!VALID_STATUSES.includes(status as ReservationStatus)) {
    return { ok: false, error: "Некорректный статус." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Требуется вход." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Belt-and-suspenders: RLS (reservations_admin_manage → is_staff(), see
  // the 20260911140000 migration) is the real backstop, this just turns a
  // raw Postgres denial into a clean message in the UI.
  if (!canAccessAdminPanel(profile?.role)) {
    return { ok: false, error: "Недостаточно прав." };
  }

  const { error } = await supabase
    .from("reservations")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("updateReservationStatus: update failed", error);
    return { ok: false, error: "Не удалось изменить статус. Попробуйте ещё раз." };
  }

  revalidatePath("/admin/reservations");
  return { ok: true };
}
