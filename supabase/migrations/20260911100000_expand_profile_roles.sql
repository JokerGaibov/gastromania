-- Блок 3 (Авторизация и роли, gastromania-tasks.md): расширяем допустимые
-- значения profiles.role. До этой миграции CHECK разрешал только
-- 'customer'/'admin' (Этап 3 gastromania-spec.md, задача 2.2). Нужны
-- дополнительные staff-роли для будущей админки (Блок 7): 'manager',
-- 'waiter', 'courier'. На этом этапе доступ к /admin получают только
-- 'admin' и 'manager' (проверка в app/admin/layout.tsx) — 'waiter' и
-- 'courier' пока не открывают ничего нового, просто становятся допустимыми
-- значениями колонки, чтобы их можно было назначать людям заранее.
--
-- Назначение ролей остаётся ручным через Supabase Table Editor до задачи
-- 7.7 (/admin/users).
--
-- Идемпотентно: имя автосгенерированного constraint'а не хардкодится —
-- находится динамически по определению (любой CHECK на public.profiles,
-- упоминающий "role") и пересоздаётся под фиксированным именем, так что
-- повторный прогон не падает и не плодит дубликаты.
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
  check (role in ('customer', 'admin', 'manager', 'waiter', 'courier'));
