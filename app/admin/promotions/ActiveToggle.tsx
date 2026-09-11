"use client";

import { useState, useTransition } from "react";
import { togglePromotionActive } from "./actions";

// Deliberate near-duplicate of app/admin/menu/StopListToggle.tsx (different
// labels/action) — same reasoning as ImageUpload.tsx in this folder: not
// touching the already-shipped, owner-tested menu version for this batch.
export default function ActiveToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const [active, setActive] = useState(isActive);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleToggle() {
    const next = !active;
    setActive(next);
    setError(null);
    startTransition(async () => {
      const result = await togglePromotionActive(id, next);
      if (!result.ok) {
        setActive(!next);
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        role="switch"
        aria-checked={active}
        aria-label={active ? "Снять с публикации" : "Опубликовать"}
        disabled={isPending}
        onClick={handleToggle}
        className={`relative w-16 h-9 rounded-full transition-colors duration-300 disabled:opacity-60 ${
          active ? "bg-[#3F6B4F]" : "bg-[#0A0A0A]/20"
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-7 h-7 rounded-full bg-white shadow-[0_2px_6px_rgba(10,10,10,0.25)] transition-transform duration-300 ${
            active ? "translate-x-7" : "translate-x-0"
          }`}
        />
      </button>
      <span
        className={`label-refined ${active ? "text-[#3F6B4F]" : "text-[#0A0A0A]/40"}`}
        style={{ fontSize: "0.625rem" }}
      >
        {active ? "Активна" : "Скрыта"}
      </span>
      {error && <p className="text-[#B3564A] text-xs font-body">{error}</p>}
    </div>
  );
}
