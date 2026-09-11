-- Человекочитаемый номер заказа (#1001, #1002, ...) поверх внутреннего
-- UUID orders.id, который остаётся техническим идентификатором и
-- единственным, через что строятся FK (order_items.order_id и т.д.) —
-- order_number нигде не используется как ссылочный ключ, только для
-- отображения и будущей переписки с клиентом/провайдером.
create sequence if not exists public.orders_order_number_seq start with 1001;

alter table public.orders add column if not exists order_number integer;

-- Безопасный бэкфилл существующих заказов (в базе уже есть минимум один —
-- ручной тест владельца из предыдущей сессии): нумеруем по created_at, от
-- старого к новому, начиная с 1001, затем передвигаем последовательность
-- за пределы уже выданных номеров, чтобы следующий новый заказ не
-- столкнулся с бэкфилленным значением.
do $$
declare
  r record;
  n integer := 1000;
begin
  for r in select id from public.orders where order_number is null order by created_at asc
  loop
    n := n + 1;
    update public.orders set order_number = n where id = r.id;
  end loop;

  if n > 1000 then
    perform setval('public.orders_order_number_seq', n, true);
  end if;
end $$;

alter table public.orders alter column order_number set default nextval('public.orders_order_number_seq');
alter table public.orders alter column order_number set not null;

do $$
declare
  cons record;
begin
  for cons in
    select conname from pg_constraint
    where conrelid = 'public.orders'::regclass
      and contype = 'u'
      and pg_get_constraintdef(oid) ilike '%order_number%'
  loop
    execute format('alter table public.orders drop constraint %I', cons.conname);
  end loop;
end $$;

alter table public.orders add constraint orders_order_number_unique unique (order_number);

-- Sequence's lifecycle now tracks the column (dropped automatically if the
-- column ever is).
alter sequence public.orders_order_number_seq owned by public.orders.order_number;

-- create_order() must return order_number to the caller (checkout success
-- screen shows it, not the UUID) — return type changes from uuid to
-- jsonb, so the old function has to be dropped first (Postgres won't let
-- create or replace change a function's return type in place).
drop function if exists public.create_order(jsonb, text, text, text, text, text);

create or replace function public.create_order(
  p_items jsonb,
  p_guest_name text,
  p_guest_phone text,
  p_guest_email text,
  p_delivery_address text,
  p_comment text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_order_number integer;
  v_settings public.delivery_settings%rowtype;
  v_line jsonb;
  v_menu_item public.menu_items%rowtype;
  v_qty int;
  v_items_subtotal numeric(10,2) := 0;
  v_delivery_fee numeric(10,2) := 0;
  v_total numeric(10,2);
begin
  if p_guest_name is null or trim(p_guest_name) = '' then
    raise exception 'Укажите имя';
  end if;
  if p_guest_phone is null or trim(p_guest_phone) = '' then
    raise exception 'Укажите телефон';
  end if;
  if p_delivery_address is null or trim(p_delivery_address) = '' then
    raise exception 'Укажите адрес доставки';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Корзина пуста';
  end if;

  select * into v_settings from public.delivery_settings where id = 1;
  if not found or not v_settings.is_delivery_enabled then
    raise exception 'Доставка сейчас недоступна';
  end if;

  for v_line in select * from jsonb_array_elements(p_items)
  loop
    v_qty := nullif(v_line->>'quantity', '')::int;
    if v_qty is null or v_qty <= 0 then
      raise exception 'Некорректное количество';
    end if;
    if v_qty > 50 then
      raise exception 'Слишком большое количество в одной позиции';
    end if;

    select * into v_menu_item from public.menu_items
      where id = (v_line->>'menu_item_id')::uuid and is_active = true;
    if not found then
      raise exception 'Блюдо больше недоступно, обновите корзину';
    end if;

    v_items_subtotal := v_items_subtotal + (v_menu_item.price * v_qty);
  end loop;

  if v_items_subtotal < v_settings.min_order_amount then
    raise exception 'Минимальная сумма заказа — % ₽', v_settings.min_order_amount;
  end if;

  if v_settings.free_delivery_from is not null and v_items_subtotal >= v_settings.free_delivery_from then
    v_delivery_fee := 0;
  else
    v_delivery_fee := v_settings.delivery_fee;
  end if;

  v_total := v_items_subtotal + v_delivery_fee;

  insert into public.orders (
    profile_id, guest_name, guest_phone, guest_email, delivery_address, comment,
    total_amount, delivery_fee, payment_method, payment_status, order_status, consent_at
  ) values (
    auth.uid(), trim(p_guest_name), trim(p_guest_phone), nullif(trim(coalesce(p_guest_email, '')), ''),
    trim(p_delivery_address), nullif(trim(coalesce(p_comment, '')), ''),
    v_total, v_delivery_fee, 'online', 'pending', 'new', now()
  ) returning id, order_number into v_order_id, v_order_number;

  for v_line in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_line->>'quantity')::int;
    select * into v_menu_item from public.menu_items where id = (v_line->>'menu_item_id')::uuid;

    insert into public.order_items (order_id, menu_item_id, name, unit_price, quantity, subtotal)
    values (v_order_id, v_menu_item.id, v_menu_item.name, v_menu_item.price, v_qty, v_menu_item.price * v_qty);
  end loop;

  return jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number);
end;
$$;

grant execute on function public.create_order(jsonb, text, text, text, text, text) to anon, authenticated;
