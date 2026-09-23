"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart/CartContext";
import CancelOrderButton from "./CancelOrderButton";
import { prepareRepeatOrder } from "./actions";
import { isActiveOrder, orderStatusLabel, paymentStatusLabel } from "./constants";

export type AccountOrderItem = {
  id: string;
  name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
};

export type AccountOrder = {
  id: string;
  order_number: number;
  created_at: string;
  order_status: string;
  payment_status: string;
  total_amount: number;
  delivery_fee: number;
  delivery_address: string;
  comment: string | null;
  was_revised: boolean;
  items: AccountOrderItem[];
};

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function StatusBadges({ order }: { order: AccountOrder }) {
  const isCancelled = order.order_status === "cancelled";
  const isDelivered = order.order_status === "delivered";
  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:flex-col sm:items-end">
      <span
        className={`label-refined px-3 py-1 rounded-full ${
          isCancelled
            ? "bg-[#B3564A]/12 text-[#B3564A]"
            : isDelivered
              ? "bg-[#3F6B4F]/10 text-[#3F6B4F]"
              : "bg-[#0A0A0A]/5 text-[#0A0A0A]/70"
        }`}
        style={{ fontSize: "0.625rem" }}
      >
        {orderStatusLabel(order.order_status)}
      </span>
      {/* У отменённого заказа статус оплаты уже не имеет смысла — красное
          «Ожидает оплаты» рядом с «Отменён» только пугало бы клиента. */}
      {!isCancelled && (
        <span
          className={`label-refined px-3 py-1 rounded-full ${
            order.payment_status === "paid"
              ? "bg-[#3F6B4F]/10 text-[#3F6B4F]"
              : "bg-[#B3564A]/10 text-[#B3564A]"
          }`}
          style={{ fontSize: "0.625rem" }}
        >
          {paymentStatusLabel(order.payment_status)}
        </span>
      )}
    </div>
  );
}

