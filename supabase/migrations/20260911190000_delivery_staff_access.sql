-- Блок 7, задача 7.5 (/admin/delivery): та же is_admin() → is_staff()
-- замена, как в 20260911140000/160000/180000 — админ и менеджер редактируют
-- настройки доставки наравне. delivery_public_read (чтение всем) не
-- трогается — оно и так открыто всем, это не относится к staff-доступу.
drop policy if exists "delivery_admin_write" on public.delivery_settings;
create policy "delivery_admin_write" on public.delivery_settings
  for all using (public.is_staff());
