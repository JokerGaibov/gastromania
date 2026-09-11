-- Архитектурная подготовка Блока 6 (доставка/заказы/онлайн-оплата) — не
-- подключает платёжного провайдера, не создаёт /admin/orders. Только схема,
-- RLS и защитные триггеры, чтобы дальше корзину/checkout/webhook можно было
-- реализовать не переделывая orders.
--
-- Реальных строк в orders/order_items нет (Блок 6 ещё не начат) — все
-- структурные изменения безопасны.

-- === Переименование status → order_status ===
-- Явно разводим "статус приготовления/доставки" и "статус оплаты" —
-- смешивать их в одной колонке было ошибкой, которую проще исправить сейчас,
-- чем после того, как появятся реальные заказы.
alter table public.orders rename column status to order_status;

-- Старый CHECK (унаследовал новое имя колонки при rename, но всё ещё
-- разрешает старые значения 'new'/'in_progress'/'delivered'/'cancelled') —
-- находим динамически и заменяем на актуальный набор статусов кухни/
-- доставки.
do $$
declare
  cons record;
begin
  for cons in
    select conname from pg_constraint
    where conrelid = 'public.orders'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%order_status%'
  loop
    execute format('alter table public.orders drop constraint %I', cons.conname);
  end loop;
end $$;

alter table public.orders add constraint orders_order_status_check
  check (order_status in ('new', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'));

-- === items (jsonb) → order_items (нормализованная таблица со снэпшотом) ===
-- Старая колонка ничем не использовалась (Блок 6 не начат) — снэпшот по
-- каждой позиции (название/цена на момент заказа) требует отдельной таблицы,
-- один jsonb-блок этого не давал сделать надёжно.
alter table public.orders drop column if exists items;

-- === Оплата ===
-- Только online — ресторан отказался от предоплаты наличными/картой курьеру
-- (риск неоплаченных заказов). CHECK можно будет ослабить отдельной
-- миграцией, если это решение изменится.
alter table public.orders alter column payment_method set default 'online';
update public.orders set payment_method = 'online' where payment_method is distinct from 'online';

do $$
declare
  cons record;
begin
  for cons in
    select conname from pg_constraint
    where conrelid = 'public.orders'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%payment_method%'
  loop
    execute format('alter table public.orders drop constraint %I', cons.conname);
  end loop;
end $$;

alter table public.orders add constraint orders_payment_method_check
  check (payment_method = 'online');

alter table public.orders
  add column if not exists payment_status text not null default 'pending',
  add column if not exists provider_payment_id text,
  add column if not exists paid_at timestamptz,
  -- Стоимость доставки на момент оформления — снэпшот отдельно от
  -- delivery_settings.delivery_fee, чтобы будущее изменение тарифа не
  -- задним числом не поменяло сумму уже созданного заказа.
  add column if not exists delivery_fee numeric(10,2) not null default 0,
  -- Не было в исходной схеме orders (Блок 2) вообще — а Telegram-сообщение
  -- о заказе (см. Этап 5 gastromania-spec.md и telegram-notify/index.ts)
  -- должно показывать комментарий клиента, как и у reservations.
  add column if not exists comment text;

do $$
declare
  cons record;
begin
  for cons in
    select conname from pg_constraint
    where conrelid = 'public.orders'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%payment_status%'
  loop
    execute format('alter table public.orders drop constraint %I', cons.conname);
  end loop;
end $$;

alter table public.orders add constraint orders_payment_status_check
  check (payment_status in ('pending', 'paid', 'failed', 'refunded', 'cancelled'));

-- === order_items: снэпшот состава заказа ===
-- name/unit_price фиксируются в момент заказа и не меняются, даже если
-- menu_items.name/price потом изменится или блюдо вовсе удалят
-- (menu_item_id → set null, а не cascade — история заказа не должна
-- ломаться из-за того, что блюдо сняли с меню).
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  name text not null,
  unit_price numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  subtotal numeric(10,2) not null,
  created_at timestamptz not null default now()
);

alter table public.order_items enable row level security;

-- Тот же принцип, что и у orders_insert_any (Блок 2): гость оформляет заказ
-- без регистрации, поэтому RLS не может требовать profile_id = auth.uid()
-- на вставку. ВАЖНО (см. отчёт по этой задаче, не решается этой миграцией):
-- пока checkout не построен как единственный путь записи (например, через
-- security-definer RPC, принимающую только menu_item_id+quantity и
-- считающую цены сама), этот "with check (true)" технически позволяет
-- любому клиенту с publishable-ключом вставить order_items с произвольной
-- ценой напрямую, в обход будущего серверного пересчёта. RLS сама по себе
-- это не закрывает — обязательно решить архитектурно в Блоке 6 до того, как
-- checkout примет первый платёж.
drop policy if exists "order_items_insert_any" on public.order_items;
create policy "order_items_insert_any" on public.order_items
  for insert with check (true);

drop policy if exists "order_items_select_own_or_admin" on public.order_items;
create policy "order_items_select_own_or_admin" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.profile_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "order_items_admin_manage" on public.order_items;
create policy "order_items_admin_manage" on public.order_items
  for update using (public.is_admin());

drop policy if exists "order_items_admin_delete" on public.order_items;
create policy "order_items_admin_delete" on public.order_items
  for delete using (public.is_admin());

-- === payment_status/paid_at — только серверный webhook ===
-- "redirect после успешной оплаты не является доказательством оплаты" —
-- единственный источник истины это webhook платёжного провайдера, вызванный
-- как Route Handler с service_role (у webhook нет пользовательской Supabase
-- сессии вообще — это внешний HTTP-запрос от провайдера, не браузер). Этот
-- триггер физически не даёт изменить payment_status/paid_at ни одному
-- обычному запросу (anon/authenticated), включая admin через обычный
-- клиент — auth.role() для service_role-запроса и для запроса
-- залогиненного пользователя различаются на уровне Postgres-роли сессии,
-- и это не обходится ни через RLS-политику, ни через orders_admin_manage.
create or replace function public.guard_order_payment_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.payment_status is distinct from old.payment_status or new.paid_at is distinct from old.paid_at)
     and auth.role() is distinct from 'service_role' then
    raise exception 'payment_status и paid_at может менять только серверный webhook платёжного провайдера';
  end if;
  return new;
end;
$$;

drop trigger if exists orders_guard_payment_status on public.orders;
create trigger orders_guard_payment_status
  before update on public.orders
  for each row execute function public.guard_order_payment_status_change();
