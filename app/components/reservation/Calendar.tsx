"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import FieldShell from "./FieldShell";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "./icons";

const WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
// Restaurant is open Tuesday–Saturday (see the copy in the left column) —
// closed Sunday (0) and Monday (1).
const CLOSED_WEEKDAYS = [0, 1];

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function buildMonthGrid(viewMonth: Date) {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  // Convert JS's Sunday-first getDay() to a Monday-first offset.
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = Array(leadingBlanks).fill(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));
  return cells;
}

export default function Calendar({
  id,
  label,
  placeholder,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: Date | null;
  onChange: (date: Date) => void;
  error?: string;
}) {
  const today = startOfDay(new Date());
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(startOfDay(value ?? today));
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

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
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const cells = buildMonthGrid(viewMonth);
  const monthLabel = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(viewMonth);
  const displayValue = value
    ? new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(value)
    : null;

  const isDisabled = (d: Date) => d < today || CLOSED_WEEKDAYS.includes(d.getDay());

  return (
    <div ref={rootRef} className="relative">
      <FieldShell label={label} icon={<CalendarIcon />} error={error}>
        <button
          ref={triggerRef}
          id={id}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={`block w-full truncate whitespace-nowrap text-left bg-transparent text-[0.9375rem] font-body outline-none ${
            displayValue ? "text-[#0A0A0A]" : "text-[#0A0A0A]/30"
          }`}
        >
          {displayValue ?? placeholder}
        </button>
      </FieldShell>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Выбор даты"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute z-20 mt-2 w-[300px] rounded-[16px] border border-[#0A0A0A]/10 bg-white shadow-[0_16px_40px_-8px_rgba(10,10,10,0.18)] p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                aria-label="Предыдущий месяц"
                onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                className="p-1 text-[#0A0A0A]/50 hover:text-[#8C7355] transition-colors"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <span className="label-refined text-[#0A0A0A]/70 capitalize" style={{ fontSize: "0.6875rem" }}>
                {monthLabel}
              </span>
              <button
                type="button"
                aria-label="Следующий месяц"
                onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                className="p-1 text-[#0A0A0A]/50 hover:text-[#8C7355] transition-colors"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-y-1 mb-1">
              {WEEKDAY_LABELS.map((d) => (
                <span key={d} className="text-center text-[#0A0A0A]/35" style={{ fontSize: "0.625rem" }}>
                  {d}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1">
              {cells.map((date, i) => {
                if (!date) return <span key={i} />;
                const disabled = isDisabled(date);
                const selected = value && isSameDay(date, value);
                const isToday = isSameDay(date, today);
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      onChange(date);
                      setOpen(false);
                      triggerRef.current?.focus();
                    }}
                    className={`mx-auto w-8 h-8 rounded-full text-sm font-body transition-colors duration-150 ${
                      selected
                        ? "bg-[#8C7355] text-white"
                        : disabled
                        ? "text-[#0A0A0A]/15 cursor-not-allowed"
                        : isToday
                        ? "text-[#8C7355] border border-[#8C7355]/40 hover:bg-[#8C7355]/10"
                        : "text-[#0A0A0A]/75 hover:bg-[#0A0A0A]/[0.06]"
                    }`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
