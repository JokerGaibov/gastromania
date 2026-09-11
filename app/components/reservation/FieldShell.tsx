"use client";

import { ReactNode } from "react";

/**
 * Visual chrome shared by every reservation field: card surface, border,
 * radius, shadow, hover lift, and a bronze focus ring. Relies on
 * `:focus-within` so it lights up identically whether the child is a native
 * input or a custom popover trigger button (both become the focused element
 * inside this wrapper).
 */
export default function FieldShell({
  label,
  icon,
  htmlFor,
  error,
  children,
}: {
  label: string;
  icon?: ReactNode;
  htmlFor?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div
        className={`group rounded-[14px] border bg-white px-4 py-3 transition-all duration-300 ${
          error
            ? "border-[#B3564A]/50"
            : "border-[#0A0A0A]/10 hover:border-[#0A0A0A]/20 focus-within:border-[#8C7355]"
        } shadow-[0_1px_3px_rgba(10,10,10,0.04)] hover:shadow-[0_6px_20px_-4px_rgba(10,10,10,0.08)] focus-within:shadow-[0_0_0_4px_rgba(140,115,85,0.12),0_8px_24px_-6px_rgba(140,115,85,0.2)]`}
      >
        <label
          htmlFor={htmlFor}
          className="flex items-center gap-2 mb-1 text-[#8C7355]"
        >
          {icon && <span className="w-3.5 h-3.5 shrink-0 [&>svg]:w-full [&>svg]:h-full">{icon}</span>}
          <span className="label-refined" style={{ fontSize: "0.625rem" }}>
            {label}
          </span>
        </label>
        {children}
      </div>
      {error && (
        <p className="mt-1.5 ml-1 text-[#B3564A] text-xs font-body" style={{ letterSpacing: "0.02em" }}>
          {error}
        </p>
      )}
    </div>
  );
}
