-- Блок 7, задача 7.7 (/admin/users): управление пользователями и ролями,
-- только для role = 'admin'.
--
-- === email без service_role ===
-- Email гостя живёт в auth.users, а не в public.profiles — обычному
-- клиенту (даже с ролью admin) он через PostgREST не виден: auth.users не
-- в schema public и не выставлена ни в одном API. Единственный
-- API-способ прочитать чужой email — Supabase Admin API
-- (supabase.auth.admin.*), которому обязательно нужен service_role. В этом
-- проекте service_role не заведён вообще (ни в .env.local, ни на Vercel —
-- см. gastromania-tasks.md, правило 8) и заводить его специально ради
-- одного поля в таблице — лишний секрет с последствиями от прошлой
-- утечки (main.md v0.1.10) без необходимости.
--
-- Вместо этого — колонка public.profiles.email, которую наполняет и
-- держит в актуальном состоянии триггер на auth.users. Это чтение
-- auth.users не через API, а напрямую в базе, в момент срабатывания
-- триггера (тот же security-definer механизм, что уже используется в
-- handle_new_user из 20260802000002) — service_role тут ни при чём, это
-- обычная миграция, применяемая так же, как и все остальные.
alter table public.profiles add column if not exists email text;

-- Разовый бэкфилл для пользователей, заведённых до этой миграции —
-- handle_new_user наполнял profiles.email только для новых регистраций,
-- начиная отсюда.
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is distinct from u.email;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, email)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    new.email
  );
  return new;
end;
$$;

-- Держит profiles.email в актуальном состоянии, если гость сменит почту
-- через штатный флоу Supabase Auth (иначе персонал видел бы устаревший
-- email до следующего ручного бэкфилла).
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- === Реальная уязвимость, найденная при подготовке к этой задаче ===
-- У "profiles_update_own" (20260801000001) нет with check по колонкам —
-- любой авторизованный пользователь мог прямо сейчас, без всякой
-- админки, выполнить
--   supabase.from('profiles').update({ role: 'admin' }).eq('id', auth.uid())
-- своим собственным клиентским ключом и назначить себе роль admin. RLS
-- разрешала это ещё до появления этой задачи — обнаружилось только сейчас,
-- потому что строить страницу управления ролями и не закрыть очевидный
-- путь самоповышения было бы безответственно. Закрывается триггером ниже,
-- а не одной лишь RLS-политикой — RLS "with check" не имеет доступа к OLD
-- строке, а тут нужно сравнение "роль меняется" (new.role <> old.role),
-- что делает только BEFORE UPDATE триггер.
create or replace function public.guard_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if not public.is_admin() then
      raise exception 'Только администратор может менять роль';
    end if;
    -- Владелец не должен случайно остаться без единственного admin'а —
    -- ни через эту страницу, ни через прямой запрос в обход интерфейса.
    if old.role = 'admin' and (
      select count(*) from public.profiles where role = 'admin' and id <> old.id
    ) = 0 then
      raise exception 'Нельзя понизить последнего администратора';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_role_change on public.profiles;
create trigger profiles_guard_role_change
  before update on public.profiles
  for each row execute function public.guard_profile_role_change();

-- profiles_select_own_or_admin (20260802000001) уже использует is_admin(),
-- не is_staff() — сознательно не трогаем: только admin должен видеть
-- список чужих профилей, ровно как просил владелец ("manager не должен
-- иметь доступ к этой странице").
--
-- А вот UPDATE чужой строки раньше не был разрешён вообще никому (только
-- "profiles_update_own", auth.uid() = id) — без этой политики admin не
-- смог бы поменять роль другому пользователю через обычный клиент.
drop policy if exists "profiles_admin_update_any" on public.profiles;
create policy "profiles_admin_update_any" on public.profiles
  for update using (public.is_admin());
