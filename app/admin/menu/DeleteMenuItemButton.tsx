"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMenuItem } from "./actions";
import { TrashIcon } from "../../components/reservation/icons";

export default function DeleteMenuItemButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    // A plain confirm() is enough for an internal admin tool — a custom
    // modal here would be more code to keep accessible (focus trap, Escape,
    // aria-modal — see Gallery.tsx's lightbox) for no real gain.
    if (!window.confirm(`Удалить «${name}» из меню? Это необратимо.`)) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteMenuItem(id);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="w-9 h-9 rounded-full flex items-center justify-center text-[#0A0A0A]/40 hover:text-[#B3564A] hover:bg-[#B3564A]/8 transition-colors duration-300 disabled:opacity-50"
        aria-label={`Удалить ${name}`}
      >
        <span className="w-4 h-4">
          <TrashIcon />
        </span>
      </button>
      {error && <p className="text-[#B3564A] text-xs font-body mt-1">{error}</p>}
    </div>
  );
}
