"use client";

import Link from "next/link";
import { CheckIcon } from "./icons";

export default function ConsentCheckbox({
  id,
  checked,
  onChange,
  error,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className={`flex items-start gap-3 rounded-[14px] border px-4 py-3.5 cursor-pointer transition-colors duration-300 ${
          error ? "border-[#B3564A]/50" : "border-[#0A0A0A]/10 hover:border-[#0A0A0A]/20"
        }`}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <span
          aria-hidden
          className="mt-0.5 shrink-0 w-5 h-5 rounded-[6px] border border-[#0A0A0A]/25 bg-white flex items-center justify-center transition-colors duration-200 peer-checked:bg-[#8C7355] peer-checked:border-[#8C7355] peer-focus-visible:ring-2 peer-focus-visible:ring-[#8C7355] peer-focus-visible:ring-offset-2"
        >
          {/* Driven directly by the `checked` prop, not a `peer-checked:` CSS
              selector — this icon is nested *inside* the peer's sibling
              <span>, one level too deep for Tailwind's peer variant (which
              only matches direct siblings of the peer, not their descendants).
              The box's own background color above is a true sibling of the
              input, so that one is fine as `peer-checked:`. */}
          <CheckIcon
            className={`w-3 h-3 text-white transition-all duration-150 ${
              checked ? "opacity-100 scale-100" : "opacity-0 scale-75"
            }`}
          />
        </span>
        <span className="text-[#0A0A0A]/70 text-sm font-body leading-relaxed" style={{ letterSpacing: "0.01em" }}>
          Я даю согласие на обработку персональных данных в соответствии с{" "}
          <Link
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[#8C7355] underline underline-offset-2 hover:text-[#0A0A0A] transition-colors"
          >
            Политикой конфиденциальности
          </Link>
        </span>
      </label>
      {error && (
        <p className="mt-1.5 ml-1 text-[#B3564A] text-xs font-body" style={{ letterSpacing: "0.02em" }}>
          {error}
        </p>
      )}
    </div>
  );
}
