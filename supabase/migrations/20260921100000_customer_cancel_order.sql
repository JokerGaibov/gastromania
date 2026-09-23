-- Отмена собственного неоплаченного заказа клиентом. Проблема, которую
-- закрывает: клиент оформил заказ, передумал, и заказ висит в
-- pending/new бесконечно — сам клиент убрать его никак не мог.
--
-- Клиенту НЕ выдаётся общий UPDATE на orders (RLS так и остаётся:
-- orders_admin_manage — единственная update-политика, только для admin).
-- Вместо этого — узкая security-definer функция, разрешающая ровно один
-- переход: new + pending → cancelled, и только для своего заказа.
--
-- Идемпотентна: create or replace + повторный grant безопасны при
-- повторном применении.

create or replace function public.cancel_own_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Требуется вход';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Заказ не найден';
  end if;

  -- is distinct from — заодно отсекает гостевые заказы (profile_id is
  -- null): у гостя нет сессии, которой можно доказать владение.
  if v_order.profile_id is distinct from auth.uid() then
    raise exception 'Это не ваш заказ';
  end if;

  -- Оплаченный заказ клиент сам не отменяет: там дальше возврат средств,
  -- а это отдельный процесс после подключения платёжного провайдера.
  if v_order.payment_status <> 'pending' then
    raise exception 'Оплаченный заказ можно отменить только через ресторан';
  end if;

  -- Как только ресторан принял заказ в работу, самостоятельная отмена
  -- тоже закрыта — дальше только через сотрудника.
  if v_order.order_status <> 'new' then
    raise exception 'Заказ уже в работе — отмена только через ресторан';
  end if;

  -- Меняется ровно одна колонка. payment_status не трогается вообще —
  -- orders_guard_payment_status (20260911230000) и не сработает, и не
  -- должен: статус оплаты остаётся делом платёжного провайдера.
  -- Заказ не удаляется: cancelled остаётся в истории клиента.
  update public.orders set order_status = 'cancelled' where id = p_order_id;

  return jsonb_build_object('order_id', p_order_id, 'order_status', 'cancelled');
end;
$$;

grant execute on function public.cancel_own_order(uuid) to authenticated;
