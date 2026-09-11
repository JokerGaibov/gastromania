"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import FieldShell from "../../components/reservation/FieldShell";
import ImageUpload from "./ImageUpload";
import { MENU_CATEGORIES } from "./constants";
import type { MenuItemInput, ActionResult } from "./actions";

type Props = {
  initial?: Partial<MenuItemInput>;
  onSubmit: (input: MenuItemInput) => Promise<ActionResult>;
  submitLabel: string;
};

export default function MenuItemForm({ initial, onSubmit, submitLabel }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial?.price !== undefined ? String(initial.price) : "");
  const [category, setCategory] = useState(initial?.category ?? MENU_CATEGORIES[0].value);
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [sortOrder, setSortOrder] = useState(
    initial?.sortOrder !== undefined ? String(initial.sortOrder) : "0"
  );

  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;

    const parsedPrice = Number(price.replace(",", "."));
    if (!name.trim()) {
      setError("Укажите название.");
      setStatus("error");
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setError("Укажите корректную цену.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setError(null);

    const result = await onSubmit({
      name: name.trim(),
      description,
      price: parsedPrice,
      category,
      imageUrl,
      isActive,
      sortOrder: Number(sortOrder) || 0,
    });

    if (!result.ok) {
      setError(result.error);
      setStatus("error");
      return;
    }

    router.push("/admin/menu");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 max-w-[560px]">
      <FieldShell label="Название" htmlFor="mi-name">
        <input
          id="mi-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-transparent outline-none text-[0.9375rem] text-[#0A0A0A] font-body placeholder:text-[#0A0A0A]/30"
        />
      </FieldShell>

      <FieldShell label="Описание" htmlFor="mi-description">
        <textarea
          id="mi-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-transparent outline-none resize-none text-[0.9375rem] text-[#0A0A0A] font-body placeholder:text-[#0A0A0A]/30"
        />
      </FieldShell>

      <div className="grid sm:grid-cols-2 gap-5">
        <FieldShell label="Цена, ₽" htmlFor="mi-price">
          <input
            id="mi-price"
            type="text"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full bg-transparent outline-none text-[0.9375rem] text-[#0A0A0A] font-body placeholder:text-[#0A0A0A]/30"
          />
        </FieldShell>

        <FieldShell label="Категория" htmlFor="mi-category">
          <select
            id="mi-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-transparent outline-none text-[0.9375rem] text-[#0A0A0A] font-body"
          >
            {MENU_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </FieldShell>
      </div>

      <FieldShell label="Порядок сортировки" htmlFor="mi-sort">
        <input
          id="mi-sort"
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="w-full bg-transparent outline-none text-[0.9375rem] text-[#0A0A0A] font-body"
        />
      </FieldShell>

      <ImageUpload value={imageUrl} onChange={setImageUrl} />

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="w-5 h-5 accent-[#8C7355]"
        />
        <span className="text-[#0A0A0A]/80 text-sm font-body">
          В наличии (не в стоп-листе)
        </span>
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
