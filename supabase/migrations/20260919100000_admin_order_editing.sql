-- Admin order editing (согласованное изменение состава заказа после того,
-- как выясняется, что позиции нет в наличии). Тот же принцип, что уже
-- закрыл создание заказов (20260911240000, create_order()): цену клиент
-- никогда не передаёт — только menu_item_id+quantity, сервер сам читает
-- menu_items.price. Payment provider не подключается этой миграцией.

-- === orders: новые поля для финансовой разницы после правки оплаченного заказа ===
-- paid_amount — сколько реально было оплачено, независимо от того, что
-- total_amount может измениться после этой правки. Пока нет платёжного
-- провайдера, ничего его не выставляет — NULL для всех текущих заказов.
-- Когда появится provider-webhook, ему тоже нужно будет писать это поле
-- при payment_status → 'paid' (вне рамок этой миграции).
--
-- pending_balance_amount — текущая непогашенная разница: положительное
-- значение = клиент должен доплатить, отрицательное = ресторан должен
-- вернуть клиенту, 0 = расчёт закрыт (или заказ ещё не оплачен — для
-- pending-заказов это поле не имеет смысла, там правки просто меняют
-- total_amount напрямую, будущая оплата пойдёт по новой сумме — см. RPC
-- ниже). НЕ реализует сам возврат/доплату — только фиксирует сумму для
-- будущей ручной или provider-based обработки, как и просил владелец.
alter table public.orders
  add column if not exists paid_amount numeric(10,2),
  add column if not exists pending_balance_amount numeric(10,2) not null default 0;

-- Эти два поля НЕ добавлены в orders_guard_payment_status (20260911230000)
-- — та защита нарочно строгая (только service_role) именно потому, что
-- payment_status/paid_at запускают автоматическое поведение (кухня видит
-- "не начинать приготовление"). paid_amount/pending_balance_amount —
-- информационные поля для последующей ручной обработки человеком, тот же
-- уровень доверия, что уже есть у order_status/comment через
-- orders_admin_manage (20260802000001) — никакого нового риска не вносится,
-- просто два новых admin-доступных столбца в уже admin-доступной строке.
-- Реальная защита от произвольных сумм — RPC ниже, которая одна пересчитывает
-- эти поля из реальных menu_items.price, а не то, что где-то запрещено их
-- трогать вообще.

-- === order_revisions: история согласованных изменений состава заказа ===
create table if not exists public.order_revisions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  changed_by uuid references public.profiles(id) on delete set null,
  reason_code text not null check (reason_code in ('item_unavailable', 'customer_requested_swap', 'quantity_change', 'other')),
  reason_note text,
  customer_confirmed boolean not null,
  old_items jsonb not null,
  new_items jsonb not null,
  old_total numeric(10,2) not null,
  new_total numeric(10,2) not null,
  old_comment text,
  new_comment text,
  created_at timestamptz not null default now()
);

alter table public.order_revisions enable row level security;

-- Тот же паттерн, что order_items_select_own_or_admin (20260911230000) —
-- владелец заказа видит свою историю правок (задел под будущую пометку
-- "Заказ был изменён рестораном по согласованию" в /account/orders — сама
-- эта пометка в UI этой миграцией/задачей не строится, только видимость
-- данных), admin видит всё. Никакого insert/update/delete для обычных
-- клиентов — единственный писатель ниже, RPC (security definer).
drop policy if exists "order_revisions_select_own_or_admin" on public.order_revisions;
create policy "order_revisions_select_own_or_admin" on public.order_revisions
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_revisions.order_id
        and (o.profile_id = auth.uid() or public.is_admin())
    )
  );

-- === Закрытие ранее найденного (production-readiness audit, gastromania-tasks.md
-- Блок 13/14) пробела: order_items_admin_manage/order_items_admin_delete
-- (20260911230000) давали admin прямой UPDATE/DELETE на order_items в обход
-- какого-либо пересчёта цен — не эксплуатировалось ни одним UI, но теперь,
-- когда появляется первый реальный редактор состава заказа, самое время
-- закрыть эту дыру, а не оставлять её рядом с новым RPC. Ничего в проекте
-- эти две policy не использует (OrderStatusControl пишет только
-- order_status) — удаление безопасно.
drop policy if exists "order_items_admin_manage" on public.order_items;
drop policy if exists "order_items_admin_delete" on public.order_items;

