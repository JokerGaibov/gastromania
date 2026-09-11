"use client";

import { useState, useTransition } from "react";
import { toggleMenuItemActive } from "./actions";

// The "крупный заметный тумблер" from gastromania-spec.md — has to be
// operable in a few seconds from a phone during dinner service, so it's a
// big tap target (64×36px) with its own color + text label, not a small
// checkbox someone could miss under pressure.
export default function StopListToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const [active, setActive] = useState(isActive);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleToggle() {
    const next = !active;
    setActive(next); // optimistic — reverted below if the write fails
    setError(null);
    startTransition(async () => {
      const result = await toggleMenuItemActive(id, next);
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
        aria-label={active ? "Снять со стоп-листа" : "Поставить в стоп-лист"}
        disabled={isPending}
        onClick={handleToggle}
        className={`relative w-16 h-9 rounded-full transition-colors duration-300 disabled:opacity-60 ${
          active ? "bg-[#3F6B4F]" : "bg-[#B3564A]"
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-7 h-7 rounded-full bg-white shadow-[0_2px_6px_rgba(10,10,10,0.25)] transition-transform duration-300 ${
            active ? "translate-x-7" : "translate-x-0"
          }`}
        />
      </button>
      <span
        className={`label-refined ${active ? "text-[#3F6B4F]" : "text-[#B3564A]"}`}
        style={{ fontSize: "0.625rem" }}
      >
        {active ? "В наличии" : "Стоп-лист"}
      </span>
      {error && <p className="text-[#B3564A] text-xs font-body">{error}</p>}
    </div>
  );
}
