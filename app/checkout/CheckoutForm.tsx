"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useCart } from "@/lib/cart/CartContext";
import FieldShell from "../components/reservation/FieldShell";
import PhoneField from "../components/reservation/PhoneField";
import ConsentCheckbox from "../components/reservation/ConsentCheckbox";
import { UserIcon, MailIcon, NoteIcon, MinusIcon, PlusIcon, TrashIcon } from "../components/reservation/icons";
import { isRuPhoneComplete, isValidEmail } from "../components/reservation/utils";
import { submitOrder } from "./actions";

type DeliverySettings = {
  isDeliveryEnabled: boolean;
  minOrderAmount: number;
  deliveryFee: number;
  freeDeliveryFrom: number | null;
};

type FormErrors = Partial<{
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  deliveryAddress: string;
  consentGiven: string;
}>;

export default function CheckoutForm({
  settings,
  prefillName,
  prefillEmail,
  prefillPhone,
}: {
  settings: DeliverySettings;
  prefillName?: string;
  prefillEmail?: string;
  prefillPhone?: string;
}) {
  const router = useRouter();
  const cart = useCart();

  const [guestName, setGuestName] = useState(prefillName ?? "");
  const [guestPhone, setGuestPhone] = useState(prefillPhone ?? "");
  const [guestEmail, setGuestEmail] = useState(prefillEmail ?? "");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [comment, setComment] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  // Only the human-readable order_number is shown to the customer —
  // orders.id (UUID) stays an internal identifier, never surfaced here.
  const [orderNumber, setOrderNumber] = useState<number | null>(null);

  // Display only — the actual total is computed server-side in
  // create_order() from live menu_items/delivery_settings. This preview
  // can drift (a price changes mid-session, say) without that being a
  // problem: the confirmation always reflects what the server charged.
  const deliveryFee = useMemo(() => {
    if (settings.freeDeliveryFrom != null && cart.subtotal >= settings.freeDeliveryFrom) return 0;
    return settings.deliveryFee;
  }, [cart.subtotal, settings]);
  const total = cart.subtotal + deliveryFee;
  const belowMinimum = cart.subtotal < settings.minOrderAmount;

  function setField(key: keyof FormErrors) {
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (!guestName.trim()) next.guestName = "Укажите имя";
    if (!isRuPhoneComplete(guestPhone)) next.guestPhone = "Укажите номер полностью";
    if (guestEmail.trim() && !isValidEmail(guestEmail.trim())) next.guestEmail = "Проверьте адрес email";
    if (!deliveryAddress.trim()) next.deliveryAddress = "Укажите адрес доставки";
    if (!consentGiven) next.consentGiven = "Нужно согласие на обработку персональных данных";
    return next;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("loading");
    setServerError(null);

    try {
      const result = await submitOrder({
        items: cart.items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        guestName,
        guestPhone,
        guestEmail,
        deliveryAddress,
        comment,
        consentGiven,
      });

      if (!result.ok) {
        setServerError(result.error);
        setStatus("error");
        return;
      }

      setOrderNumber(result.orderNumber);
      cart.clear();
      setStatus("success");
    } catch (err) {
      console.error("submitOrder threw unexpectedly:", err);
      setServerError("Не удалось оформить заказ. Попробуйте ещё раз.");
      setStatus("error");
    }
  }

  if (status === "success" && orderNumber !== null) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="rounded-[24px] border border-[#0A0A0A]/8 bg-white shadow-[0_30px_80px_-24px_rgba(10,10,10,0.2)] p-8 sm:p-12 text-center"
      >
        <div className="w-12 h-px bg-[#8C7355] mb-8 mx-auto" />
        <h2 className="heading-editorial text-[#0A0A0A] mb-4" style={{ fontSize: "2rem" }}>
          Заказ создан
        </h2>
        <p className="text-[#0A0A0A]/50 text-sm font-body mb-2">Номер заказа</p>
        <p className="text-[#8C7355] font-body text-2xl mb-8">#{orderNumber}</p>
        <div className="rounded-[14px] bg-[#F5F0E8] px-5 py-4 mb-8 text-left">
          <p className="text-[#0A0A0A]/70 text-sm font-body leading-relaxed">
            Для завершения оформления требуется онлайн-оплата. Мы свяжемся с вами, как только оплата будет
            доступна для этого заказа.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="label-refined text-[#0A0A0A]/60 hover:text-[#0A0A0A] transition-colors duration-300"
        >
          На главную
        </button>
      </motion.div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="rounded-[24px] border border-[#0A0A0A]/8 bg-white p-10 text-center">
        <p className="text-[#0A0A0A]/50 text-sm font-body mb-6">Корзина пуста.</p>
        <button
          type="button"
          onClick={() => router.push("/delivery")}
          className="label-refined text-[#8C7355] hover:text-[#0A0A0A] transition-colors duration-300"
        >
          Перейти к меню
        </button>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Order summary */}
      <div className="rounded-[24px] border border-[#0A0A0A]/8 bg-white p-6 sm:p-8 h-fit">
        <h2 className="heading-editorial text-[#0A0A0A] mb-6" style={{ fontSize: "1.5rem" }}>
          Ваш заказ
        </h2>
        <div className="flex flex-col gap-4 mb-6">
          {cart.items.map((item) => (
            <div key={item.menuItemId} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[#0A0A0A] font-body text-sm truncate">{item.name}</p>
                <p className="text-[#0A0A0A]/40 text-xs font-body">{item.price} ₽</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => cart.updateQuantity(item.menuItemId, item.quantity - 1)}
                  aria-label="Уменьшить количество"
                  className="w-7 h-7 rounded-full border border-[#0A0A0A]/15 flex items-center justify-center text-[#0A0A0A]/50 hover:border-[#8C7355] transition-colors duration-300"
                >
                  <span className="w-2.5 h-2.5">
                    <MinusIcon />
                  </span>
                </button>
                <span className="w-4 text-center text-sm font-body">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => cart.updateQuantity(item.menuItemId, item.quantity + 1)}
                  aria-label="Увеличить количество"
                  className="w-7 h-7 rounded-full border border-[#0A0A0A]/15 flex items-center justify-center text-[#0A0A0A]/50 hover:border-[#8C7355] transition-colors duration-300"
                >
                  <span className="w-2.5 h-2.5">
                    <PlusIcon />
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => cart.removeItem(item.menuItemId)}
                  aria-label={`Убрать ${item.name}`}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[#0A0A0A]/30 hover:text-[#B3564A] transition-colors duration-300"
                >
                  <span className="w-3 h-3">
                    <TrashIcon />
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-[#0A0A0A]/8 pt-4 flex flex-col gap-2 text-sm font-body">
          <div className="flex justify-between text-[#0A0A0A]/60">
            <span>Блюда</span>
            <span>{cart.subtotal} ₽</span>
          </div>
          <div className="flex justify-between text-[#0A0A0A]/60">
            <span>Доставка</span>
            <span>{deliveryFee === 0 ? "бесплатно" : `${deliveryFee} ₽`}</span>
          </div>
          <div className="flex justify-between text-[#0A0A0A] font-medium pt-2 border-t border-[#0A0A0A]/8">
            <span>Итого</span>
            <span>{total} ₽</span>
          </div>
        </div>

        {belowMinimum && (
          <p className="text-[#B3564A] text-xs font-body mt-4">
            Минимальная сумма заказа — {settings.minOrderAmount} ₽. Добавьте ещё блюд.
          </p>
        )}
      </div>

      {/* Contact + delivery form */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <FieldShell label="Имя" icon={<UserIcon />} htmlFor="co-name" error={errors.guestName}>
          <input
            id="co-name"
            type="text"
            autoComplete="name"
            placeholder="Введите имя"
            value={guestName}
            onChange={(e) => {
              setGuestName(e.target.value);
              setField("guestName");
            }}
            className="w-full bg-transparent outline-none text-[0.9375rem] text-[#0A0A0A] font-body placeholder:text-[#0A0A0A]/30"
          />
        </FieldShell>

        <div className="grid sm:grid-cols-2 gap-5">
          <PhoneField
            id="co-phone"
            value={guestPhone}
            onChange={(v) => {
              setGuestPhone(v);
              setField("guestPhone");
            }}
            error={errors.guestPhone}
          />
          <FieldShell label="Email (необязательно)" icon={<MailIcon />} htmlFor="co-email" error={errors.guestEmail}>
            <input
              id="co-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={guestEmail}
              onChange={(e) => {
                setGuestEmail(e.target.value);
                setField("guestEmail");
              }}
              className="w-full bg-transparent outline-none text-[0.9375rem] text-[#0A0A0A] font-body placeholder:text-[#0A0A0A]/30"
            />
          </FieldShell>
        </div>

        <FieldShell label="Адрес доставки" icon={<NoteIcon />} htmlFor="co-address" error={errors.deliveryAddress}>
          <input
            id="co-address"
            type="text"
            autoComplete="street-address"
            placeholder="Улица, дом, квартира"
            value={deliveryAddress}
            onChange={(e) => {
              setDeliveryAddress(e.target.value);
              setField("deliveryAddress");
            }}
            className="w-full bg-transparent outline-none text-[0.9375rem] text-[#0A0A0A] font-body placeholder:text-[#0A0A0A]/30"
          />
        </FieldShell>

        <FieldShell label="Комментарий (необязательно)" icon={<NoteIcon />} htmlFor="co-comment">
          <textarea
            id="co-comment"
            rows={2}
            placeholder="Домофон, этаж, пожелания к заказу"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full bg-transparent outline-none resize-none text-[0.9375rem] text-[#0A0A0A] font-body placeholder:text-[#0A0A0A]/30"
          />
        </FieldShell>

        <ConsentCheckbox
          id="co-consent"
          checked={consentGiven}
          onChange={(v) => {
            setConsentGiven(v);
            setField("consentGiven");
          }}
          error={errors.consentGiven}
        />

        {status === "error" && serverError && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[12px] border border-[#B3564A]/25 bg-[#B3564A]/[0.06] px-4 py-3"
          >
            <p className="text-[#B3564A] text-sm font-body">{serverError}</p>
          </motion.div>
        )}

        <motion.button
          type="submit"
          disabled={status === "loading" || belowMinimum || !settings.isDeliveryEnabled}
          whileHover={status === "loading" ? undefined : { scale: 1.01 }}
          whileTap={status === "loading" ? undefined : { scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 24 }}
          className="w-full rounded-[14px] bg-[#0A0A0A] text-[#F5F0E8] label-refined disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ height: "56px" }}
        >
          {status === "loading" ? "Оформляем…" : `Оформить заказ · ${total} ₽`}
        </motion.button>

        {!settings.isDeliveryEnabled && (
          <p className="text-[#B3564A] text-xs font-body text-center">Доставка сейчас недоступна.</p>
        )}
      </form>
    </div>
  );
}
