"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import FieldShell from "../../components/reservation/FieldShell";
import ImageUpload from "./ImageUpload";
import type { PromotionInput, ActionResult } from "./actions";

type Props = {
  initial?: Partial<PromotionInput>;
  onSubmit: (input: PromotionInput) => Promise<ActionResult>;
  submitLabel: string;
};

export default function PromotionForm({ initial, onSubmit, submitLabel }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [discountPercent, setDiscountPercent] = useState(initial?.discountPercent ?? "");
  const [startsAt, setStartsAt] = useState(initial?.startsAt ?? "");
  const [endsAt, setEndsAt] = useState(initial?.endsAt ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;

    if (!title.trim()) {
      setError("Укажите заголовок.");
      setStatus("error");
      return;
    }
    if (startsAt && endsAt && startsAt > endsAt) {
      setError("Дата окончания раньше даты начала.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setError(null);

    const result = await onSubmit({
      title: title.trim(),
      description,
      imageUrl,
      discountPercent,
      startsAt,
      endsAt,
      isActive,
    });

    if (!result.ok) {
      setError(result.error);
      setStatus("error");
      return;
    }

    router.push("/admin/promotions");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 max-w-[560px]">
      <FieldShell label="Заголовок" htmlFor="promo-title">
        <input
          id="promo-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-transparent outline-none text-[0.9375rem] text-[#0A0A0A] font-body placeholder:text-[#0A0A0A]/30"
        />
      </FieldShell>

      <FieldShell label="Описание" htmlFor="promo-description">
        <textarea
          id="promo-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-transparent outline-none resize-none text-[0.9375rem] text-[#0A0A0A] font-body placeholder:text-[#0A0A0A]/30"
        />
      </FieldShell>

      <div className="grid sm:grid-cols-2 gap-5">
        <FieldShell label="Скидка, % (необязательно)" htmlFor="promo-discount">
          <input
            id="promo-discount"
            type="text"
            inputMode="numeric"
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value)}
            className="w-full bg-transparent outline-none text-[0.9375rem] text-[#0A0A0A] font-body placeholder:text-[#0A0A0A]/30"
          />
        </FieldShell>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <FieldShell label="Начало действия" htmlFor="promo-starts">
          <input
            id="promo-starts"
            type="date"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="w-full bg-transparent outline-none text-[0.9375rem] text-[#0A0A0A] font-body"
          />
        </FieldShell>
        <FieldShell label="Окончание (необязательно)" htmlFor="promo-ends">
          <input
            id="promo-ends"
            type="date"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="w-full bg-transparent outline-none text-[0.9375rem] text-[#0A0A0A] font-body"
          />
        </FieldShell>
      </div>

      <ImageUpload value={imageUrl} onChange={setImageUrl} />

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="w-5 h-5 accent-[#8C7355]"
        />
        <span className="text-[#0A0A0A]/80 text-sm font-body">Опубликована на сайте</span>
      </label>

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

      <motion.button
        type="submit"
        disabled={status === "loading"}
        whileHover={status === "loading" ? undefined : { scale: 1.01 }}
        whileTap={status === "loading" ? undefined : { scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 24 }}
        className="w-full sm:w-auto self-start px-8 rounded-[14px] bg-[#0A0A0A] text-[#F5F0E8] label-refined disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ height: "52px" }}
      >
        {status === "loading" ? "Сохраняем…" : submitLabel}
      </motion.button>
    </form>
  );
}
