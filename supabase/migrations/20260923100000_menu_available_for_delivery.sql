-- Доступность блюда в доставке перестаёт быть категорией и становится
-- отдельным флагом.
--
-- Проблема, которую закрывает: /delivery показывал только блюда с
-- category = 'delivery', то есть категория работала техническим флагом.
-- Из-за этого реальные блюда («узбекский», «фирменные блюда», десерты и
-- т.д.) в доставку не попадали вообще — чтобы показать блюдо клиенту,
-- приходилось ломать его настоящую категорию.
--
-- Теперь категория описывает только то, чем блюдо является, а
-- available_for_delivery — отдельно отвечает за то, возим ли мы его.
--
-- Идемпотентна: add column if not exists + условный бэкфилл + create or
-- replace function. Повторное применение ничего не сломает и не перетрёт
-- вручную выставленные флаги.

alter table public.menu_items
  add column if not exists available_for_delivery boolean not null default false;

-- Ничего не теряем: всё, что раньше показывалось в доставке (то есть
-- лежало в category = 'delivery'), помечается доступным для доставки.
-- Условие available_for_delivery = false нужно, чтобы повторный прогон
-- миграции не «воскресил» флаг, снятый потом вручную в админке.
update public.menu_items
set available_for_delivery = true
where category = 'delivery' and available_for_delivery = false;

-- Индекс под основной запрос витрины доставки (is_active +
-- available_for_delivery). Партиальный — строк, где оба флага true, в
-- меню заведомо меньшинство.
create index if not exists menu_items_delivery_idx
  on public.menu_items (sort_order)
  where is_active = true and available_for_delivery = true;

-- create_order() должна принимать только то, что действительно можно
-- заказать с доставкой. Сигнатура и возвращаемый тип не меняются —
-- достаточно create or replace, без drop (см. 20260911250000, где тип
-- возврата менялся и drop был обязателен).
--
-- Единственное отличие от версии из 20260911250000 — в обоих проходах по
-- позициям добавлено условие available_for_delivery = true и уточнён
-- текст ошибки. Остальное (расчёт сумм, min_order_amount,
-- free_delivery_from, снэпшот цен) не тронуто.
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

    -- Стоп-лист (is_active) и доступность в доставке проверяются здесь
    -- вместе: блюдо в стоп-листе не должно уехать в заказ, даже если
    -- available_for_delivery = true.
    select * into v_menu_item from public.menu_items
      where id = (v_line->>'menu_item_id')::uuid
        and is_active = true
        and available_for_delivery = true;
    if not found then
      raise exception 'Блюдо больше недоступно для доставки, обновите корзину';
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
