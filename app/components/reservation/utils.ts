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

// Время бронирования: с 10:00 до 23:00 включительно, шаг 30 минут (27 слотов).
// Один список для формы и для серверной проверки в actions.ts.
function buildTimeSlots(fromHour: number, toHour: number): string[] {
  const slots: string[] = [];
  for (let h = fromHour; h <= toHour; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    if (h < toHour) slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  return slots;
}

export const TIME_SLOTS = buildTimeSlots(10, 23);

// Верхней границы в базе нет (party_size int not null). 20 — предел выбора в
// форме; большие компании ресторан согласует отдельно по телефону.
export const MAX_GUESTS = 20;
export const GUEST_COUNTS = Array.from({ length: MAX_GUESTS }, (_, i) => i + 1);

// С этого количества гостей показываем подсказку про подтверждение менеджером.
// Отправку брони она не блокирует.
export const LARGE_PARTY_FROM = 7;
