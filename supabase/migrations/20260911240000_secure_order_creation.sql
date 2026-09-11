-- Блок 6, задача 6.5 — закрывает блокер, обозначенный в предыдущих сессиях
-- (main.md v0.1.17, gastromania-tasks.md): orders/order_items больше не
-- принимают прямой INSERT от клиента. Единственный путь создания заказа —
-- security-definer функция public.create_order(), которая сама читает
-- menu_items и delivery_settings и сама считает суммы. Ни цена, ни total,
-- ни payment_status клиентом не передаются вообще — этих параметров у
-- функции просто нет.

-- checkout запрашивает email гостя (см. форму) — на reservations такое
-- поле уже есть (guest_email), на orders не было никогда.
alter table public.orders add column if not exists guest_email text;

create or replace function public.create_order(
  p_items jsonb,              -- [{"menu_item_id": "uuid", "quantity": int}, ...]
  p_guest_name text,
  p_guest_phone text,
  p_guest_email text,
  p_delivery_address text,
  p_comment text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
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

  -- Первый проход: проверить и посчитать сумму блюд. Ничего не пишем,
  -- пока не убедимся, что весь заказ целиком валиден — иначе при ошибке
  -- на третьей позиции первые две уже осели бы в order_items сиротами.
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
  ) returning id into v_order_id;

  -- Второй проход: тот же список, теперь пишем снэпшот по каждой позиции.
  -- Перечитываем menu_items заново — между первым проходом и этой строкой
  -- прошли миллисекунды в одной транзакции, но так корректнее, чем нести
  -- record через промежуточный массив.
  for v_line in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_line->>'quantity')::int;
    select * into v_menu_item from public.menu_items where id = (v_line->>'menu_item_id')::uuid;

    insert into public.order_items (order_id, menu_item_id, name, unit_price, quantity, subtotal)
    values (v_order_id, v_menu_item.id, v_menu_item.name, v_menu_item.price, v_qty, v_menu_item.price * v_qty);
  end loop;

  return v_order_id;
end;
$$;

-- anon — гость оформляет без регистрации (как и раньше у reservations/
-- orders); authenticated — залогиненный customer, auth.uid() внутри
-- функции подставит его profile_id автоматически.
grant execute on function public.create_order(jsonb, text, text, text, text, text) to anon, authenticated;

-- Единственный путь записи в orders/order_items теперь — эта функция.
-- Прямой insert с клиента (тот самый "insert with check (true)",
-- отмеченный как незакрытый вопрос в 20260911230000) — убран.
drop policy if exists "orders_insert_any" on public.orders;
drop policy if exists "order_items_insert_any" on public.order_items;
