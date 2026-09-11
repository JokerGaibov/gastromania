"use client";

import { useState, useTransition } from "react";
import { updateOrderStatus } from "./actions";

const ORDER_STATUS_LABELS: Record<string, string> = {
  new: "Новый",
  accepted: "Принят",
  preparing: "Готовится",
  ready: "Готов",
  out_for_delivery: "В доставке",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

const STATUS_OPTIONS = Object.keys(ORDER_STATUS_LABELS);

// Only order_status is ever sent from here — see actions.ts for why
// payment_status can't be (orders_guard_payment_status trigger). The
// unpaid branch below is a UX rule on top of that, not a security one:
// "кухня не начинает заказ, пока payment_status != paid" — so while
// unpaid, the only action offered is cancelling, not progressing the
// kitchen/delivery pipeline.
export default function OrderStatusControl({
  id,
  orderStatus,
  paymentStatus,
}: {
  id: string;
  orderStatus: string;
  paymentStatus: string;
}) {
  const [status, setStatus] = useState(orderStatus);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isPaid = paymentStatus === "paid";
  const isFinal = status === "cancelled" || status === "delivered";

  function apply(next: string) {
    const previous = status;
    setStatus(next);
    setError(null);
    startTransition(async () => {
      const result = await updateOrderStatus(id, next);
      if (!result.ok) {
        setStatus(previous);
        setError(result.error);
      }
    });
  }

  if (!isPaid) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <span
          className="label-refined px-3 py-1.5 rounded-full bg-[#0A0A0A]/5 text-[#0A0A0A]/50"
          style={{ fontSize: "0.625rem" }}
        >
          {ORDER_STATUS_LABELS[status] ?? status}
        </span>
        {!isFinal && (
          <button
            type="button"
            onClick={() => apply("cancelled")}
            disabled={isPending}
            className="label-refined text-[#B3564A]/70 hover:text-[#B3564A] transition-colors duration-300 disabled:opacity-50"
            style={{ fontSize: "0.625rem" }}
          >
            Отменить заказ
          </button>
        )}
        {error && <p className="text-[#B3564A] text-xs font-body">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <select
        value={status}
        disabled={isPending}
        onChange={(e) => apply(e.target.value)}
        className="rounded-[10px] border border-[#0A0A0A]/15 bg-white px-3 py-2 text-sm font-body text-[#0A0A0A] outline-none focus:border-[#8C7355] disabled:opacity-50"
      >
        {STATUS_OPTIONS.map((value) => (
          <option key={value} value={value}>
            {ORDER_STATUS_LABELS[value]}
          </option>
        ))}
      </select>
      {isPending && (
        <span className="w-3.5 h-3.5 rounded-full border-2 border-[#8C7355]/30 border-t-[#8C7355] animate-spin" />
      )}
      {error && <p className="text-[#B3564A] text-xs font-body">{error}</p>}
    </div>
  );
}
