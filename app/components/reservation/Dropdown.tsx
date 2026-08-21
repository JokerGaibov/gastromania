"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import FieldShell from "./FieldShell";
import { ChevronDownIcon } from "./icons";
import type { ReactNode } from "react";

export type DropdownOption = { value: string; label: string };

export default function Dropdown({
  id,
  label,
  icon,
  placeholder,
  options,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  icon: ReactNode;
  placeholder: string;
  options: DropdownOption[];
  value: string | null;
  onChange: (value: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((i) => Math.min(i + 1, options.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const opt = options[highlight];
        if (opt) {
          onChange(opt.value);
          setOpen(false);
          triggerRef.current?.focus();
        }
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, options, highlight, onChange]);

  const toggleOpen = () => {
    setHighlight(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen((v) => !v);
  };

  return (
    <div ref={rootRef} className="relative">
      <FieldShell label={label} icon={icon} error={error}>
        <button
          ref={triggerRef}
          id={id}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={toggleOpen}
          className={`w-full flex items-center justify-between gap-2 bg-transparent text-left text-[0.9375rem] font-body outline-none ${
            selected ? "text-[#0A0A0A]" : "text-[#0A0A0A]/30"
          }`}
        >
          <span className="truncate whitespace-nowrap min-w-0">{selected ? selected.label : placeholder}</span>
          <ChevronDownIcon
            className={`w-4 h-4 text-[#8C7355] transition-transform duration-300 shrink-0 ${open ? "rotate-180" : ""}`}
          />
        </button>
      </FieldShell>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute z-20 mt-2 w-full max-h-56 overflow-y-auto rounded-[14px] border border-[#0A0A0A]/10 bg-white shadow-[0_16px_40px_-8px_rgba(10,10,10,0.18)] py-1.5"
          >
            {options.map((opt, i) => (
              <li key={opt.value} role="option" aria-selected={opt.value === value}>
                <button
                  type="button"
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                  className={`w-full text-left px-4 py-2.5 text-[0.9375rem] font-body transition-colors duration-150 ${
                    opt.value === value
                      ? "text-[#8C7355] bg-[#8C7355]/8"
                      : i === highlight
                      ? "text-[#0A0A0A] bg-[#0A0A0A]/[0.04]"
                      : "text-[#0A0A0A]/80"
                  }`}
                >
                  {opt.label}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
