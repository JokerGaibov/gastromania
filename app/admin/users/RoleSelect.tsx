"use client";

import { useState, useTransition } from "react";
import { ALL_ROLES } from "@/lib/auth/roles";
import { updateUserRole } from "./actions";

export default function RoleSelect({ id, role }: { id: string; role: string }) {
  const [value, setValue] = useState(role);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(next: string) {
    const previous = value;
    setValue(next); // optimistic — reverted below if the write is refused
    setError(null);
    startTransition(async () => {
      const result = await updateUserRole(id, next);
      if (!result.ok) {
        setValue(previous);
        setError(result.error);
      }
    });
  }

  return (
    <div className="w-full sm:w-auto">
      <select
        value={value}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full sm:w-auto rounded-[10px] border border-[#0A0A0A]/15 bg-white px-3 py-2.5 text-sm font-body text-[#0A0A0A] outline-none focus:border-[#8C7355] disabled:opacity-50"
      >
        {ALL_ROLES.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      {error && <p className="text-[#B3564A] text-xs font-body mt-1 max-w-[220px]">{error}</p>}
    </div>
  );
}
