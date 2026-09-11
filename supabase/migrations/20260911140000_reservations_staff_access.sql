-- Блок 7, задача 7.2 (/admin/reservations): менеджеру нужен тот же доступ к
-- броням, что и админу. `/admin` уже одинаково открыт 'admin' и 'manager' на
-- уровне Next.js-гарда (app/admin/layout.tsx, Блок 3), но RLS на
-- reservations до этой миграции опиралась на is_admin(), которая проверяет
-- только role = 'admin'. Без этой миграции менеджер прошёл бы гард страницы,
-- но не увидел бы ни одной брони и не смог бы сменить статус — RLS молча
-- отфильтровала бы всё, без осмысленной ошибки в интерфейсе.
--
-- Отдельная функция is_staff(), а не расширение самой is_admin() — чтобы не
-- менять смысл is_admin() везде, где она уже используется (menu_items,
-- promotions, orders, delivery_settings) и куда доступ manager пока не
-- запрашивался.
--
-- Идемпотентно: create or replace function + drop policy if exists/create.
create or replace function public.is_staff() returns boolean
language sql security definer stable as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'manager')
  );
$$;

drop policy if exists "reservations_select_own_or_admin" on public.reservations;
create policy "reservations_select_own_or_admin" on public.reservations
  for select using (profile_id = auth.uid() or public.is_staff());

drop policy if exists "reservations_admin_manage" on public.reservations;
create policy "reservations_admin_manage" on public.reservations
  for update using (public.is_staff());
