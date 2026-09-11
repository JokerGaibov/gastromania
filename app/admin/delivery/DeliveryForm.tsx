"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import FieldShell from "../../components/reservation/FieldShell";
import { PlusIcon } from "../../components/reservation/icons";
import { updateDeliverySettings, type DeliverySettingsInput, type ActionResult } from "./actions";

export default function DeliveryForm({ initial }: { initial: DeliverySettingsInput }) {
  const router = useRouter();
  const [isDeliveryEnabled, setIsDeliveryEnabled] = useState(initial.isDeliveryEnabled);
  const [minOrderAmount, setMinOrderAmount] = useState(initial.minOrderAmount);
  const [deliveryFee, setDeliveryFee] = useState(initial.deliveryFee);
  const [freeDeliveryFrom, setFreeDeliveryFrom] = useState(initial.freeDeliveryFrom);
  const [kitchenOpens, setKitchenOpens] = useState(initial.kitchenOpens);
  const [kitchenCloses, setKitchenCloses] = useState(initial.kitchenCloses);
  const [zones, setZones] = useState<string[]>(initial.zones);
  const [zoneDraft, setZoneDraft] = useState("");

  const [status, setStatus] = useState<"idle" | "loading" | "error" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  function addZone() {
    const value = zoneDraft.trim();
    if (!value || zones.includes(value)) {
      setZoneDraft("");
      return;
    }
    setZones((z) => [...z, value]);
    setZoneDraft("");
  }

  function removeZone(zone: string) {
    setZones((z) => z.filter((item) => item !== zone));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;

    setStatus("loading");
    setError(null);

    const result: ActionResult = await updateDeliverySettings({
      isDeliveryEnabled,
      minOrderAmount,
      deliveryFee,
      freeDeliveryFrom,
      kitchenOpens,
      kitchenCloses,
      zones,
    });

    if (!result.ok) {
      setError(result.error);
      setStatus("error");
      return;
    }

    setStatus("saved");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6 max-w-[560px]">
      <div className="rounded-[18px] border border-[#0A0A0A]/8 bg-white p-5 sm:p-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-[#0A0A0A] font-body font-medium text-[0.9375rem] mb-1">Доставка</p>
          <p className="text-[#0A0A0A]/45 text-xs font-body">
            {isDeliveryEnabled ? "Гости могут оформить заказ" : "Заказы на доставку временно недоступны"}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isDeliveryEnabled}
          onClick={() => setIsDeliveryEnabled((v) => !v)}
          className={`relative w-16 h-9 rounded-full shrink-0 transition-colors duration-300 ${
            isDeliveryEnabled ? "bg-[#3F6B4F]" : "bg-[#B3564A]"
          }`}
        >
          <span
            className={`absolute top-1 left-1 w-7 h-7 rounded-full bg-white shadow-[0_2px_6px_rgba(10,10,10,0.25)] transition-transform duration-300 ${
              isDeliveryEnabled ? "translate-x-7" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <FieldShell label="Минимальная сумма заказа, ₽" htmlFor="dv-min">
          <input
            id="dv-min"
            type="text"
            inputMode="decimal"
            value={minOrderAmount}
            onChange={(e) => setMinOrderAmount(e.target.value)}
            className="w-full bg-transparent outline-none text-[0.9375rem] text-[#0A0A0A] font-body"
          />
        </FieldShell>
        <FieldShell label="Стоимость доставки, ₽" htmlFor="dv-fee">
          <input
            id="dv-fee"
            type="text"
            inputMode="decimal"
            value={deliveryFee}
            onChange={(e) => setDeliveryFee(e.target.value)}
            className="w-full bg-transparent outline-none text-[0.9375rem] text-[#0A0A0A] font-body"
          />
        </FieldShell>
      </div>

      <FieldShell label="Бесплатная доставка от суммы, ₽ (необязательно)" htmlFor="dv-free">
        <input
          id="dv-free"
          type="text"
          inputMode="decimal"
          placeholder="Не задано"
          value={freeDeliveryFrom}
          onChange={(e) => setFreeDeliveryFrom(e.target.value)}
          className="w-full bg-transparent outline-none text-[0.9375rem] text-[#0A0A0A] font-body placeholder:text-[#0A0A0A]/30"
        />
      </FieldShell>

      <div className="grid sm:grid-cols-2 gap-5">
        <FieldShell label="Кухня открывается" htmlFor="dv-opens">
          <input
            id="dv-opens"
            type="time"
            value={kitchenOpens}
            onChange={(e) => setKitchenOpens(e.target.value)}
            className="w-full bg-transparent outline-none text-[0.9375rem] text-[#0A0A0A] font-body"
          />
        </FieldShell>
        <FieldShell label="Кухня закрывается" htmlFor="dv-closes">
          <input
            id="dv-closes"
            type="time"
            value={kitchenCloses}
            onChange={(e) => setKitchenCloses(e.target.value)}
            className="w-full bg-transparent outline-none text-[0.9375rem] text-[#0A0A0A] font-body"
          />
        </FieldShell>
      </div>

      <div>
        <span className="label-refined text-[#8C7355] block mb-2">Районы доставки</span>
        <div className="flex flex-wrap gap-2 mb-3">
          {zones.length === 0 && <p className="text-[#0A0A0A]/35 text-sm font-body">Районы не заданы — доставка не ограничена.</p>}
          {zones.map((zone) => (
            <span
              key={zone}
              className="inline-flex items-center gap-2 rounded-full bg-[#F5F0E8] border border-[#0A0A0A]/10 pl-3 pr-2 py-1.5 text-sm font-body text-[#0A0A0A]/80"
            >
              {zone}
              <button
                type="button"
                onClick={() => removeZone(zone)}
                aria-label={`Удалить район ${zone}`}
                className="w-4 h-4 rounded-full flex items-center justify-center text-[#0A0A0A]/40 hover:text-[#B3564A] transition-colors duration-300"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={zoneDraft}
            onChange={(e) => setZoneDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addZone();
              }
            }}
            placeholder="Например, Центр"
            className="flex-1 rounded-[12px] border border-[#0A0A0A]/15 bg-white px-4 py-2.5 text-sm font-body text-[#0A0A0A] outline-none focus:border-[#8C7355] placeholder:text-[#0A0A0A]/30"
          />
          <button
            type="button"
            onClick={addZone}
            className="w-11 h-11 rounded-[12px] bg-[#0A0A0A]/5 hover:bg-[#0A0A0A]/10 transition-colors duration-300 flex items-center justify-center text-[#0A0A0A]/60 shrink-0"
            aria-label="Добавить район"
          >
            <span className="w-4 h-4">
              <PlusIcon />
            </span>
          </button>
        </div>
      </div>

      {status === "error" && error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[12px] border border-[#B3564A]/25 bg-[#B3564A]/[0.06] px-4 py-3"
        >
          <p className="text-[#B3564A] text-sm font-body" style={{ letterSpacing: "0.01em" }}>
            {error}
          </p>
        </motion.div>
      )}

      {status === "saved" && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[12px] border border-[#3F6B4F]/25 bg-[#3F6B4F]/[0.06] px-4 py-3"
        >
          <p className="text-[#3F6B4F] text-sm font-body" style={{ letterSpacing: "0.01em" }}>
            Настройки сохранены.
          </p>
        </motion.div>
      )}

      <motion.button
        type="submit"
        disabled={status === "loading"}
        whileHover={status === "loading" ? undefined : { scale: 1.01 }}
        whileTap={status === "loading" ? undefined : { scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 24 }}
        className="w-full sm:w-auto self-start px-8 rounded-[14px] bg-[#0A0A0A] text-[#F5F0E8] label-refined disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ height: "52px" }}
      >
        {status === "loading" ? "Сохраняем…" : "Сохранить настройки"}
      </motion.button>
    </form>
  );
}
