# Gastromania: спецификация рабочего сайта

**Статус:** заменяет Prioritized Roadmap из `main.md`.
**Цель изменилась:** было портфолио под Awwwards (вымышленный ресторан в Копенгагене), стало реальный сайт действующего ресторана, с которым работает персонал.

Технический аудит и дизайн-система из `main.md` остаются в силе. Меняется только порядок работ и состав задач.

---

## Что выброшено из старого роадмапа

| Задача | Почему |
|---|---|
| P3-1: API формы брони через Resend | Бронь теперь пишется в Supabase, письма вешаются отдельно |
| P3-4: переключатель EN/DA | Датский не нужен. Основной язык русский, английский опционально вторым этапом |
| P2-3: видео-фон Hero | Тяжело, требует продакшена видео, для запуска не критично |

Кастомный курсор, прелоадер, magnetic-кнопка и прочая полировка не выброшены, но перенесены за дату запуска.

---

## Этап 1. Быстрые правки (делаются сразу, переживут любой рефакторинг)

1. Убрать неиспользуемый импорт `motion` в `Footer.tsx`
2. Динамический год копирайта: `new Date().getFullYear()`
3. Поддержка `prefers-reduced-motion` глобально в CSS
4. Клавиатурная доступность лайтбокса галереи: Escape, стрелки, focus trap, `aria-modal`
5. Hero `<img>` на `next/image` с `priority` (фикс LCP)
6. Остальные `<img>` на `next/image`

Отложено намеренно: preconnect к Unsplash (картинки переедут в своё хранилище) и починка мобильных Dishes (компонент всё равно переписывается под чтение из БД).

---

## Этап 2. Реальный контент

Без этого шага невозможно проверить ни SEO, ни структурированные данные, ни тексты форм.

- Настоящее название, адрес, телефон, часы работы, реквизиты
- Русский как основной язык интерфейса и контента
- Свои фотографии: интерьер, блюда, шеф. Unsplash убрать полностью
- Реальное меню с ценами, включая бизнес-ланч и банкетные предложения
- Тексты о концепции и команде

Куда складывать фото: Supabase Storage. Тогда картинки живут рядом с данными и админ может загружать их из панели.

---

## Этап 3. База данных (Supabase)

```sql
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
-- Обновлено 2026-09-11 (архитектура Блока 6 подготовлена заранее, до
-- начала реализации — см. main.md v0.1.17): только онлайн-оплата,
-- order_status и payment_status разведены по разным колонкам, состав
-- заказа — отдельная таблица order_items со снэпшотом цены/названия на
-- момент заказа (менять их задним числом через menu_items нельзя).
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  guest_name text not null,
  guest_phone text not null,
  guest_email text,                          -- добавлено 2026-09-11, checkout запрашивает
  delivery_address text not null,
  total_amount numeric(10,2) not null,       -- items + delivery_fee, считает сервер
  delivery_fee numeric(10,2) not null default 0,  -- снэпшот на момент оформления, не живая ссылка на delivery_settings
  payment_method text not null default 'online' check (payment_method = 'online'),
  payment_status text not null default 'pending'
    check (payment_status in ('pending','paid','failed','refunded','cancelled')),
  provider_payment_id text,                  -- id платежа у провайдера, когда он появится
  paid_at timestamptz,                       -- пишет только серверный webhook, см. ниже
  order_status text not null default 'new'
    check (order_status in ('new','accepted','preparing','ready','out_for_delivery','delivered','cancelled')),
  comment text,
  consent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- состав заказа — снэпшот, не живая ссылка на актуальные цены
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  name text not null,          -- название блюда на момент заказа
  unit_price numeric(10,2) not null,  -- цена на момент заказа
  quantity int not null check (quantity > 0),
  subtotal numeric(10,2) not null,    -- unit_price * quantity
  created_at timestamptz not null default now()
);

-- payment_status и paid_at может менять только запрос от имени
-- service_role (реальный серверный webhook платёжного провайдера) —
-- гарантируется триггером orders_guard_payment_status, а не соглашением на
-- уровне приложения. redirect после оплаты — не доказательство оплаты,
-- единственный источник истины — подтверждённое событие от провайдера.
create or replace function public.guard_order_payment_status_change()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.payment_status is distinct from old.payment_status or new.paid_at is distinct from old.paid_at)
     and auth.role() is distinct from 'service_role' then
    raise exception 'payment_status и paid_at может менять только серверный webhook платёжного провайдера';
  end if;
  return new;
end;
$$;

create trigger orders_guard_payment_status
  before update on public.orders
  for each row execute function public.guard_order_payment_status_change();

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
```

