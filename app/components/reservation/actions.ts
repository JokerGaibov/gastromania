"use server";

import { createClient } from "@/lib/supabase/server";
import { isRuPhoneComplete, isValidEmail } from "./utils";

export type ReservationPayload = {
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  partySize: number | null;
  dateISO: string | null; // "YYYY-MM-DD"
  time: string | null; // "HH:MM"
  comment: string;
  consentGiven: boolean;
};

export type ReservationResult = { ok: true } | { ok: false; error: string };

// Mirrors the client-side checks in Reservation.tsx, but this is the copy
// that actually gates the database write — the client's validation only
// exists for instant UX feedback and can't be trusted on its own (req. 7).
// Consent is checked here too — a request without it never reaches the
// insert, regardless of what the client claims.
function validate(payload: ReservationPayload): string | null {
  if (!payload.guestName.trim()) return "Укажите имя.";
  if (!isRuPhoneComplete(payload.guestPhone)) return "Укажите номер телефона полностью.";
  if (!payload.dateISO) return "Выберите дату.";
  if (!payload.time) return "Выберите время.";
  if (!payload.partySize || payload.partySize < 1) return "Укажите количество гостей.";
  if (payload.guestEmail.trim() && !isValidEmail(payload.guestEmail.trim())) {
    return "Проверьте адрес email.";
  }
  if (!payload.consentGiven) {
    return "Нужно согласие на обработку персональных данных.";
  }
  return null;
}

export async function submitReservation(payload: ReservationPayload): Promise<ReservationResult> {
  const validationError = validate(payload);
  if (validationError) return { ok: false, error: validationError };

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The restaurant's real timezone isn't set anywhere yet — Этап 2 of
  // gastromania-spec.md hasn't landed a real address/location. Stored as the
  // wall-clock value the guest picked (no offset), interpreted in whatever
  // timezone the database session defaults to. Revisit once real operating
  // hours/timezone exist (see Блок 6.4 in gastromania-tasks.md for the same
  // open question on the delivery side).
  const reservedAt = `${payload.dateISO}T${payload.time}:00`;

  const { error } = await supabase.from("reservations").insert({
    profile_id: user?.id ?? null,
    guest_name: payload.guestName.trim(),
    guest_phone: payload.guestPhone,
    guest_email: payload.guestEmail.trim() || null,
    party_size: payload.partySize as number,
    reserved_at: reservedAt,
    comment: payload.comment.trim() || null,
    status: "new",
    // The moment consent was validated and accepted server-side — not a
    // client-supplied timestamp, and distinct from the column's own
    // `default now()` (which would just mean "row was inserted", not
    // "guest actually consented").
    consent_at: new Date().toISOString(),
  });

  if (error) {
    console.error("submitReservation: insert into reservations failed", error);
    return {
      ok: false,
      error: "Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам напрямую.",
    };
  }

  return { ok: true };
}
