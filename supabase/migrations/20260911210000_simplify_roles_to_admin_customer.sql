-- Финальная модель ролей: только 'customer' и 'admin'. 'manager', 'waiter',
-- 'courier' были введены в 20260911100000 для будущей многоуровневой
-- админки, но владелец решил, что заказами и всей /admin занимается один
-- сотрудник — держать три неиспользуемых staff-роли только ради
-- гипотетического будущего было лишним усложнением. Убираются.
--
-- Ремаппинг существующих строк ПЕРЕД ужесточением CHECK — иначе constraint
-- откажется применяться, если в таблице уже есть 'manager'/'waiter'/
-- 'courier'. 'manager' повышается до 'admin' (у него и так был полный
-- доступ к /admin — так никто не теряет то, что уже имел). 'waiter' и
-- 'courier' понижаются до 'customer' (эти роли никогда не давали доступа
-- ни к чему — терять нечего).
update public.profiles set role = 'admin' where role = 'manager';
update public.profiles set role = 'customer' where role in ('waiter', 'courier');

-- Тот же приём, что в 20260911100000 — не хардкодим имя constraint'а.
do $$
declare
  cons record;
begin
  for cons in
    select conname from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format('alter table public.profiles drop constraint %I', cons.conname);
  end loop;
end $$;

alter table public.profiles add constraint profiles_role_check
  check (role in ('customer', 'admin'));