### Роли и RLS

```sql
create or replace function public.is_admin() returns boolean
language sql security definer stable as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

alter table public.profiles enable row level security;
alter table public.menu_items enable row level security;
alter table public.promotions enable row level security;
alter table public.reservations enable row level security;
alter table public.orders enable row level security;
alter table public.favorites enable row level security;
alter table public.delivery_settings enable row level security;

-- profiles
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- меню и акции: публично видно активное, админ правит всё
create policy "menu_public_read" on public.menu_items
  for select using (is_active = true or public.is_admin());
create policy "menu_admin_write" on public.menu_items
  for all using (public.is_admin());

create policy "promo_public_read" on public.promotions
  for select using (is_active = true or public.is_admin());
create policy "promo_admin_write" on public.promotions
  for all using (public.is_admin());

-- брони и заказы: оформить может любой, видеть только своё или админ
create policy "reservations_insert_any" on public.reservations
  for insert with check (true);
create policy "reservations_select_own_or_admin" on public.reservations
  for select using (profile_id = auth.uid() or public.is_admin());
create policy "reservations_admin_manage" on public.reservations
  for update using (public.is_admin());

-- Обновлено 2026-09-11 (задача 6.5 закрыта, см. main.md v0.1.18): прямого
-- insert с клиента в orders/order_items больше нет вообще. Единственный
-- путь создания заказа — public.create_order() (security definer,
-- 20260911240000), которая сама читает menu_items/delivery_settings и
-- сама считает суммы; ни цена, ни total клиентом не передаются, потому
-- что параметров для этого у функции просто нет.
create policy "orders_select_own_or_admin" on public.orders
  for select using (profile_id = auth.uid() or public.is_admin());
create policy "orders_admin_manage" on public.orders
  for update using (public.is_admin());  -- меняет order_status; payment_status/paid_at всё равно заблокированы триггером выше для всех, кроме service_role

alter table public.order_items enable row level security;

create policy "order_items_select_own_or_admin" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.profile_id = auth.uid() or public.is_admin())
    )
  );
create policy "order_items_admin_manage" on public.order_items
  for update using (public.is_admin());
create policy "order_items_admin_delete" on public.order_items
  for delete using (public.is_admin());

-- избранное: только своё
create policy "favorites_own" on public.favorites
  for all using (profile_id = auth.uid());

-- настройки доставки: читают все, правит админ
create policy "delivery_public_read" on public.delivery_settings
  for select using (true);
create policy "delivery_admin_write" on public.delivery_settings
  for all using (public.is_admin());
```

Важно: суммы заказа считать на сервере по ценам из `menu_items`, а не доверять тому, что пришло с клиента.

---

## Этап 4. Роуты

```
app/
├── page.tsx                     лендинг (как сейчас, но с реальным контентом)
├── menu/page.tsx                полное меню из БД
├── promotions/page.tsx          акции
├── delivery/page.tsx            меню на заказ + корзина + оформление
├── privacy/page.tsx             политика обработки персональных данных
├── login/page.tsx
├── account/
│   ├── layout.tsx               guard: авторизованный пользователь
│   ├── page.tsx                 обзор
│   ├── reservations/page.tsx    мои брони
│   ├── orders/page.tsx          мои заказы
│   └── favorites/page.tsx
├── admin/
│   ├── layout.tsx               guard: role = admin
│   ├── page.tsx                 дашборд: новые брони и заказы
│   ├── orders/page.tsx          заказы, смена статуса
│   ├── reservations/page.tsx    брони, смена статуса
│   ├── menu/page.tsx            CRUD меню + тумблер стоп-листа
│   ├── promotions/page.tsx      CRUD акций
│   ├── delivery/page.tsx        зоны, минимальная сумма, часы кухни
│   └── users/page.tsx
└── middleware.ts                проверка сессии и роли
```

