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

create policy "orders_insert_any" on public.orders
  for insert with check (true);
create policy "orders_select_own_or_admin" on public.orders
  for select using (profile_id = auth.uid() or public.is_admin());
create policy "orders_admin_manage" on public.orders
  for update using (public.is_admin());

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

**Оплата.** На старте только при получении (`payment_method = 'on_delivery'`). Онлайн-эквайринг (ЮKassa, Точка) добавлять вторым этапом, он требует юрлица, договора и отдельной работы.

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

1. Регистрация: email и пароль, магическая ссылка или вход по телефону через SMS? Для ресторана телефон логичнее всего, но SMS платные.
2. Кто ведёт админку в ресторане и с какого устройства? От этого зависит, насколько мобильной должна быть панель.
3. Доставка своими курьерами или через агрегатор? Если агрегатор, часть логики заказов может отпасть.
