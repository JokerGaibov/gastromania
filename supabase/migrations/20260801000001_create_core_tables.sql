-- Задача 2.2: базовые таблицы Gastromania (см. gastromania-spec.md, Этап 3).
-- RLS и is_admin() сюда намеренно не входят — отдельная миграция, задача 2.3.

-- пользователи
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

-- меню (переезжает из хардкода в SignatureDishes.tsx)
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null,
  category text not null, -- 'signature' | 'business_lunch' | 'banquet' | 'delivery'
  image_url text,
  is_active boolean not null default true,  -- стоп-лист
  sort_order int default 0,
  created_at timestamptz not null default now()
);

-- акции
create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  discount_percent int,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- бронирование стола
create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  guest_name text not null,
  guest_phone text not null,
  guest_email text,
  party_size int not null,
  reserved_at timestamptz not null,
  comment text,
  status text not null default 'new' check (status in ('new','confirmed','cancelled','completed')),
  consent_at timestamptz not null default now(),  -- согласие на обработку ПД
  created_at timestamptz not null default now()
);

-- заказы на доставку
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  guest_name text not null,
  guest_phone text not null,
  delivery_address text not null,
  items jsonb not null,  -- [{menu_item_id, name, price, qty}]
  total_amount numeric(10,2) not null,
  payment_method text not null default 'on_delivery',
  status text not null default 'new' check (status in ('new','in_progress','delivered','cancelled')),
  consent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- избранное
create table public.favorites (
  profile_id uuid references public.profiles(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete cascade,
  primary key (profile_id, menu_item_id)
);

-- настройки доставки (редактируются из админки)
create table public.delivery_settings (
  id int primary key default 1,
  min_order_amount numeric(10,2) not null default 0,
  delivery_fee numeric(10,2) not null default 0,
  free_delivery_from numeric(10,2),
  kitchen_opens time not null default '11:00',
  kitchen_closes time not null default '22:00',
  zones jsonb,  -- список районов доставки
  is_delivery_enabled boolean not null default true
);

-- сидовая строка-синглтон, чтобы /admin/delivery сразу было что редактировать
insert into public.delivery_settings (id) values (1);
