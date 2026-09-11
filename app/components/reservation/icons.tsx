// Hand-drawn line icons (stroke-based, 24x24) matching the field-card visual
// language. Kept local rather than pulling in an icon library — the project
// has no UI/component dependencies by design (see main.md — Architectural
// Decisions).

type IconProps = { className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="16" y1="3" x2="16" y2="7" />
      <line x1="4" y1="9.5" x2="20" y2="9.5" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="8.25" />
      <line x1="12" y1="12" x2="12" y2="7.5" />
      <line x1="12" y1="12" x2="15.2" y2="14" />
    </svg>
  );
}

export function UsersIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5" />
      <circle cx="17" cy="8.5" r="2.4" />
      <path d="M15.5 13.6c2.3.3 4 2.3 4 5.4" />
    </svg>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 19.5c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5" />
    </svg>
  );
}

export function PhoneIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="7.5" y="2.5" width="9" height="19" rx="2.2" />
      <line x1="10.3" y1="18" x2="13.7" y2="18" />
    </svg>
  );
}

export function MailIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="M3.5 6.5l8.5 6.5 8.5-6.5" />
    </svg>
  );
}

export function NoteIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="4" y="3.5" width="16" height="17" rx="2" />
      <line x1="7.5" y1="9" x2="16.5" y2="9" />
      <line x1="7.5" y1="13" x2="16.5" y2="13" />
      <line x1="7.5" y1="17" x2="13" y2="17" />
    </svg>
  );
}

export function LockIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <polyline points="14.5 6 9 12 14.5 18" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <polyline points="9.5 6 15 12 9.5 18" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={2}>
      <polyline points="5 12.5 10 17 19 7" />
    </svg>
  );
}