-- === admin_update_order_items(): единственный путь изменить состав уже
-- существующего заказа. security definer — тот же механизм, что и у
-- create_order(): работает через привилегию владельца функции, а не через
-- RLS-политики на order_items (которых для admin теперь и не осталось).
create or replace function public.admin_update_order_items(
  p_order_id uuid,
  p_items jsonb,              -- [{"menu_item_id": "uuid", "quantity": int}, ...] — полный новый состав, не diff
  p_reason_code text,         -- 'item_unavailable' | 'customer_requested_swap' | 'quantity_change' | 'other'
  p_customer_confirmed boolean,
  p_comment text,
  p_reason_note text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_line jsonb;
  v_menu_item public.menu_items%rowtype;
  v_qty int;
  v_new_items_subtotal numeric(10,2) := 0;
  v_new_total numeric(10,2);
  v_old_items jsonb;
  v_new_items jsonb;
  v_paid_amount numeric(10,2);
  v_pending_balance numeric(10,2) := 0;
begin
  if not public.is_admin() then
    raise exception 'Недостаточно прав';
  end if;

  if p_reason_code not in ('item_unavailable', 'customer_requested_swap', 'quantity_change', 'other') then
    raise exception 'Некорректная причина изменения';
  end if;
  if p_reason_code = 'other' and (p_reason_note is null or trim(p_reason_note) = '') then
    raise exception 'Укажите причину изменения';
  end if;
  -- Единственный жёсткий гейт всей функции — без него изменение состава
  -- не должно сохраняться ни при каких обстоятельствах.
  if not p_customer_confirmed then
    raise exception 'Изменение заказа требует подтверждения согласования с клиентом';
  end if;

  -- Блокируем строку заказа на время транзакции — правки не должны
  -- гоняться с параллельным изменением того же заказа (например, второй
  -- вкладкой того же админа).
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Заказ не найден';
  end if;

  -- Разрешённые для редактирования статусы — задача явно ограничивает
  -- 'new'/'accepted'; preparing/ready/out_for_delivery/delivered/cancelled
  -- через этот путь не редактируются вообще.
  if v_order.order_status not in ('new', 'accepted') then
    raise exception 'Изменение состава недоступно для заказа в статусе «%»', v_order.order_status;
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'В заказе должна остаться хотя бы одна позиция — для полной отмены используйте смену статуса на «Отменён»';
  end if;

  -- Снэпшот ДО изменения — записывается в order_revisions как есть, не
  -- пересчитывается задним числом.
  select coalesce(jsonb_agg(jsonb_build_object(
    'menu_item_id', menu_item_id, 'name', name, 'unit_price', unit_price,
    'quantity', quantity, 'subtotal', subtotal
  )), '[]'::jsonb) into v_old_items
  from public.order_items where order_id = p_order_id;

  -- Тот же двухпроходный паттерн, что в create_order() — сначала проверяем
  -- и считаем сумму по реальным ценам menu_items, ничего не пишем, пока не
  -- убедимся, что весь новый состав целиком валиден.
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
      raise exception 'Блюдо больше недоступно, обновите список позиций';
    end if;

    v_new_items_subtotal := v_new_items_subtotal + (v_menu_item.price * v_qty);
  end loop;

  -- delivery_fee — снэпшот с момента оформления, не пересчитывается здесь
  -- (тот же принцип, что уже заявлен в 20260911230000 для самого
  -- delivery_fee: изменение действующего тарифа не должно задним числом
  -- менять уже оформленные заказы). min_order_amount/is_delivery_enabled
  -- тоже намеренно не проверяются — это правила для НОВОГО оформления, не
  -- для согласованной правки уже принятого заказа.
  v_new_total := v_new_items_subtotal + v_order.delivery_fee;

  delete from public.order_items where order_id = p_order_id;

  for v_line in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_line->>'quantity')::int;
    select * into v_menu_item from public.menu_items where id = (v_line->>'menu_item_id')::uuid;

    insert into public.order_items (order_id, menu_item_id, name, unit_price, quantity, subtotal)
    values (p_order_id, v_menu_item.id, v_menu_item.name, v_menu_item.price, v_qty, v_menu_item.price * v_qty);
  end loop;

  select coalesce(jsonb_agg(jsonb_build_object(
    'menu_item_id', menu_item_id, 'name', name, 'unit_price', unit_price,
    'quantity', quantity, 'subtotal', subtotal
  )), '[]'::jsonb) into v_new_items
  from public.order_items where order_id = p_order_id;

  -- Финансовая разница — только для уже оплаченных заказов. paid_amount
  -- самоинициализируется значением total_amount ДО этой правки при первом
  -- использовании (до этой функции ничего не могло изменить total_amount
  -- после оплаты — значит на момент первой правки текущий total_amount и
  -- есть фактически оплаченная сумма). Дальнейшие правки того же заказа
  -- уже опираются на сохранённый paid_amount, а не на промежуточный
  -- total_amount из предыдущей правки.
  if v_order.payment_status = 'paid' then
    v_paid_amount := coalesce(v_order.paid_amount, v_order.total_amount);
    v_pending_balance := v_new_total - v_paid_amount;
  else
    v_paid_amount := v_order.paid_amount;
    v_pending_balance := 0;
  end if;

  update public.orders
  set total_amount = v_new_total,
      comment = nullif(trim(coalesce(p_comment, '')), ''),
      paid_amount = v_paid_amount,
      pending_balance_amount = v_pending_balance
  where id = p_order_id;

  insert into public.order_revisions (
    order_id, changed_by, reason_code, reason_note, customer_confirmed,
    old_items, new_items, old_total, new_total, old_comment, new_comment
  ) values (
    p_order_id, auth.uid(), p_reason_code, nullif(trim(coalesce(p_reason_note, '')), ''), p_customer_confirmed,
    v_old_items, v_new_items, v_order.total_amount, v_new_total, v_order.comment, nullif(trim(coalesce(p_comment, '')), '')
  );

  return jsonb_build_object(
    'order_id', p_order_id,
    'old_total', v_order.total_amount,
    'new_total', v_new_total,
    'payment_status', v_order.payment_status,
    'pending_balance_amount', v_pending_balance
  );
end;
$$;

-- Только authenticated (admin проверяется внутри самой функции) — в
-- отличие от create_order(), у редактирования существующего заказа нет
-- гостевого сценария.
grant execute on function public.admin_update_order_items(uuid, jsonb, text, boolean, text, text) to authenticated;
