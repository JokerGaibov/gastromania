"use client";

import { useState, useTransition } from "react";
import { cancelOwnOrder } from "./actions";

// Показывается только когда заказ одновременно new + pending — решение об
// этом принимает страница (page.tsx). Здесь же двухшаговое подтверждение,
// чтобы отмена не срабатывала с одного случайного нажатия.
export default function CancelOrderButton({
  orderId,
  orderNumber,
}: {
  orderId: string;
  orderNumber: number;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleCancel() {
    setError(null);
    startTransition(async () => {
      const result = await cancelOwnOrder(orderId);
      if (!result.ok) {
        setError(result.error);
        setConfirming(false);
        return;
      }
      setConfirming(false);
    });
  }

  if (!confirming) {
    return (
      <div className="flex flex-col items-start gap-1">
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={isPending}
          className="label-refined text-[#B3564A]/80 hover:text-[#B3564A] transition-colors duration-300 disabled:opacity-50"
          style={{ fontSize: "0.625rem" }}
        >
          Отменить заказ
        </button>
        {error && <p className="text-[#B3564A] text-xs font-body">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-[12px] border border-[#B3564A]/30 bg-[#B3564A]/[0.06] px-4 py-3 w-full">
      <p className="text-[#0A0A0A]/75 text-sm font-body mb-3">Отменить заказ #{orderNumber}?</p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isPending}
          className="label-refined rounded-[10px] bg-[#B3564A] text-white px-4 py-2.5 hover:bg-[#0A0A0A] transition-colors duration-300 disabled:opacity-50"
          style={{ fontSize: "0.625rem" }}
        >
          {isPending ? "Отменяем…" : "Да, отменить"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={isPending}
          className="label-refined text-[#0A0A0A]/50 hover:text-[#0A0A0A] transition-colors disabled:opacity-50"
          style={{ fontSize: "0.625rem" }}
        >
          Не отменять
        </button>
      </div>
      {error && <p className="text-[#B3564A] text-xs font-body mt-2">{error}</p>}
    </div>
  );
}
