"use client";

import { useState, useTransition } from "react";
import { updateReservationStatus } from "./actions";

export type ReservationRow = {
  id: string;
  guest_name: string;
  guest_phone: string;
  guest_email: string | null;
  party_size: number;
  reserved_at: string;
  comment: string | null;
  status: string;
};

const STATUS_LABELS: Record<string, string> = {
  new: "Новая",
  confirmed: "Подтверждена",
  cancelled: "Отменена",
  completed: "Завершена",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-[#8C7355]/10 text-[#8C7355]",
  confirmed: "bg-[#3F6B4F]/10 text-[#3F6B4F]",
  cancelled: "bg-[#B3564A]/10 text-[#B3564A]",
  completed: "bg-[#0A0A0A]/8 text-[#0A0A0A]/50",
};

function formatReservedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function ReservationCard({ reservation }: { reservation: ReservationRow }) {
  const [status, setStatus] = useState(reservation.status);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleStatusChange(next: string) {
    const previous = status;
    setStatus(next); // optimistic — reverted below if the write fails
    setError(null);
    startTransition(async () => {
      const result = await updateReservationStatus(reservation.id, next);
      if (!result.ok) {
        setStatus(previous);
        setError(result.error);
      }
    });
  }

  return (
    <div className="rounded-[18px] border border-[#0A0A0A]/8 bg-white p-5 sm:p-6 shadow-[0_4px_16px_-8px_rgba(10,10,10,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-[#0A0A0A] font-body font-medium text-[0.9375rem] mb-1">{reservation.guest_name}</p>
          <p className="text-[#0A0A0A]/45 text-xs font-body">{formatReservedAt(reservation.reserved_at)}</p>
        </div>
        <span
          className={`label-refined px-3 py-1.5 rounded-full ${STATUS_COLORS[status] ?? "bg-[#0A0A0A]/8 text-[#0A0A0A]/50"}`}
          style={{ fontSize: "0.625rem" }}
        >
          {STATUS_LABELS[status] ?? status}
        </span>
      </div>

      <div className="grid sm:grid-cols-3 gap-x-6 gap-y-2 mb-4 text-sm font-body">
        <a href={`tel:${reservation.guest_phone}`} className="text-[#8C7355] underline underline-offset-2">
          {reservation.guest_phone}
        </a>
        {reservation.guest_email && <span className="text-[#0A0A0A]/60">{reservation.guest_email}</span>}
        <span className="text-[#0A0A0A]/60">{reservation.party_size} гостей</span>
      </div>

      {reservation.comment && (
        <p className="text-[#0A0A0A]/50 text-sm font-body mb-4 italic">«{reservation.comment}»</p>
      )}

      <div className="flex items-center gap-3">
        <select
          value={status}
          disabled={isPending}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="rounded-[10px] border border-[#0A0A0A]/15 bg-white px-3 py-2.5 text-sm font-body text-[#0A0A0A] outline-none focus:border-[#8C7355] disabled:opacity-50"
        >
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {isPending && (
          <span className="w-3.5 h-3.5 rounded-full border-2 border-[#8C7355]/30 border-t-[#8C7355] animate-spin" />
        )}
      </div>
      {error && <p className="text-[#B3564A] text-xs font-body mt-2">{error}</p>}
    </div>
  );
}

export default function ReservationsTable({ reservations }: { reservations: ReservationRow[] }) {
  return (
    <div className="grid gap-4">
      {reservations.map((r) => (
        <ReservationCard key={r.id} reservation={r} />
      ))}
    </div>
  );
}
