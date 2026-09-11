// Pure presentation, no client interactivity — payment_status can't be
// changed from here or anywhere in the admin UI (orders_guard_payment_status
// trigger, 20260911230000, blocks it at the DB level regardless).
const PAYMENT_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "Ожидает оплаты", className: "bg-[#B3564A]/12 text-[#B3564A]" },
  paid: { label: "Оплачен", className: "bg-[#3F6B4F]/12 text-[#3F6B4F]" },
  failed: { label: "Оплата не прошла", className: "bg-[#B3564A]/12 text-[#B3564A]" },
  refunded: { label: "Возврат выполнен", className: "bg-[#8C7355]/15 text-[#8C7355]" },
  cancelled: { label: "Оплата отменена", className: "bg-[#0A0A0A]/8 text-[#0A0A0A]/50" },
};

export default function PaymentStatusBadge({ status }: { status: string }) {
  const config = PAYMENT_STATUS_CONFIG[status] ?? { label: status, className: "bg-[#0A0A0A]/8 text-[#0A0A0A]/50" };
  return (
    <span className={`label-refined px-3 py-1.5 rounded-full ${config.className}`} style={{ fontSize: "0.6875rem" }}>
      {config.label}
    </span>
  );
}
