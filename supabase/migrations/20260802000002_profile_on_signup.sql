-- Задача 2.4: триггер на auth.users, создающий строку в public.profiles при регистрации.
-- Не входило в SQL-блок gastromania-spec.md — стандартный паттерн Supabase
-- ("Managing User Data"), адаптированный под структуру profiles из 20260801000001.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
