"use client";

import { useRouter } from "next/navigation";

export default function DateFilter({ currentDate }: { currentDate?: string }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-3">
      <input
        type="date"
        value={currentDate ?? ""}
        onChange={(e) => {
          const value = e.target.value;
          router.push(value ? `/admin/reservations?date=${value}` : "/admin/reservations");
        }}
        className="rounded-[10px] border border-[#0A0A0A]/15 bg-white px-3 py-2.5 text-sm font-body text-[#0A0A0A] outline-none focus:border-[#8C7355]"
      />
      {currentDate && (
        <button
          type="button"
          onClick={() => router.push("/admin/reservations")}
          className="label-refined text-[#0A0A0A]/50 hover:text-[#0A0A0A] transition-colors duration-300"
        >
          Сбросить
        </button>
      )}
    </div>
  );
}
