-- Блок 7, задача 7.4 (/admin/promotions): та же схема, что для reservations
-- (20260911140000) и menu_items (20260911160000) — политики переведены с
-- is_admin() на is_staff() (admin + manager), включая публичное чтение, по
-- той же причине: без этого менеджер не увидел бы неактивные акции в
-- админке и не смог бы их редактировать.
drop policy if exists "promo_public_read" on public.promotions;
create policy "promo_public_read" on public.promotions
  for select using (is_active = true or public.is_staff());

drop policy if exists "promo_admin_write" on public.promotions;
create policy "promo_admin_write" on public.promotions
  for all using (public.is_staff());

-- Отдельный bucket от "menu-images" (20260911160000) — баннеры акций и фото
-- блюд разного назначения и обычно разных пропорций; раздельные bucket'ы
-- проще чистить/ограничивать по отдельности в будущем.
insert into storage.buckets (id, name, public)
values ('promo-images', 'promo-images', true)
on conflict (id) do nothing;

drop policy if exists "promo_images_public_read" on storage.objects;
create policy "promo_images_public_read" on storage.objects
  for select using (bucket_id = 'promo-images');

drop policy if exists "promo_images_staff_write" on storage.objects;
create policy "promo_images_staff_write" on storage.objects
  for insert with check (bucket_id = 'promo-images' and public.is_staff());

drop policy if exists "promo_images_staff_update" on storage.objects;
create policy "promo_images_staff_update" on storage.objects
  for update using (bucket_id = 'promo-images' and public.is_staff());

drop policy if exists "promo_images_staff_delete" on storage.objects;
create policy "promo_images_staff_delete" on storage.objects
  for delete using (bucket_id = 'promo-images' and public.is_staff());
