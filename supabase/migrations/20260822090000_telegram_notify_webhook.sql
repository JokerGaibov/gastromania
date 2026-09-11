-- Fire the `telegram-notify` Edge Function on every new reservation.
--
-- `supabase_functions.http_request` (the mechanism Dashboard → Database →
-- Webhooks generates) is NOT available on this project — the
-- `supabase_functions` schema doesn't exist here. The working replacement is
-- `pg_net`'s `net.http_post()`, called directly from a trigger function.
--
-- The Edge Function has JWT verification on, so the request needs a valid
-- Supabase JWT in `Authorization`. This must be the **legacy anon JWT**
-- (Project Settings → API → Legacy anon key, `eyJhbGci...`) — the newer
-- `sb_publishable_...` key is not a JWT and fails gateway verification, and
-- `service_role` must never be used here. Like the anon key already shipped
-- client-side in `NEXT_PUBLIC_SUPABASE_ANON_KEY`, this legacy anon JWT is
-- the public/client-facing key, not a secret — safe to commit.
--
-- Idempotent: safe to re-run. `create extension if not exists`, `create or
-- replace function`, and `drop trigger if exists` + `create trigger` all
-- no-op cleanly against an already-applied state instead of erroring or
-- duplicating the trigger.
--
-- Scaling to orders later (Блок 6): once delivery orders exist, add a second
-- trigger the same way, `after insert on public.orders` — the function
-- already branches on `table` to format either kind of message.

create extension if not exists pg_net;

create or replace function public.notify_telegram_on_reservation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://rqiqqeuqjgvlvngdhlhj.supabase.co/functions/v1/telegram-notify',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxaXFxZXVxamd2bHZuZ2RobGhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NjM3MzQsImV4cCI6MjEwMTEzOTczNH0.I-Ywl6BNWlJEr2ry908OdAmM4bp6RWpngXI9u4ty2G8'
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', to_jsonb(NEW),
      'old_record', null
    )
  );
  return NEW;
end;
$$;

drop trigger if exists reservations_telegram_notify on public.reservations;

create trigger reservations_telegram_notify
after insert on public.reservations
for each row
execute function public.notify_telegram_on_reservation();
