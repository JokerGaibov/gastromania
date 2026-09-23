"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart/CartContext";
import { CartIcon, PlusIcon, MinusIcon, TrashIcon, ChevronDownIcon } from "../components/reservation/icons";

export type CartSettings = {
  deliveryFee: number;
  freeDeliveryFrom: number | null;
  minOrderAmount: number;
};

function pluralizePositions(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "позиция";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "позиции";
  return "позиций";
}

// Липкая нижняя панель с раскрывающейся корзиной. До create_order() состав
// полностью в руках клиента — здесь он может менять количество, удалять
// позиции и очищать корзину целиком. Отдельной страницы корзины нет:
// раскрывающаяся панель работает и на мобильном, и на десктопе, не уводя
// пользователя с меню.
export default function CartBar({ settings }: { settings: CartSettings }) {
  const { items, itemCount, subtotal, updateQuantity, removeItem, clear } = useCart();
  const [open, setOpen] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);

  if (itemCount === 0) return null;

  const freeDelivery = settings.freeDeliveryFrom !== null && subtotal >= settings.freeDeliveryFrom;
  const deliveryFee = freeDelivery ? 0 : settings.deliveryFee;
  const total = subtotal + deliveryFee;
  const belowMinimum = subtotal < settings.minOrderAmount;

  function handleClear() {
    clear();
    setConfirmingClear(false);
    setOpen(false);
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#0A0A0A]/8 bg-white/95 backdrop-blur-md shadow-[0_-8px_24px_-8px_rgba(10,10,10,0.1)]">
      {/* Раскрытый состав корзины */}
      {open && (
        <div className="max-w-screen-xl mx-auto px-6 sm:px-8 pt-5 max-h-[55vh] overflow-y-auto">
          <div className="flex items-center justify-between gap-4 mb-4">
            <span className="label-refined text-[#8C7355]">Ваша корзина</span>
            {confirmingClear ? (
              <div className="flex items-center gap-3">
                <span className="text-[#0A0A0A]/60 text-xs font-body">Очистить всю корзину?</span>
                <button
                  type="button"
                  onClick={handleClear}
                  className="label-refined text-[#B3564A] hover:text-[#0A0A0A] transition-colors"
                  style={{ fontSize: "0.625rem" }}
                >
                  Да, очистить
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingClear(false)}
                  className="label-refined text-[#0A0A0A]/40 hover:text-[#0A0A0A] transition-colors"
                  style={{ fontSize: "0.625rem" }}
                >
                  Отмена
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingClear(true)}
                className="label-refined text-[#0A0A0A]/40 hover:text-[#B3564A] transition-colors"
                style={{ fontSize: "0.625rem" }}
              >
                Очистить корзину
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3 pb-4">
            {items.map((item) => (
              <div
                key={item.menuItemId}
                // На узком экране название занимает свою строку целиком —
                // иначе оно сжимается до «Кебаб а…» рядом с кнопками.
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-[12px] border border-[#0A0A0A]/8 bg-white px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[#0A0A0A] text-sm font-body sm:truncate">{item.name}</p>
                  <p className="text-[#0A0A0A]/40 text-xs font-body">{item.price} ₽ за шт.</p>
                </div>

                {/* Количество, сумма и удаление — всегда одной строкой: на
                    мобильном она идёт под названием, на десктопе справа
                    от него. */}
                <div className="flex items-center gap-2 sm:shrink-0">
                  {/* quantity 0 удаляет позицию — это уже поведение
                      updateQuantity() в CartContext, отдельной ветки не нужно. */}
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                    aria-label={`Уменьшить количество: ${item.name}`}
                    className="w-9 h-9 rounded-full border border-[#0A0A0A]/15 flex items-center justify-center text-[#0A0A0A]/60 hover:border-[#8C7355] hover:text-[#0A0A0A] transition-colors duration-300"
                  >
                    <span className="w-3 h-3">
                      <MinusIcon />
                    </span>
                  </button>
                  <span className="w-6 text-center text-[#0A0A0A] font-body text-sm">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                    aria-label={`Увеличить количество: ${item.name}`}
                    className="w-9 h-9 rounded-full border border-[#0A0A0A]/15 flex items-center justify-center text-[#0A0A0A]/60 hover:border-[#8C7355] hover:text-[#0A0A0A] transition-colors duration-300"
                  >
                    <span className="w-3 h-3">
                      <PlusIcon />
                    </span>
                  </button>

                  <span className="flex-1 sm:flex-none sm:w-16 text-right text-sm font-body text-[#0A0A0A]/70">
                    {item.price * item.quantity} ₽
                  </span>

                  <button
                    type="button"
                    onClick={() => removeItem(item.menuItemId)}
                    aria-label={`Убрать ${item.name}`}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[#0A0A0A]/30 hover:text-[#B3564A] transition-colors duration-300 shrink-0"
                  >
                    <span className="w-3.5 h-3.5">
                      <TrashIcon />
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1 border-t border-[#0A0A0A]/8 pt-3 pb-1 text-sm font-body">
            <div className="flex justify-between text-[#0A0A0A]/60">
              <span>Блюда</span>
              <span>{subtotal} ₽</span>
            </div>
            <div className="flex justify-between text-[#0A0A0A]/60">
              <span>Доставка</span>
              <span>{deliveryFee === 0 ? "бесплатно" : `${deliveryFee} ₽`}</span>
            </div>
            <div className="flex justify-between text-[#0A0A0A] font-medium">
              <span>Итого</span>
              <span>{total} ₽</span>
            </div>
            {belowMinimum && (
              <p className="text-[#B3564A] text-xs font-body mt-1">
                Минимальный заказ — {settings.minOrderAmount} ₽. Добавьте ещё на {settings.minOrderAmount - subtotal} ₽.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Всегда видимая строка */}
      <div className="max-w-screen-xl mx-auto px-6 sm:px-8 py-4 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            setConfirmingClear(false);
          }}
          className="flex items-center gap-3 min-w-0"
          aria-expanded={open}
        >
          <span className="w-5 h-5 text-[#8C7355] shrink-0">
            <CartIcon />
          </span>
          <span className="text-[#0A0A0A] font-body text-sm truncate">
            {itemCount} {pluralizePositions(itemCount)} · {total} ₽
          </span>
          <span
            className={`w-4 h-4 text-[#0A0A0A]/40 shrink-0 transition-transform duration-300 ${
              open ? "rotate-180" : ""
            }`}
          >
            <ChevronDownIcon />
          </span>
        </button>

        <Link
          href="/checkout"
          className="inline-flex items-center h-11 px-6 rounded-[12px] bg-[#0A0A0A] text-[#F5F0E8] label-refined hover:bg-[#8C7355] transition-colors duration-300 shrink-0"
        >
          Оформить заказ
        </Link>
      </div>
    </div>
  );
}
