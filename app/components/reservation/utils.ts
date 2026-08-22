export function formatRuPhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("8")) digits = "7" + digits.slice(1);
  if (digits.length && !digits.startsWith("7")) digits = "7" + digits;
  digits = digits.slice(0, 11);

  const rest = digits.slice(1);
  if (!digits) return "";

  let out = "+7";
  if (rest.length > 0) out += ` (${rest.slice(0, 3)}`;
  if (rest.length >= 3) out += ")";
  if (rest.length > 3) out += ` ${rest.slice(3, 6)}`;
  if (rest.length > 6) out += `-${rest.slice(6, 8)}`;
  if (rest.length > 8) out += `-${rest.slice(8, 10)}`;
  return out;
}

export function isRuPhoneComplete(formatted: string): boolean {
  return formatted.replace(/\D/g, "").length === 11;
}

// Deliberately loose (no lookahead-heavy RFC regex) — good enough to catch
// typos without rejecting valid addresses. Real delivery is only proven by
// actually sending mail to it, which is out of scope here.
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Formats a Date as a plain "YYYY-MM-DD" using its *local* components —
// avoids the UTC-shift bug `toISOString().slice(0,10)` has near midnight.
export function toDateOnlyISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function pluralizeGuests(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "гость";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "гостя";
  return "гостей";
}

// Operational hours aren't final yet (Этап 2 of gastromania-spec.md will
// supply the restaurant's real seating times) — these mirror the existing
// "starting at 19:00, 4-5 hour tasting menu" copy already on the page.
export const TIME_SLOTS = ["19:00", "19:30", "20:00", "20:30", "21:00", "21:30"];

export const GUEST_COUNTS = [1, 2, 3, 4, 5, 6];
