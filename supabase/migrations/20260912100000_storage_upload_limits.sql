-- Production-readiness audit (main.md v0.1.27) flagged that "menu-images"
-- and "promo-images" (created in 20260911160000 / 20260911180000) accept
-- any file type/size: RLS already restricts WHO can write (admin only,
-- via is_admin() — unchanged, see 20260911220000), but nothing restricts
-- WHAT gets written. A compromised or mistaken admin session could upload
-- an arbitrarily large or non-image file into a public bucket.
--
-- This migration only tightens the two existing buckets — it does NOT
-- create new ones (both already exist from the migrations above) and does
-- NOT touch RLS policies (already correct: public read, admin-only write/
-- update/delete, no service_role in any client — verified during the
-- audit, see gastromania-tasks.md Блок 13).
--
-- 5 MB per image is generous for how these are actually used (rendered at
-- <=80px in admin thumbnails, <=1200px on public pages) — it's sized to
-- comfortably fit an unedited photo straight off a phone camera without
-- needing to be recompressed first, while still bounding worst-case
-- storage/bandwidth abuse.
--
-- Idempotent: a plain `update` re-applying the same values is a no-op on
-- re-run. Existing objects already stored are NOT affected — Supabase
-- Storage only enforces file_size_limit/allowed_mime_types on new
-- uploads (POST) and replacements (PUT), never retroactively against
-- objects already in the bucket, so nothing already referenced by
-- menu_items.image_url / promotions.image_url can break.
update storage.buckets
set
  file_size_limit = 5242880, -- 5 MB, in bytes (5 * 1024 * 1024)
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
where id in ('menu-images', 'promo-images');
