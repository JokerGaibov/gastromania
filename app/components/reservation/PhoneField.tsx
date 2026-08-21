"use client";

import FieldShell from "./FieldShell";
import { PhoneIcon } from "./icons";
import { formatRuPhone } from "./utils";

export default function PhoneField({
  id,
  value,
  onChange,
  error,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <FieldShell label="Телефон" icon={<PhoneIcon />} htmlFor={id} error={error}>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="+7 (___) ___-__-__"
        value={value}
        onChange={(e) => onChange(formatRuPhone(e.target.value))}
        className="w-full bg-transparent outline-none text-[0.9375rem] text-[#0A0A0A] font-body placeholder:text-[#0A0A0A]/30"
      />
    </FieldShell>
  );
}
