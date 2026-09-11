"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { ImageIcon } from "../../components/reservation/icons";

// Uploads straight from the browser to Supabase Storage using the signed-in
// user's own session — no server action file relay needed. Protected by the
// menu_images_staff_write RLS policy on storage.objects (20260911160000
// migration): only 'admin'/'manager' can write to the "menu-images" bucket,
// enforced by Supabase itself, not by anything client-side.
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
    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("menu-images")
        .upload(path, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err) {
      console.error("ImageUpload: upload failed", err);
      setError("Не удалось загрузить фото. Попробуйте ещё раз.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <span className="label-refined text-[#8C7355] block mb-2">Фото</span>
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-[12px] border border-[#0A0A0A]/10 bg-[#F5F0E8] overflow-hidden flex items-center justify-center shrink-0">
          {value ? (
            <Image src={value} alt="" width={80} height={80} className="w-full h-full object-cover" />
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
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = ""; // allow re-selecting the same file next time
              }}
            />
          </label>
          {error && <p className="text-[#B3564A] text-xs font-body mt-1">{error}</p>}
        </div>
      </div>
    </div>
  );
}
