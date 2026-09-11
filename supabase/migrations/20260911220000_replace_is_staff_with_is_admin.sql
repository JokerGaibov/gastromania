-- is_staff() (admin OR manager, введена в 20260911140000) больше не нужна —
-- модель ролей сведена к 'customer'/'admin' (20260911210000). Все политики,
-- ссылавшиеся на is_staff(), переведены обратно на is_admin(); саму
-- функцию удаляем — держать неиспользуемую функцию, дающую доступ по
-- несуществующей больше роли, только путаница на будущее.
--
-- Порядок важен: сначала пересоздать все policy без ссылки на is_staff(),
-- потом удалить функцию — иначе DROP FUNCTION упадёт с "cannot drop
-- function because other objects depend on it".

-- reservations (было в 20260911140000)
drop policy if exists "reservations_select_own_or_admin" on public.reservations;
create policy "reservations_select_own_or_admin" on public.reservations
  for select using (profile_id = auth.uid() or public.is_admin());

drop policy if exists "reservations_admin_manage" on public.reservations;
create policy "reservations_admin_manage" on public.reservations
  for update using (public.is_admin());

-- menu_items (было в 20260911160000)
drop policy if exists "menu_public_read" on public.menu_items;
create policy "menu_public_read" on public.menu_items
  for select using (is_active = true or public.is_admin());

drop policy if exists "menu_admin_write" on public.menu_items;
create policy "menu_admin_write" on public.menu_items
  for all using (public.is_admin());

-- promotions (было в 20260911180000)
drop policy if exists "promo_public_read" on public.promotions;
create policy "promo_public_read" on public.promotions
  for select using (is_active = true or public.is_admin());

drop policy if exists "promo_admin_write" on public.promotions;
create policy "promo_admin_write" on public.promotions
  for all using (public.is_admin());

-- delivery_settings (было в 20260911190000)
drop policy if exists "delivery_admin_write" on public.delivery_settings;
create policy "delivery_admin_write" on public.delivery_settings
  for all using (public.is_admin());

-- storage.objects — menu-images (было в 20260911160000)
drop policy if exists "menu_images_staff_write" on storage.objects;
create policy "menu_images_staff_write" on storage.objects
  for insert with check (bucket_id = 'menu-images' and public.is_admin());

drop policy if exists "menu_images_staff_update" on storage.objects;
create policy "menu_images_staff_update" on storage.objects
  for update using (bucket_id = 'menu-images' and public.is_admin());

drop policy if exists "menu_images_staff_delete" on storage.objects;
create policy "menu_images_staff_delete" on storage.objects
  for delete using (bucket_id = 'menu-images' and public.is_admin());

-- storage.objects — promo-images (было в 20260911180000)
drop policy if exists "promo_images_staff_write" on storage.objects;
create policy "promo_images_staff_write" on storage.objects
  for insert with check (bucket_id = 'promo-images' and public.is_admin());

drop policy if exists "promo_images_staff_update" on storage.objects;
create policy "promo_images_staff_update" on storage.objects
  for update using (bucket_id = 'promo-images' and public.is_admin());

drop policy if exists "promo_images_staff_delete" on storage.objects;
create policy "promo_images_staff_delete" on storage.objects
  for delete using (bucket_id = 'promo-images' and public.is_admin());

-- Публичные read-политики (menu_images_public_read, promo_images_public_read,
-- delivery_public_read) не трогаем — они не ссылались на is_staff().

drop function if exists public.is_staff();
