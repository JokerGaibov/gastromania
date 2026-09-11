-- Блок 7, задача 7.3 (/admin/menu): CRUD блюд + фото + стоп-лист.
--
-- Same gap as reservations (20260911140000): menu_items policies still used
-- is_admin() (role = 'admin' only), so a 'manager' would pass the /admin
-- Next.js gate but see no write access and, worse, no *read* access to
-- inactive (86'd) items — menu_public_read only showed is_active = true to
-- non-admins, so a manager couldn't even find the item they needed to take
-- off the stop-list. Both policies moved to is_staff() (added in
-- 20260911140000, admin OR manager).
drop policy if exists "menu_public_read" on public.menu_items;
create policy "menu_public_read" on public.menu_items
  for select using (is_active = true or public.is_staff());

drop policy if exists "menu_admin_write" on public.menu_items;
create policy "menu_admin_write" on public.menu_items
  for all using (public.is_staff());

-- Storage bucket for dish photos (Block 4.5 in gastromania-tasks.md
-- eventually moves the *public* menu pages off Unsplash onto this same
-- bucket — this migration only sets it up, admin upload only for now).
-- Public bucket: dish photos are meant to be publicly visible on the site,
-- there's no privacy concern here unlike anything in the other tables.
insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

-- storage.objects ships with RLS already enabled on every Supabase
-- project — no `alter table ... enable row level security` needed (and
-- attempting it here could fail without owner-level privileges on a
-- system table).
drop policy if exists "menu_images_public_read" on storage.objects;
create policy "menu_images_public_read" on storage.objects
  for select using (bucket_id = 'menu-images');

drop policy if exists "menu_images_staff_write" on storage.objects;
create policy "menu_images_staff_write" on storage.objects
  for insert with check (bucket_id = 'menu-images' and public.is_staff());

drop policy if exists "menu_images_staff_update" on storage.objects;
create policy "menu_images_staff_update" on storage.objects
  for update using (bucket_id = 'menu-images' and public.is_staff());

drop policy if exists "menu_images_staff_delete" on storage.objects;
create policy "menu_images_staff_delete" on storage.objects
  for delete using (bucket_id = 'menu-images' and public.is_staff());
