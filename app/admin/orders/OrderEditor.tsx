"use client";

import { useMemo, useState, useTransition } from "react";
import { updateOrderItems } from "./actions";
import { REASON_CODES } from "./constants";

export type EditableOrderItem = {
  id: string;
  menu_item_id: string | null;
  name: string;
  unit_price: number;
  quantity: number;
};

export type PickableMenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
};

type DraftLine = {
  key: string;
  menuItemId: string | null;
  name: string;
  unitPrice: number;
  quantity: number;
  // Позиция из заказа, которой больше нет в активном меню (блюдо удалили
  // или сняли с продажи). Сохранить её обратно невозможно — RPC принимает
  // только активные menu_item_id — поэтому она показывается отдельно и
  // исчезнет при сохранении. Молча терять её нельзя: админ должен видеть,
  // что именно уходит из заказа.
  unavailable: boolean;
};

function formatMoney(value: number): string {
  return `${Math.round(value * 100) / 100} ₽`;
}

export default function OrderEditor({
  orderId,
  orderNumber,
  items,
  comment,
  deliveryFee,
  oldTotal,
  paymentStatus,
  paidAmount,
  menuItems,
}: {
  orderId: string;
  orderNumber: number;
  items: EditableOrderItem[];
  comment: string | null;
  deliveryFee: number;
  oldTotal: number;
  paymentStatus: string;
  paidAmount: number | null;
  menuItems: PickableMenuItem[];
}) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const activeIds = useMemo(() => new Set(menuItems.map((m) => m.id)), [menuItems]);

  const [lines, setLines] = useState<DraftLine[]>(() =>
    items.map((item) => ({
      key: item.id,
      menuItemId: item.menu_item_id,
      name: item.name,
      unitPrice: item.unit_price,
      quantity: item.quantity,
      unavailable: !item.menu_item_id || !activeIds.has(item.menu_item_id),
    }))
  );
  const [draftComment, setDraftComment] = useState(comment ?? "");
  const [reasonCode, setReasonCode] = useState<string>("");
  const [reasonNote, setReasonNote] = useState("");
  const [customerConfirmed, setCustomerConfirmed] = useState(false);
  const [addingId, setAddingId] = useState("");

  const savableLines = lines.filter((l) => !l.unavailable && l.menuItemId);
  const droppedLines = lines.filter((l) => l.unavailable);

  // Только предпросмотр — настоящие суммы считает сервер по реальным
  // menu_items.price, этот расчёт ни на что не влияет, кроме показа.
  const previewItemsSubtotal = savableLines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const previewTotal = previewItemsSubtotal + deliveryFee;
  const previewDiff = previewTotal - oldTotal;

  const isPaid = paymentStatus === "paid";
  const effectivePaid = paidAmount ?? oldTotal;
  const previewBalance = isPaid ? previewTotal - effectivePaid : 0;

  const hasChanges =
    droppedLines.length > 0 ||
    (comment ?? "") !== draftComment ||
    savableLines.length !== items.filter((i) => i.menu_item_id && activeIds.has(i.menu_item_id)).length ||
    savableLines.some((l) => {
      const original = items.find((i) => i.id === l.key);
      return !original || original.quantity !== l.quantity;
    });

  function setQuantity(key: string, next: number) {
    if (next < 1) return;
    if (next > 50) return;
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, quantity: next } : l)));
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  function addLine(menuItemId: string) {
    const menuItem = menuItems.find((m) => m.id === menuItemId);
    if (!menuItem) return;
    setAddingId("");
    setLines((prev) => {
      const existing = prev.find((l) => l.menuItemId === menuItemId && !l.unavailable);
      if (existing) {
        return prev.map((l) =>
          l.key === existing.key ? { ...l, quantity: Math.min(50, l.quantity + 1) } : l
        );
      }
      return [
        ...prev,
        {
          key: `new-${menuItemId}-${Date.now()}`,
          menuItemId: menuItem.id,
          name: menuItem.name,
          unitPrice: menuItem.price,
          quantity: 1,
          unavailable: false,
        },
      ];
    });
  }

  function reset() {
    setLines(
      items.map((item) => ({
        key: item.id,
        menuItemId: item.menu_item_id,
        name: item.name,
        unitPrice: item.unit_price,
        quantity: item.quantity,
        unavailable: !item.menu_item_id || !activeIds.has(item.menu_item_id),
      }))
    );
    setDraftComment(comment ?? "");
    setReasonCode("");
    setReasonNote("");
    setCustomerConfirmed(false);
    setError(null);
    setConfirming(false);
    setOpen(false);
  }

  const canProceed =
    savableLines.length > 0 &&
    !!reasonCode &&
    (reasonCode !== "other" || reasonNote.trim().length > 0) &&
    customerConfirmed &&
    hasChanges;

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateOrderItems({
        orderId,
        items: savableLines.map((l) => ({ menuItemId: l.menuItemId as string, quantity: l.quantity })),
        reasonCode,
        reasonNote,
        customerConfirmed,
        comment: draftComment,
      });
      if (!result.ok) {
        setError(result.error);
        setConfirming(false);
        return;
      }
      // Страница перерисуется сама (revalidatePath в действии) — состояние
      // редактора просто закрывается.
      setOpen(false);
      setConfirming(false);
      setReasonCode("");
      setReasonNote("");
      setCustomerConfirmed(false);
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="label-refined text-[#8C7355] hover:text-[#0A0A0A] transition-colors duration-300"
        style={{ fontSize: "0.6875rem" }}
      >
        Изменить заказ
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-[14px] border border-[#8C7355]/30 bg-[#8C7355]/[0.04] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <span className="label-refined text-[#8C7355]">Изменение заказа #{orderNumber}</span>
        <button
          type="button"
          onClick={reset}
          disabled={isPending}
          className="label-refined text-[#0A0A0A]/40 hover:text-[#0A0A0A] transition-colors disabled:opacity-50"
          style={{ fontSize: "0.625rem" }}
        >
          Отмена
        </button>
      </div>

      {confirming ? (
        <div className="flex flex-col gap-4">
          <p className="text-[#0A0A0A]/70 text-sm font-body">Проверьте изменения перед сохранением:</p>

          <div className="rounded-[10px] border border-[#0A0A0A]/10 bg-white p-4 flex flex-col gap-1 text-sm font-body">
            {savableLines.map((l) => {
              const original = items.find((i) => i.id === l.key);
              const changed = !original || original.quantity !== l.quantity;
              return (
                <div key={l.key} className="flex justify-between gap-3">
                  <span className={changed ? "text-[#8C7355]" : "text-[#0A0A0A]/60"}>
                    {l.name} × {l.quantity}
                    {!original && " (добавлено)"}
                    {original && original.quantity !== l.quantity && ` (было ${original.quantity})`}
                  </span>
                  <span className="shrink-0 text-[#0A0A0A]/70">{formatMoney(l.unitPrice * l.quantity)}</span>
                </div>
              );
            })}
            {items
              .filter((i) => !savableLines.some((l) => l.key === i.id))
              .map((i) => (
                <div key={i.id} className="flex justify-between gap-3 text-[#B3564A]">
                  <span className="line-through">
                    {i.name} × {i.quantity}
                  </span>
                  <span className="shrink-0">удалено</span>
                </div>
              ))}
          </div>

          <div className="rounded-[10px] border border-[#0A0A0A]/10 bg-white p-4 flex flex-col gap-1 text-sm font-body">
            <div className="flex justify-between text-[#0A0A0A]/60">
              <span>Было</span>
              <span>{formatMoney(oldTotal)}</span>
            </div>
            <div className="flex justify-between text-[#0A0A0A] font-medium">
              <span>Станет</span>
              <span>{formatMoney(previewTotal)}</span>
            </div>
            <div className="flex justify-between text-[#8C7355]">
              <span>Разница</span>
              <span>
                {previewDiff > 0 ? "+" : ""}
                {formatMoney(previewDiff)}
              </span>
            </div>
          </div>

          {isPaid && Math.abs(previewBalance) > 0.001 && (
            <div className="rounded-[10px] border border-[#B3564A]/30 bg-[#B3564A]/[0.06] px-4 py-3">
              <p className="text-[#B3564A] text-sm font-body font-medium">
                {previewBalance < 0
                  ? `Нужно вернуть клиенту ${formatMoney(Math.abs(previewBalance))}`
                  : `Требуется доплата ${formatMoney(previewBalance)}`}
              </p>
              <p className="text-[#B3564A]/70 text-xs font-body mt-1">
                Возврат/доплата не выполняются автоматически — платёжный провайдер ещё не подключён. Сумма
                сохранится в заказе как непогашенная разница.
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-[10px] border border-[#B3564A]/25 bg-[#B3564A]/[0.06] px-4 py-3">
              <p className="text-[#B3564A] text-sm font-body">{error}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={save}
              disabled={isPending}
              className="label-refined rounded-[10px] bg-[#0A0A0A] text-[#F5F0E8] px-5 py-3 hover:bg-[#8C7355] transition-colors duration-300 disabled:opacity-50"
              style={{ fontSize: "0.6875rem" }}
            >
              {isPending ? "Сохраняем…" : "Подтвердить и сохранить"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={isPending}
              className="label-refined text-[#0A0A0A]/50 hover:text-[#0A0A0A] transition-colors disabled:opacity-50"
              style={{ fontSize: "0.6875rem" }}
            >
              Назад к редактированию
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Позиции */}
          <div className="flex flex-col gap-2">
            {lines.map((l) => (
              <div
                key={l.key}
                className={`flex items-center gap-3 rounded-[10px] border bg-white px-3 py-2.5 ${
                  l.unavailable ? "border-[#B3564A]/40" : "border-[#0A0A0A]/10"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[#0A0A0A] text-sm font-body truncate">{l.name}</p>
                  <p className="text-[#0A0A0A]/45 text-xs font-body">
                    {l.unavailable ? "Нет в активном меню — будет удалено" : `${formatMoney(l.unitPrice)} за шт.`}
                  </p>
                </div>

                {!l.unavailable && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setQuantity(l.key, l.quantity - 1)}
                      disabled={l.quantity <= 1}
                      className="w-7 h-7 rounded-[8px] border border-[#0A0A0A]/15 text-[#0A0A0A]/70 hover:border-[#8C7355] transition-colors disabled:opacity-30"
                      aria-label="Уменьшить количество"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-body text-[#0A0A0A]">{l.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(l.key, l.quantity + 1)}
                      disabled={l.quantity >= 50}
                      className="w-7 h-7 rounded-[8px] border border-[#0A0A0A]/15 text-[#0A0A0A]/70 hover:border-[#8C7355] transition-colors disabled:opacity-30"
                      aria-label="Увеличить количество"
                    >
                      +
                    </button>
                  </div>
                )}

                <span className="w-20 text-right text-sm font-body text-[#0A0A0A]/70 shrink-0">
                  {l.unavailable ? "—" : formatMoney(l.unitPrice * l.quantity)}
                </span>

                <button
                  type="button"
                  onClick={() => removeLine(l.key)}
                  className="label-refined text-[#B3564A]/70 hover:text-[#B3564A] transition-colors shrink-0"
                  style={{ fontSize: "0.625rem" }}
                >
                  Удалить
                </button>
              </div>
            ))}
            {savableLines.length === 0 && (
              <p className="text-[#B3564A] text-sm font-body">
                В заказе должна остаться хотя бы одна позиция. Для полной отмены используйте смену статуса.
              </p>
            )}
          </div>

          {/* Добавление позиции */}
          <div>
            <label htmlFor={`add-item-${orderId}`} className="label-refined text-[#8C7355] block mb-2" style={{ fontSize: "0.625rem" }}>
              Добавить позицию
            </label>
            <select
              id={`add-item-${orderId}`}
              value={addingId}
              onChange={(e) => addLine(e.target.value)}
              className="w-full rounded-[10px] border border-[#0A0A0A]/15 bg-white px-3 py-2.5 text-sm font-body text-[#0A0A0A] outline-none focus:border-[#8C7355]"
            >
              <option value="">Выберите блюдо из активного меню…</option>
              {menuItems.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.price} ₽ ({m.category})
                </option>
              ))}
            </select>
          </div>

          {/* Комментарий */}
          <div>
            <label htmlFor={`comment-${orderId}`} className="label-refined text-[#8C7355] block mb-2" style={{ fontSize: "0.625rem" }}>
              Комментарий к заказу
            </label>
            <textarea
              id={`comment-${orderId}`}
              rows={2}
              value={draftComment}
              onChange={(e) => setDraftComment(e.target.value)}
              placeholder="Без комментария"
              className="w-full rounded-[10px] border border-[#0A0A0A]/15 bg-white px-3 py-2.5 text-sm font-body text-[#0A0A0A] outline-none focus:border-[#8C7355] resize-none placeholder:text-[#0A0A0A]/30"
            />
          </div>

          {/* Причина */}
          <div>
            <label htmlFor={`reason-${orderId}`} className="label-refined text-[#8C7355] block mb-2" style={{ fontSize: "0.625rem" }}>
              Причина изменения
            </label>
            <select
              id={`reason-${orderId}`}
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              className="w-full rounded-[10px] border border-[#0A0A0A]/15 bg-white px-3 py-2.5 text-sm font-body text-[#0A0A0A] outline-none focus:border-[#8C7355]"
            >
              <option value="">Выберите причину…</option>
              {REASON_CODES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {reasonCode === "other" && (
              <input
                type="text"
                value={reasonNote}
                onChange={(e) => setReasonNote(e.target.value)}
                placeholder="Опишите причину"
                className="mt-2 w-full rounded-[10px] border border-[#0A0A0A]/15 bg-white px-3 py-2.5 text-sm font-body text-[#0A0A0A] outline-none focus:border-[#8C7355] placeholder:text-[#0A0A0A]/30"
              />
            )}
            {reasonCode && reasonCode !== "other" && (
              <input
                type="text"
                value={reasonNote}
                onChange={(e) => setReasonNote(e.target.value)}
                placeholder="Уточнение (необязательно)"
                className="mt-2 w-full rounded-[10px] border border-[#0A0A0A]/15 bg-white px-3 py-2.5 text-sm font-body text-[#0A0A0A] outline-none focus:border-[#8C7355] placeholder:text-[#0A0A0A]/30"
              />
            )}
          </div>

          {/* Итоги */}
          <div className="rounded-[10px] border border-[#0A0A0A]/10 bg-white p-4 flex flex-col gap-1 text-sm font-body">
            <div className="flex justify-between text-[#0A0A0A]/60">
              <span>Блюда</span>
              <span>{formatMoney(previewItemsSubtotal)}</span>
            </div>
            <div className="flex justify-between text-[#0A0A0A]/60">
              <span>Доставка (не меняется)</span>
              <span>{formatMoney(deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-[#0A0A0A]/45 pt-1 border-t border-[#0A0A0A]/8 mt-1">
              <span>Было</span>
              <span>{formatMoney(oldTotal)}</span>
            </div>
            <div className="flex justify-between text-[#0A0A0A] font-medium">
              <span>Станет</span>
              <span>{formatMoney(previewTotal)}</span>
            </div>
          </div>

          {isPaid && Math.abs(previewBalance) > 0.001 && (
            <div className="rounded-[10px] border border-[#B3564A]/30 bg-[#B3564A]/[0.06] px-4 py-3">
              <p className="text-[#B3564A] text-sm font-body font-medium">
                {previewBalance < 0
                  ? `Нужно вернуть клиенту ${formatMoney(Math.abs(previewBalance))}`
                  : `Требуется доплата ${formatMoney(previewBalance)}`}
              </p>
            </div>
          )}

          {/* Согласование */}
          <label
            htmlFor={`confirmed-${orderId}`}
            className={`flex items-start gap-3 rounded-[10px] border px-4 py-3 cursor-pointer transition-colors ${
              customerConfirmed ? "border-[#3F6B4F]/40 bg-[#3F6B4F]/[0.05]" : "border-[#0A0A0A]/15 bg-white"
            }`}
          >
            <input
              id={`confirmed-${orderId}`}
              type="checkbox"
              checked={customerConfirmed}
              onChange={(e) => setCustomerConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 shrink-0 accent-[#3F6B4F]"
            />
            <span className="text-[#0A0A0A]/75 text-sm font-body">
              Изменение согласовано с клиентом
            </span>
          </label>

          {error && (
            <div className="rounded-[10px] border border-[#B3564A]/25 bg-[#B3564A]/[0.06] px-4 py-3">
              <p className="text-[#B3564A] text-sm font-body">{error}</p>
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={!canProceed || isPending}
              className="label-refined rounded-[10px] bg-[#0A0A0A] text-[#F5F0E8] px-5 py-3 hover:bg-[#8C7355] transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ fontSize: "0.6875rem" }}
            >
              Проверить и сохранить
            </button>
            {!hasChanges && (
              <p className="text-[#0A0A0A]/40 text-xs font-body mt-2">Изменений пока нет.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
