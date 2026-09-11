"use client";

import Image from "next/image";
import { useCart } from "@/lib/cart/CartContext";
import { PlusIcon, MinusIcon, ImageIcon } from "../components/reservation/icons";

export type DeliveryMenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
};

function QuantityStepper({ menuItemId }: { menuItemId: string }) {
  const { items, updateQuantity } = useCart();
  const inCart = items.find((i) => i.menuItemId === menuItemId);

  if (!inCart) return null;

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => updateQuantity(menuItemId, inCart.quantity - 1)}
        aria-label="Уменьшить количество"
        className="w-8 h-8 rounded-full border border-[#0A0A0A]/15 flex items-center justify-center text-[#0A0A0A]/60 hover:border-[#8C7355] hover:text-[#0A0A0A] transition-colors duration-300"
      >
        <span className="w-3 h-3">
          <MinusIcon />
        </span>
      </button>
      <span className="w-5 text-center text-[#0A0A0A] font-body text-sm">{inCart.quantity}</span>
      <button
        type="button"
        onClick={() => updateQuantity(menuItemId, inCart.quantity + 1)}
        aria-label="Увеличить количество"
        className="w-8 h-8 rounded-full border border-[#0A0A0A]/15 flex items-center justify-center text-[#0A0A0A]/60 hover:border-[#8C7355] hover:text-[#0A0A0A] transition-colors duration-300"
      >
        <span className="w-3 h-3">
          <PlusIcon />
        </span>
      </button>
    </div>
  );
}

function DishCard({ item }: { item: DeliveryMenuItem }) {
  const { items, addItem } = useCart();
  const inCart = items.find((i) => i.menuItemId === item.id);

  return (
    <div className="rounded-[18px] border border-[#0A0A0A]/8 bg-white overflow-hidden shadow-[0_4px_16px_-8px_rgba(10,10,10,0.08)] flex flex-col">
      <div className="aspect-[4/3] bg-[#F5F0E8] relative">
        {item.image_url ? (
          <Image src={item.image_url} alt={item.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#0A0A0A]/20">
            <span className="w-10 h-10">
              <ImageIcon />
            </span>
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <p className="text-[#0A0A0A] font-body font-medium text-[0.9375rem] mb-1">{item.name}</p>
        {item.description && (
          <p className="text-[#0A0A0A]/45 text-xs font-body leading-relaxed mb-4 flex-1">{item.description}</p>
        )}
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-[#8C7355] font-body text-sm">{item.price} ₽</span>
          {inCart ? (
            <QuantityStepper menuItemId={item.id} />
          ) : (
            <button
              type="button"
              onClick={() =>
                addItem({ menuItemId: item.id, name: item.name, price: item.price, imageUrl: item.image_url })
              }
              className="label-refined text-[#0A0A0A] border border-[#0A0A0A]/15 rounded-[10px] px-4 py-2 hover:border-[#8C7355] hover:text-[#8C7355] transition-colors duration-300"
            >
              Добавить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DeliveryMenuGrid({ items }: { items: DeliveryMenuItem[] }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {items.map((item) => (
        <DishCard key={item.id} item={item} />
      ))}
    </div>
  );
}
