"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { ImageIcon } from "../../components/reservation/icons";

// Deliberate near-duplicate of app/admin/menu/ImageUpload.tsx (different
// bucket: "promo-images" vs "menu-images") rather than a shared generic
// component — the owner explicitly asked not to touch already-working
// /admin/menu while building this batch, so the working version stays
// untouched instead of being refactored into something both pages share.

// Mirrors the "promo-images" bucket's file_size_limit/allowed_mime_types
// (20260912100000) — UX convenience only, NOT the real restriction:
// Supabase Storage itself rejects anything outside these bounds regardless
// of what this component does or doesn't check.
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export default function ImageUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setError("Неподдерживаемый формат. Разрешены JPEG, PNG, WebP, AVIF.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError("Файл слишком большой. Максимум 5 МБ.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("promo-images")
        .upload(path, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("promo-images").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err) {
      console.error("ImageUpload (promotions): upload failed", err);
      setError("Не удалось загрузить фото. Попробуйте ещё раз.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <span className="label-refined text-[#8C7355] block mb-2">Изображение</span>
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-[12px] border border-[#0A0A0A]/10 bg-[#F5F0E8] overflow-hidden flex items-center justify-center shrink-0">
          {value ? (
            <Image src={value} alt="Текущее изображение" width={80} height={80} className="w-full h-full object-cover" />
          ) : (
            <span className="w-6 h-6 text-[#0A0A0A]/25">
              <ImageIcon />
            </span>
          )}
        </div>
        <div>
          <label className="label-refined text-[#0A0A0A]/60 hover:text-[#0A0A0A] transition-colors duration-300 cursor-pointer">
            {uploading ? "Загружаем…" : value ? "Заменить фото" : "Загрузить фото"}
            <input
              type="file"
              accept={ALLOWED_MIME_TYPES.join(",")}
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
              }}
            />
          </label>
          {error && <p className="text-[#B3564A] text-xs font-body mt-1">{error}</p>}
        </div>
      </div>
    </div>
  );
}
