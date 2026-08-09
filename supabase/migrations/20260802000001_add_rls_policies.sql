-- Задача 2.3: is_admin() и RLS-политики для таблиц из 20260801000001_create_core_tables.sql
-- (см. gastromania-spec.md, Этап 3 → "Роли и RLS").

create or replace function public.is_admin() returns boolean
language sql security definer stable as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

alter table public.profiles enable row level security;
alter table public.menu_items enable row level security;
alter table public.promotions enable row level security;
alter table public.reservations enable row level security;
alter table public.orders enable row level security;
alter table public.favorites enable row level security;
alter table public.delivery_settings enable row level security;

-- profiles
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- меню и акции: публично видно активное, админ правит всё
create policy "menu_public_read" on public.menu_items
  for select using (is_active = true or public.is_admin());
create policy "menu_admin_write" on public.menu_items
  for all using (public.is_admin());

create policy "promo_public_read" on public.promotions
  for select using (is_active = true or public.is_admin());
create policy "promo_admin_write" on public.promotions
  for all using (public.is_admin());

-- брони и заказы: оформить может любой, видеть только своё или админ
create policy "reservations_insert_any" on public.reservations
  for insert with check (true);
create policy "reservations_select_own_or_admin" on public.reservations
  for select using (profile_id = auth.uid() or public.is_admin());
create policy "reservations_admin_manage" on public.reservations
  for update using (public.is_admin());

create policy "orders_insert_any" on public.orders
  for insert with check (true);
create policy "orders_select_own_or_admin" on public.orders
  for select using (profile_id = auth.uid() or public.is_admin());
create policy "orders_admin_manage" on public.orders
  for update using (public.is_admin());

-- избранное: только своё
create policy "favorites_own" on public.favorites
  for all using (profile_id = auth.uid());

-- настройки доставки: читают все, правит админ
create policy "delivery_public_read" on public.delivery_settings
  for select using (true);
create policy "delivery_admin_write" on public.delivery_settings
  for all using (public.is_admin());
