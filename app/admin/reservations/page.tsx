import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canAccessAdminPanel } from "@/lib/auth/roles";
import ReservationsTable from "./ReservationsTable";
import DateFilter from "./DateFilter";

export const metadata: Metadata = {
  title: "Брони — Gastromania",
};

export default async function AdminReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const supabase = await createClient();

  // Re-checked here too, same reasoning as app/admin/page.tsx: layouts
  // don't re-run on every client-side navigation between sibling pages, so
  // each page under app/admin/layout.tsx verifies itself rather than
  // trusting that render. RLS (is_staff()) is still the real backstop for
  // the data fetch below regardless of this check.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/reservations");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!canAccessAdminPanel(profile?.role)) redirect("/admin");

  let query = supabase
    .from("reservations")
    .select("id, guest_name, guest_phone, guest_email, party_size, reserved_at, comment, status")
    // Soonest upcoming first — the operationally useful default for a host
    // deciding who's coming in next, not insertion order.
    .order("reserved_at", { ascending: true });

  if (date) {
    // reserved_at is a plain timestamp with no restaurant timezone attached
    // yet — same open question already logged against the public booking
    // form (reservation/actions.ts) and Блок 6.4 in gastromania-tasks.md.
    // Filtering by the calendar-day bounds of the stored wall-clock value.
    query = query.gte("reserved_at", `${date}T00:00:00`).lt("reserved_at", `${date}T23:59:59.999`);
  }

  const { data: reservations, error } = await query;

  if (error) {
    console.error("AdminReservationsPage: failed to load reservations", error);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-8">
        <div>
          <span className="label-refined text-[#8C7355] block mb-2">Персонал</span>
          <h1 className="heading-editorial text-[#0A0A0A]" style={{ fontSize: "clamp(1.75rem,3vw,2.25rem)" }}>
            Брони
          </h1>
        </div>
        <DateFilter currentDate={date} />
      </div>

      {error ? (
        <p className="text-[#B3564A] text-sm font-body">Не удалось загрузить брони. Обновите страницу.</p>
      ) : !reservations || reservations.length === 0 ? (
        <p className="text-[#0A0A0A]/45 text-sm font-body">
          {date ? "На эту дату броней нет." : "Броней пока нет."}
        </p>
      ) : (
        <ReservationsTable reservations={reservations} />
      )}
    </div>
  );
}