Гость оформляет заказ без регистрации: `profile_id` остаётся `null`. Регистрация даёт историю заказов, избранное и автозаполнение адреса.

Навигацию переписать целиком: появляются меню, доставка, акции, вход и кабинет.

---

## Этап 5. Операционка (без этого сайт не работает в реальности)

**Уведомления.** Никто из персонала не будет держать админку открытой. Telegram-бот, который пишет в чат кухни при каждом новом заказе и брони: состав, сумма, адрес, телефон, время. Реализация: Supabase Database Webhook на `insert` в `orders` и `reservations`, дальше Edge Function отправляет сообщение через Bot API.

**Стоп-лист.** Блюдо кончилось в 19:00, убрать его нужно за три секунды с телефона. Тумблер `is_active` в админке вывести крупно, админка обязана быть удобной на мобильном.

**Оплата.** Решение изменилось (2026-09-11): ресторан отказался от оплаты при получении — риск неоплаченных заказов неприемлем. Только `payment_method = 'online'`, схема под это уже подготовлена (`orders.payment_status`, `paid_at`, `provider_payment_id`, триггер `orders_guard_payment_status`). Кухня не начинает готовить, пока `payment_status <> 'paid'`. Конкретный провайдер (ЮKassa, Точка и т.д.) — отдельное решение владельца, подключение только после его подтверждения.

**Ограничения доставки.** Зона, минимальная сумма, часы работы кухни. Форма заказа проверяет их до отправки, иначе будут заказы за город в час ночи.

---

## Этап 6. Право и аналитика (обязательно до запуска)

- Страница «Политика обработки персональных данных» (152-ФЗ)
- Чекбокс согласия в форме брони и оформлении заказа, факт согласия фиксируется в `consent_at`
- Яндекс.Метрика вместо Google Analytics
- Яндекс.Карты в разделе контактов
- Реквизиты юрлица или ИП в футере

---

## Этап 7. Запуск

- Домен и SSL
- Деплой на Vercel, переменные окружения Supabase
- Фавикон, OG-изображение
- JSON-LD `Restaurant` с реальными данными и позициями меню из БД
- `robots.txt`, `sitemap.xml`
- Error boundaries
- Проверка на реальных телефонах, не только в DevTools

---

## После запуска: то, что осталось от Awwwards-роадмапа

Кастомный курсор, прелоадер, активный индикатор секции в навигации, индикатор прогресса скролла, magnetic-кнопка, горизонтальный скролл меню, press-марquee, вынос общих motion-утилит.

Всё это делает сайт красивее и ничего не ломает, если делать после того, как структура перестала двигаться.

---

## Решить до старта

1. ~~Регистрация: email и пароль, магическая ссылка или вход по телефону через SMS?~~ **Решено (2026-09-11): email + пароль.** Реализовано в Блоке 3.
2. ~~Кто ведёт админку в ресторане?~~ **Решено (2026-09-11): один сотрудник, роль `admin`, занимается всем — бронями, меню, акциями, доставкой, заказами.** Многоуровневая модель (`manager`/`waiter`/`courier`) была введена в Блоке 3, затем убрана обратно — не нужна. Устройство по-прежнему не уточнено, панель остаётся мобильно-ориентированной по умолчанию (см. Блок 7 в `gastromania-tasks.md`).
3. Доставка своими курьерами или через агрегатор? Если агрегатор, часть логики заказов может отпасть.
