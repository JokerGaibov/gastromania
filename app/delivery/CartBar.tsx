"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/CartContext";
import { CartIcon } from "../components/reservation/icons";

// Sticky bottom bar, visible only once something's in the cart — the cart
// itself has no dedicated page of its own, checkout doubles as the review
// screen (see app/checkout/CheckoutForm.tsx).
export default function CartBar() {
  const { itemCount, subtotal } = useCart();

  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#0A0A0A]/8 bg-white/95 backdrop-blur-md shadow-[0_-8px_24px_-8px_rgba(10,10,10,0.1)]">
      <div className="max-w-screen-xl mx-auto px-6 sm:px-8 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="w-5 h-5 text-[#8C7355]">
            <CartIcon />
          </span>
          <span className="text-[#0A0A0A] font-body text-sm">
            {itemCount} {itemCount === 1 ? "позиция" : "позиций"} · {subtotal} ₽
          </span>
        </div>
        <Link
          href="/checkout"
          className="inline-flex items-center h-11 px-6 rounded-[12px] bg-[#0A0A0A] text-[#F5F0E8] label-refined hover:bg-[#8C7355] transition-colors duration-300"
        >
          Оформить заказ
        </Link>
      </div>
    </div>
  );
}