function OrderDetails({ order }: { order: AccountOrder }) {
  const itemsSubtotal = order.total_amount - order.delivery_fee;
  return (
    <div className="mt-3 pt-3 border-t border-[#0A0A0A]/8 flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between gap-3 text-sm font-body">
            <span className="text-[#0A0A0A]/70 min-w-0">
              {item.name}
              <span className="text-[#0A0A0A]/40">
                {" "}
                × {item.quantity} · {item.unit_price} ₽
              </span>
            </span>
            <span className="text-[#0A0A0A]/70 shrink-0">{item.subtotal} ₽</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1 text-sm font-body">
        <div className="flex justify-between text-[#0A0A0A]/60">
          <span>Блюда</span>
          <span>{itemsSubtotal} ₽</span>
        </div>
        <div className="flex justify-between text-[#0A0A0A]/60">
          <span>Доставка</span>
          <span>{order.delivery_fee === 0 ? "бесплатно" : `${order.delivery_fee} ₽`}</span>
        </div>
        <div className="flex justify-between text-[#0A0A0A] font-medium pt-1.5 border-t border-[#0A0A0A]/8">
          <span>Итого</span>
          <span>{order.total_amount} ₽</span>
        </div>
      </div>

      <div className="flex flex-col gap-1 text-sm font-body text-[#0A0A0A]/60">
        <div className="flex gap-2">
          <span className="text-[#0A0A0A]/40 shrink-0">Адрес:</span>
          <span>{order.delivery_address}</span>
        </div>
        {order.comment && (
          <div className="flex gap-2">
            <span className="text-[#0A0A0A]/40 shrink-0">Комментарий:</span>
            <span className="italic">«{order.comment}»</span>
          </div>
        )}
        <div className="flex gap-2">
          <span className="text-[#0A0A0A]/40 shrink-0">Оформлен:</span>
          <span>{formatDateTime(order.created_at)}</span>
        </div>
      </div>

      {order.was_revised && (
        <div className="rounded-[10px] border border-[#8C7355]/25 bg-[#8C7355]/[0.06] px-4 py-2.5">
          <p className="text-[#8C7355] text-xs font-body">
            Заказ был изменён рестораном по согласованию
          </p>
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, isHistory }: { order: AccountOrder; isHistory: boolean }) {
  const router = useRouter();
  const cart = useCart();
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [repeatError, setRepeatError] = useState<string | null>(null);
  const [repeatSkipped, setRepeatSkipped] = useState<string[] | null>(null);

  const isCancelled = order.order_status === "cancelled";
  // Те же два условия проверяет cancel_own_order() в БД — здесь это только
  // вопрос показывать кнопку или нет.
  const canSelfCancel = order.order_status === "new" && order.payment_status === "pending";

  function handleRepeat() {
    setRepeatError(null);
    setRepeatSkipped(null);
    startTransition(async () => {
      const result = await prepareRepeatOrder(order.id);
      if (!result.ok) {
        setRepeatError(result.error);
        return;
      }
      if (result.lines.length === 0) {
        setRepeatError("Ни одну позицию из этого заказа сейчас повторить нельзя.");
        setRepeatSkipped(result.unavailable);
        return;
      }
      // Добавляем поверх текущей корзины, а не заменяем её — уже
      // набранное клиентом молча терять нельзя.
      for (const line of result.lines) {
        cart.addItem(
          {
            menuItemId: line.menuItemId,
            name: line.name,
            price: line.price,
            imageUrl: line.imageUrl,
          },
          line.quantity
        );
      }
      if (result.unavailable.length > 0) {
        // Часть позиций недоступна — показываем, что именно не повторилось,
        // и не уводим со страницы, чтобы это сообщение успели прочитать.
        setRepeatSkipped(result.unavailable);
        return;
      }
      router.push("/delivery");
    });
  }

  return (
    <div
      className={`rounded-[20px] border border-[#0A0A0A]/8 bg-white p-5 sm:p-6 shadow-[0_4px_16px_-8px_rgba(10,10,10,0.08)] ${
        isCancelled ? "opacity-70" : ""
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-[#0A0A0A] font-body font-medium text-[0.9375rem]">Заказ #{order.order_number}</p>
          <p className="text-[#0A0A0A]/40 text-xs font-body">{formatDateTime(order.created_at)}</p>
        </div>
        <StatusBadges order={order} />
      </div>

      {/* Краткий состав — только в актуальных и только пока детали
          свёрнуты: в развёрнутом виде полный список идёт ниже, и два
          одинаковых перечня подряд только путали бы. В истории карточка
          остаётся компактной, состав открывается «Подробнее». */}
      {!isHistory && !expanded && (
        <div className="flex flex-col gap-1.5 mb-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-3 text-sm font-body text-[#0A0A0A]/70">
              <span className="min-w-0 truncate">
                {item.name} × {item.quantity}
              </span>
              <span className="shrink-0">{item.subtotal} ₽</span>
            </div>
          ))}
        </div>
      )}

      {/* В развёрнутом виде итог идёт в общей разбивке ниже — дублировать
          его здесь не нужно. */}
      {!expanded && (
        <div className="flex justify-between text-[#0A0A0A] font-medium text-sm font-body pt-3 border-t border-[#0A0A0A]/8">
          <span>Итого</span>
          <span>{order.total_amount} ₽</span>
        </div>
      )}

      {expanded && <OrderDetails order={order} />}

      {(repeatError || repeatSkipped) && (
        <div className="mt-4 rounded-[10px] border border-[#B3564A]/25 bg-[#B3564A]/[0.06] px-4 py-3">
          {repeatError && <p className="text-[#B3564A] text-sm font-body">{repeatError}</p>}
          {repeatSkipped && repeatSkipped.length > 0 && (
            <p className="text-[#B3564A] text-xs font-body mt-1">
              Сейчас недоступно: {repeatSkipped.join(", ")}.
              {!repeatError && " Остальное добавлено в корзину."}
            </p>
          )}
          {repeatSkipped && !repeatError && (
            <Link
              href="/delivery"
              className="label-refined text-[#8C7355] hover:text-[#0A0A0A] transition-colors duration-300 inline-block mt-2"
              style={{ fontSize: "0.625rem" }}
            >
              Перейти в корзину →
            </Link>
          )}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-[#0A0A0A]/8 flex flex-wrap items-center gap-x-5 gap-y-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="label-refined text-[#8C7355] hover:text-[#0A0A0A] transition-colors duration-300"
          style={{ fontSize: "0.625rem" }}
        >
          {expanded ? "Свернуть" : "Подробнее"}
        </button>

        {isHistory && (
          <button
            type="button"
            onClick={handleRepeat}
            disabled={isPending}
            className="label-refined text-[#0A0A0A]/60 hover:text-[#0A0A0A] transition-colors duration-300 disabled:opacity-50"
            style={{ fontSize: "0.625rem" }}
          >
            {isPending ? "Добавляем…" : "Повторить заказ"}
          </button>
        )}

        {canSelfCancel && <CancelOrderButton orderId={order.id} orderNumber={order.order_number} />}
      </div>
    </div>
  );
}

export default function OrdersTabs({ orders }: { orders: AccountOrder[] }) {
  const [tab, setTab] = useState<"active" | "history">("active");

  const { active, history } = useMemo(() => {
    const active: AccountOrder[] = [];
    const history: AccountOrder[] = [];
    for (const order of orders) {
      (isActiveOrder(order.order_status) ? active : history).push(order);
    }
    return { active, history };
  }, [orders]);

  const shown = tab === "active" ? active : history;

  return (
    <div className="max-w-2xl">
      {/* Вкладки: на узком экране занимают всю ширину пополам, на десктопе
          сжимаются по содержимому. */}
      <div className="flex gap-2 mb-6">
        {(
          [
            { key: "active" as const, label: "Актуальные заказы", count: active.length },
            { key: "history" as const, label: "История заказов", count: history.length },
          ]
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 sm:flex-none label-refined px-4 sm:px-5 py-2.5 rounded-full border transition-colors duration-300 ${
              tab === t.key
                ? "bg-[#0A0A0A] border-[#0A0A0A] text-[#F5F0E8]"
                : "border-[#0A0A0A]/15 text-[#0A0A0A]/60 hover:border-[#8C7355]"
            }`}
            style={{ fontSize: "0.625rem" }}
          >
            {t.label}
            {t.count > 0 && ` · ${t.count}`}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="rounded-[20px] border border-[#0A0A0A]/8 bg-white p-8 sm:p-10 text-center">
          <p className="text-[#0A0A0A]/50 text-sm font-body mb-6">
            {tab === "active"
              ? "Активных заказов сейчас нет."
              : "Завершённых заказов пока нет."}
          </p>
          <Link
            href="/delivery"
            className="label-refined text-[#8C7355] hover:text-[#0A0A0A] transition-colors duration-300"
          >
            Перейти к меню
          </Link>
        </div>
      ) : (
        <div className="grid gap-5">
          {shown.map((order) => (
            <OrderCard key={order.id} order={order} isHistory={tab === "history"} />
          ))}
        </div>
      )}
    </div>
  );
}
