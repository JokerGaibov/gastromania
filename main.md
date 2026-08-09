# Gastromania — Project Master Document

> Read this before starting any development session. Update it after every significant change.

---

## Project Overview

> **TODO: заменить на данные реального ресторана.**

**Gastromania** is a fictitious three-Michelin-star restaurant website built to Awwwards / Pentagram creative-director standards. It is a single-page marketing and reservation site, not an application. The aesthetic references are Noma, Geranium, Eleven Madison Park, and Osteria Francescana.

- **Location in filesystem:** `/Users/a1/projects/gastronomia`
- **Dev server:** `npm run dev` → `http://localhost:3000`
- **Status:** v0.1 — Initial build approved. Audit complete. Active development.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js | 16.2.7 |
| Language | TypeScript | ^5 |
| Styling | Tailwind CSS | ^4 (via `@tailwindcss/postcss`) |
| Animation | Framer Motion | ^12.40.0 |
| Runtime | React | 19.2.4 |
| Font provider | Google Fonts (next/font) | — |

**No UI component library.** Everything is custom. No shadcn, no Radix, no Headless UI.

---

## Folder Structure

```
gastronomia/
├── main.md                        ← This file
├── next.config.ts                 ← Allows images.unsplash.com remote patterns
├── app/
│   ├── layout.tsx                 ← Root layout: fonts + metadata
│   ├── page.tsx                   ← Assembly page (imports all sections)
│   ├── globals.css                ← Design tokens, global utilities, CSS classes
│   └── components/
│       ├── Navigation.tsx         ← Fixed header + mobile overlay menu
│       ├── Hero.tsx               ← Full-screen parallax cinematic hero
│       ├── Story.tsx              ← Philosophy section with image mosaic + stats
│       ├── Chef.tsx               ← 50/50 portrait + biography section
│       ├── SignatureDishes.tsx    ← Interactive dish explorer with live image swap
│       ├── Reservation.tsx        ← Booking form with success state
│       ├── Gallery.tsx            ← Editorial grid with lightbox
│       ├── Contact.tsx            ← Address, hours, contact details
│       └── Footer.tsx             ← Minimal footer with Michelin notation
```

---

## Components — Detailed Map

### Navigation.tsx
- Fixed header, `z-50`
- Transparent → `bg-[#0A0A0A]/95 backdrop-blur-md` on scroll (threshold: 60px)
- Scroll listener uses `{ passive: true }` — correct
- Mobile: full-screen overlay with staggered link entrance
- Hamburger animates to X via Framer Motion
- **Missing:** Active section highlight via IntersectionObserver

### Hero.tsx
- `h-screen min-h-[700px]` full-bleed
- Background image is `next/image` with `fill` + `preload` (Next 16: `priority` is deprecated in favor of `preload`) + `sizes="100vw"` — fixes LCP
- Parallax image via `useScroll` + `useTransform` (`imageY`, `textY`, `opacity`); `imageY`/`textY` collapse to `0%` when `useReducedMotion()` is true
- Three-line headline with clip-mask reveal (`overflow-hidden` + `y: "100%" → "0%"`)
- Two overlay layers: gradient-to-top + gradient-to-right for depth
- SVG fractal noise grain texture at 3% opacity
- Bottom-right metadata badge (courses / duration)
- Animated scroll indicator with infinite `y` loop
- Has a pre-existing unused `useEffect` import (see Known Issues #12)

### Story.tsx
- 12-column editorial grid layout
- Local `FadeUp` and `RevealLine` utility components (good pattern — reusable within file)
- Three-panel image mosaic (`2 col + 2 stacked`) separated by 1px gap (editorial)
- Statistics row: 4-up grid, stagger-animated on scroll entry
- `useInView` with `margin: "-10%"` for pre-entry trigger

### Chef.tsx
- `min-h-[90vh]` 2-column layout: portrait left, text right
- Portrait is `next/image` (`fill`) wrapped via `motion.create(Image)` so the scale/opacity entrance animation still applies
- Inner parallax on portrait image via `useScroll` scoped to section (`"-6%" → "6%"`); collapses to `0%` when `useReducedMotion()` is true
- Image has scale + opacity entrance animation
- Name badge floats over portrait with delayed entrance
- Chef timeline (3 entries) at base of right column
- **Issue:** No fallback if chef image fails to load (no `alt` fallback styling)

### SignatureDishes.tsx
- Four dishes in a data array with id, name, subtitle, season, description, image URL
- Left panel: clickable list with active state (border color + text opacity changes)
- Right panel: `sticky top-28` — image (`next/image` via `motion.create(Image)`) swaps via `AnimatePresence mode="wait"` (scale entrance)
- Description animated via `AnimatePresence`; on desktop it lives inside the sticky panel, on mobile it's a separate block below the list (see mobile fix below)
- Large ghost number overlay on image (10% opacity Playfair numeral)
- **Fixed (2026-08-09):** sticky panel now works on mobile too — see Changelog v0.1.8. Order swap (`order-1`/`order-2`) puts the image panel first visually; a `ResizeObserver` on the dish list feeds its measured height into the image wrapper's `min-height` so the sticky panel has room to pin; on mobile the panel shows a compact image + name/season caption only (full description moved to its own block below the list) since the original image+description content was nearly as tall as the list itself, leaving no real "stick window". Root cause of the *complete* failure (not just a short window) was `overflow-hidden` on the `<section>` — any non-`visible` overflow on a sticky element's ancestor silently breaks `position: sticky`. Removed it from the section and moved the (unrelated) local clipping it was doing down to the two children that actually need it (Header badge, dish list) to contain their `x` entrance-animation offsets.
- **Issue:** No touch/swipe navigation between dishes on mobile

### Reservation.tsx
- `bg-[#F5F0E8]` cream background — contrast reversal from surrounding dark sections
- 5-column / 7-column split on lg
- Grain texture overlay (SVG data URI, same as Hero — duplicated)
- Form fields use `.refined` CSS class (custom bottom-border only inputs)
- Wine pairing toggle using Tailwind `peer` trick (no JS)
- Submit transitions to thank-you state (local `submitted` state)
- **Issue:** Form submits to void — no API endpoint, no email service
- **Issue:** Date input appearance is browser-native and not styled

### Gallery.tsx
- 4-column editorial grid with `col-span` / `row-span` mixed sizes; thumbnails are `motion.button` (keyboard-focusable, were bare `div`s before) with `next/image`
- Hover overlay with caption reveal (CSS transition, no Framer)
- Lightbox: `AnimatePresence` fade + scale, click-outside to close, `next/image`
- Lightbox is keyboard accessible: Escape closes, ←/→ navigate between images, Tab/Shift+Tab trapped inside the dialog, `role="dialog"` + `aria-modal="true"`, focus returns to the triggering thumbnail on close
- Image URLs have search-and-replace for higher res in lightbox (`w=900` → `w=1400`)
- **Issue:** `row-span-2` grid items can cause layout issues on 2-col mobile

### Contact.tsx
- `contactItems` array stores JSX directly — works but couples data and view
- Three-word editorial headline with mask reveal
- 12-column grid: headline left, contact details right
- Contact detail rows separated by 8% opacity borders
- **Issue:** No map embed or visual location indicator
- **Issue:** JSX-in-data-array pattern is fragile; better as typed data + render function

### Footer.tsx
- Michelin stars rendered as Unicode `★` characters in bronze
- Legal links: Privacy, Accessibility, Press (all `href="#"`)
- Copyright year is dynamic (`new Date().getFullYear()`)

---

## Design System

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| `--black` | `#0A0A0A` | Primary background (Hero, Story, Dishes, Gallery, Contact, Footer) |
| `--cream` | `#F5F0E8` | Primary text on dark; background for Chef, Reservation |
| `--off-white` | `#FAFAF8` | Defined but not currently used |
| `--warm-white` | `#EFEFEA` | Defined but not currently used |
| `--bronze` | `#8C7355` | Accent: italic headings, labels, separator lines, CTAs, active states |
| `--dark-bronze` | `#6B5840` | Defined but not currently used |
| `--charcoal` | `#1C1C1C` | Dark surface used in Chef portrait background |
| `--muted` | `#6B6760` | Defined but not currently used |
| `--border` | `rgba(245,240,232,0.15)` | Defined but components use inline rgba values instead |

**Opacity usage pattern (opacity modifiers on cream):**
- `/70` — primary body text
- `/55` — secondary body text
- `/50` — tertiary / italic text
- `/45` — labels, metadata
- `/35` — dimmed labels
- `/25` — ghost labels
- `/20` or lower — decorative separators

**Observation:** Several CSS variables are defined but components hardcode hex values inline. The design token system is partially used — this should be made consistent.

### Typography

| Role | Font | Weight | Style | Size Range |
|---|---|---|---|---|
| Editorial headings | Playfair Display (`--font-playfair`) | 400 | Normal + Italic | `clamp(2rem, 10vw, 9rem)` |
| Accent headings | Cormorant Garamond (`--font-cormorant`) | 300 | Italic | `text-xl` to `text-2xl` |
| Body copy | Inter (`--font-inter`) | 300–400 | Normal | `text-sm` (`0.875rem`) |
| UI labels | Inter via `.label-refined` | 400 | Uppercase | `0.6875rem` + `tracking-[0.2em]` |

**CSS utility classes defined in globals.css:**
- `.heading-editorial` — Playfair Display, weight 400, tracking -0.02em, line-height 0.95
- `.label-refined` — Inter, 0.6875rem, uppercase, letter-spacing 0.2em
- `.font-serif`, `.font-cormorant`, `.font-body` — font-family shortcuts
- `.nav-link` — underline animation via `::after` pseudo-element
- `.img-zoom` — overflow:hidden + child img scale on hover
- `.refined` — bottom-border-only form input/select/textarea style
- `.line-separator` — 1px × 60px bronze vertical rule

### Animation Patterns

**Two easing constants used across components:**
```ts
const ease = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]; // standard ease-out
const springIn = [0.16, 1, 0.3, 1] as [number, number, number, number];    // spring-like overshoot
```

**Pattern: Heading mask reveal**
Wraps `<motion.h* >` in `<div className="overflow-hidden">`. Animates `y: "100%" → y: "0%"` with `springIn` easing. Produces a theatrical clip-from-below effect.

**Pattern: Scroll-triggered fade-up**
`useInView(ref, { once: true, margin: "-10%" })` → `initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}}`. Used extensively.

**Pattern: Section parallax**
`useScroll({ target, offset: ["start end", "end start"] })` → `useTransform(scrollYProgress, [...], [...])`. Used in Hero (image + text) and Chef (portrait).

**Pattern: AnimatePresence swap**
Used in SignatureDishes (dish image + description) and Gallery (lightbox). `mode="wait"` ensures exit animation completes before enter begins.

**Pattern: Infinite animation**
Scroll indicator: `animate={{ y: [0, 8, 0] }}` with `repeat: Infinity`.

**Pattern: Reduced motion**
Global: root layout wraps the tree in `MotionProvider` (`app/components/MotionProvider.tsx`), which sets `<MotionConfig reducedMotion="user">` — Framer Motion automatically dampens transform-based `animate`/`initial`/`whileInView` animations for users with `prefers-reduced-motion: reduce`, without touching opacity fades. `globals.css` additionally has a CSS-level `@media (prefers-reduced-motion: reduce)` block for non-Framer CSS transitions (`.nav-link`, `.img-zoom`, etc.). Scroll-linked parallax (Hero's `imageY`/`textY`, Chef's `imgY`) isn't covered by `MotionConfig` — those two components call `useReducedMotion()` directly and collapse their `useTransform` output range to `0%` when true.

### Responsive Strategy

- Mobile-first with Tailwind breakpoints
- Primary breakpoints: `sm:` (640px), `lg:` (1024px)
- Container: `max-w-screen-xl mx-auto px-8 lg:px-16`
- Grid: mostly 1-col on mobile → 12-col on `lg:`
- Chef section: stacked portrait on mobile, 50/50 on `lg:`
- Dishes section: full-width stacked on mobile, 5/7 col split on `lg:`
- **Known issue:** Gallery `row-span` CSS doesn't collapse cleanly on 2-col mobile

---

## Reusable UI Patterns

These patterns exist informally across components and should eventually become shared utilities:

| Pattern | Currently in | Should extract to |
|---|---|---|
| `FadeUp` wrapper component | `Story.tsx` (local) | `lib/motion.tsx` or `components/ui/` |
| `RevealLine` component | `Story.tsx` (local) | Same |
| Heading mask reveal | All sections (duplicated) | Shared `<MaskReveal>` component |
| Section eyebrow (line + label) | All sections (duplicated) | Shared `<SectionLabel>` component |
| Easing constants | `Reservation.tsx`, `Story.tsx`, `Contact.tsx` | `lib/motion.ts` |
| Grain texture overlay | `Hero.tsx`, `Reservation.tsx` (duplicated) | Global CSS class or shared component |

---

## Known Issues

Resolved by Блок 1 (see Changelog v0.1.2): Hero LCP, missing `prefers-reduced-motion`, gallery lightbox keyboard accessibility, `<img>` → `next/image`, unused `motion` import in Footer, hardcoded copyright year.

### Critical (affects user experience)
1. **Form submits to void** — Reservation form has no backend, no email service (Resend, SendGrid etc.), no error handling. (Superseded by `gastromania-spec.md` Этап 5 — form will write to Supabase `reservations`, see `gastromania-tasks.md` Блок 5.)

### Moderate (affects quality)
2. **Grain texture SVG is duplicated** in Hero and Reservation — should be a single global overlay or utility class.
4. **Date input is browser-native** — Styled inconsistently across browsers; no min-date constraint.

### Minor (polish)
5. **CSS variables defined but not used consistently** — `--off-white`, `--warm-white`, `--dark-bronze`, `--muted`, `--border` are defined but components use raw hex values.
6. **Contact `contactItems` stores JSX in array** — Couples data and view, hard to maintain.
7. **No active section highlight in nav** — No IntersectionObserver tracking current section.
8. **No structured data (JSON-LD)** — No `Restaurant`, `LocalBusiness`, or `WebSite` schema markup. (Tracked in `gastromania-tasks.md` Блок 10, task 10.2.)
9. **No OG image** — `opengraph-image` not set; social sharing will have no preview. (Tracked in `gastromania-tasks.md` Блок 10, task 10.1.)
10. **Story `FadeUp` adds extra `div`** — The wrapper div can interfere with `overflow-hidden` heading reveal when nested.
11. **Gallery grid collapses poorly on mobile** — `col-span-2 row-span-2` on a 2-col grid creates oversized cells.
12. **`Hero.tsx` unused `useEffect` import** — found while working Block 1, out of scope there; dead code, one ESLint warning.

---

## Design Audit — Weaknesses vs. World-Class Standard

### What works well
- Typography hierarchy is editorial and intentional — Playfair + Cormorant + Inter combination reads as luxury
- Color restraint is correct — the bronze accent used sparingly creates distinction
- Whitespace between sections is generous and intentional
- Heading mask reveals feel cinematic
- The dish explorer interaction (list + sticky image swap) is strong
- Two-tone palette alternation (black sections / cream sections) creates good visual rhythm
- Grain texture adds tactile depth without being overdone

### What falls short of Awwwards standard

**Missing luxury signals:**
- No **custom animated cursor** — Every Awwwards-level site has a cursor that reacts to hover states. This is the most immediate marker of premium intent.
- No **page preloader / intro sequence** — Noma, Geranium, EMP all use a brief loading moment. It gives the browser time to load fonts and images before reveal, preventing FOUT.
- No **horizontal scroll moment** — Many Awwwards SOTD restaurant sites use a horizontal-scroll panel for the menu or gallery. Adds dimension.
- No **magnetic button effect** — Premium CTAs react to mouse proximity.
- No **scroll progress indicator** — A thin 1px bronze line tracking scroll progress is a common luxury signal.

**Motion gaps:**
- **No stagger on navigation links** — Desktop nav links appear instantly; a stagger entrance would be more refined.
- **No exit animations** between sections — Only enter animations exist.
- **Hero text timing feels slightly fast** — The `delay: 0.2` start is aggressive; premium sites wait 0.6–0.8s before text begins, allowing the image to establish.
- **Scroll indicator disappears too abruptly** — The opacity transform cuts off rather than fading elegantly.

**Visual gaps:**
- **No map or visual anchor for location** — The Contact section is text-only. A full-bleed map or architectural photography of the exterior is expected.
- **No press/awards strip** — World's 50 Best, Michelin stars — these should appear as a horizontal marquee or strip, not just mentioned in copy.
- **Gallery grid has inconsistent image ratios** — Some cells have awkward crops because aspect ratios aren't enforced per cell.
- **Reservation form has no elegance on mobile** — The grid collapses but the form still feels dense.

**Branding gaps:**
- **No favicon designed** — Uses Next.js default favicon.ico.
- **No OG image** — Essential for press coverage sharing.
- **Footer is too minimal** — Missing newsletter subscription, language selector (Copenhagen = international guests).

---

## Roadmap

Требования: `gastromania-spec.md`
Очередь задач: `gastromania-tasks.md`
Этот файл — справочник по текущему состоянию кода и дизайн-системе.

---

## Completed Tasks

- [x] **2026-06-07** — Project scaffolded (Next.js 16, TS, Tailwind 4, Framer Motion 12)
- [x] **2026-06-07** — Layout: Playfair Display + Cormorant Garamond + Inter fonts
- [x] **2026-06-07** — Design tokens established in `globals.css`
- [x] **2026-06-07** — Navigation component (transparent → frosted on scroll, mobile overlay)
- [x] **2026-06-07** — Hero section (parallax, heading reveal, scroll indicator)
- [x] **2026-06-07** — Story section (editorial grid, image mosaic, stats row)
- [x] **2026-06-07** — Chef section (50/50, inner parallax, timeline)
- [x] **2026-06-07** — Signature Dishes section (interactive list + AnimatePresence image swap)
- [x] **2026-06-07** — Reservation section (form, wine toggle, success state)
- [x] **2026-06-07** — Gallery section (editorial grid, lightbox)
- [x] **2026-06-07** — Contact section (editorial type, details grid)
- [x] **2026-06-07** — Footer (minimal, Michelin notation)
- [x] **2026-06-07** — TypeScript clean (0 errors after Framer Motion v12 variant fix)
- [x] **2026-06-07** — Project audit + `main.md` created

---

## Changelog

### v0.1.8 — 2026-08-09
- Точечный фикс вне очереди `gastromania-tasks.md` (по прямому запросу владельца, не Блок 4.1 — данные `dishes` остались хардкодом): `SignatureDishes.tsx` — sticky-панель с фото теперь реально работает на мобильном.
  - Настоящая причина полной поломки: `overflow-hidden` на `<section id="dishes">` — любой не-`visible` overflow на предке ломает `position: sticky` у потомков. Убрано с секции; локальный клиппинг (нужен был только чтобы гасить `x`-смещение анимации входа у бейджа в хедере и у кнопок списка) перенесён точечно на эти два элемента.
  - На мобильном `order-1`/`order-2` меняют визуальный порядок (фото → список), `ResizeObserver` на списке прокидывает его высоту в `min-height` обёртки фото — иначе панели физически не из чего «отлипать».
  - Обнаружилось: с длинным описанием блюда панель фото была почти той же высоты, что и список — окно для sticky-эффекта получалось нулевым. Решение (подтверждено владельцем): на мобильном sticky-панель показывает только фото + название + сезон (компактно), полное описание блюда переехало отдельным блоком под список. На десктопе всё как было — описание внутри sticky-панели.
  - Проверено: `npm run build` и `npm run lint` чистые (тот же единственный предсуществующий warning); поведение проверено через Playwright — панель фиксируется на `top: 112px` и корректно отпускается, тап по пункту списка меняет фото/подпись, пока панель зафиксирована.
  - Найдено по ходу, не входило в задачу: на мобильном при загрузке страницы есть ~20px горизонтального скролла, не связанного с этим компонентом (подтверждено скрытием `#dishes` целиком — сдвиг остаётся) — похоже, от `x`-смещений анимации входа в другой секции. Записано в `gastromania-tasks.md` → «Найдено по ходу».

### v0.1.7 — 2026-08-02
- Блок 2, задача 2.5 — **Блок 2 закрыт**. Все три миграции (2.2–2.4) применены владельцем проекта в Supabase Dashboard и вручную проверены: тестовый пользователь → профиль создаётся автоматически, RLS работает (чужие брони/заказы не видны обычному пользователю, админ видит всё).
- Сгенерирован `types/database.ts` (`supabase gen types typescript --project-id rqiqqeuqjgvlvngdhlhj --schema public`) — типы для всех 7 таблиц и функции `is_admin`, подтверждают, что живая схема совпадает с миграциями.
- Ещё не сделано: `.env.local` — переменные `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` до сих пор пустые (см. `gastromania-tasks.md` → «Найдено по ходу»); `lib/supabase/client.ts`/`server.ts` пока не типизированы через `Database` — не входило в рамки 2.5.
- Проверено: `npm run build` и `npm run lint` чистые (тот же единственный предсуществующий warning).

### v0.1.6 — 2026-08-02
- Блок 2, задача 2.4: `supabase/migrations/20260802000002_profile_on_signup.sql` — функция `public.handle_new_user()` (`security definer`, `set search_path = public`) + триггер `on_auth_user_created` (`after insert on auth.users`), создаёт строку в `public.profiles` при регистрации, подтягивая `full_name`/`phone` из `raw_user_meta_data`, если переданы при signup; `role`/`created_at` берутся по дефолтам таблицы. Этого триггера не было в SQL-блоке `gastromania-spec.md` — стандартный паттерн Supabase ("Managing User Data"), адаптирован под структуру `profiles` из задачи 2.2.
- Проверено: `npm run build` и `npm run lint` чистые (тот же единственный предсуществующий warning). Миграции 2.2–2.4 ещё не применены к Supabase — следующий шаг: ручное применение и проверка в Dashboard (контрольная точка «Остановка» в `gastromania-tasks.md`), затем коммит.

### v0.1.5 — 2026-08-02
- Блок 2, задача 2.3: `supabase/migrations/20260802000001_add_rls_policies.sql` — функция `public.is_admin()` (`security definer`, проверяет `role = 'admin'` в `profiles`), `enable row level security` на всех 7 таблицах, все политики из `gastromania-spec.md`: свои/админ доступ к `profiles`; публичное чтение активных `menu_items`/`promotions` + полный доступ админу; вставка `reservations`/`orders` кем угодно, чтение своего или всё админу; `favorites` только свои; `delivery_settings` — чтение всем, запись админу.
- Проверено: `npm run build` и `npm run lint` чистые (тот же единственный предсуществующий warning). Миграция ещё не применена к Supabase — вместе с 2.2 и 2.4 идёт на общую проверку в Dashboard (контрольная точка «Остановка» в `gastromania-tasks.md`).

### v0.1.4 — 2026-08-01
- Блок 2, задача 2.2: `supabase/migrations/20260801000001_create_core_tables.sql` — все 7 таблиц из `gastromania-spec.md` (Этап 3): `profiles`, `menu_items`, `promotions`, `reservations`, `orders`, `favorites`, `delivery_settings`. Без RLS/`is_admin()` — это отдельная миграция, задача 2.3. Добавлена сидовая строка `insert into delivery_settings (id) values (1)`, чтобы синглтон-таблица настроек доставки не была пустой для `/admin/delivery` (задача 7.5); только дефолты таблицы, без выдуманного контента.
- Проверено: `npm run build` и `npm run lint` чистые (тот же единственный предсуществующий warning). Миграция ещё не применена к Supabase — применение и ручная проверка идут после задач 2.2–2.4 вместе (контрольная точка «Остановка» в `gastromania-tasks.md`).

### v0.1.3 — 2026-08-01
- Блок 2, задача 2.1: установлены `@supabase/supabase-js` и `@supabase/ssr`; добавлены `lib/supabase/client.ts` (браузерный клиент через `createBrowserClient`) и `lib/supabase/server.ts` (серверный клиент через `createServerClient`, `cookies()` из `next/headers` — асинхронный API в этой версии Next.js, `getAll`/`setAll` вместо deprecated `get`/`set`/`remove`); созданы `.env.local` (пустые значения, ключи вставляет владелец) и `.env.example`; создан `.gitignore` (в проекте его не было вообще — как и самого git-репозитория).
- Проверено: `npm run build` и `npm run lint` чистые (тот же единственный предсуществующий warning, что и в v0.1.2).

### v0.1.2 — 2026-08-01
- Блок 1 из `gastromania-tasks.md` (быстрые правки): убран неиспользуемый импорт `motion` в Footer.tsx; год копирайта динамический; глобальная поддержка `prefers-reduced-motion` (CSS media query + `MotionConfig reducedMotion="user"` в новом `app/components/MotionProvider.tsx`, параллакс в Hero/Chef обнуляется через `useReducedMotion`); лайтбокс галереи — Escape/стрелки/focus trap/`aria-modal`/`role="dialog"`/возврат фокуса, миниатюры стали `motion.button` вместо `div` (были недоступны с клавиатуры); все `<img>` и `motion.img` (Hero, Story, Chef, SignatureDishes, Gallery) переведены на `next/image` — в Hero использован `preload` вместо `priority` (в Next.js 16 `priority` deprecated).
- Проверено: `npm run build` и `npm run lint` чистые (0 ошибок; 1 предсуществующий warning — неиспользуемый `useEffect` в Hero.tsx, не входил в задачу, записан в `gastromania-tasks.md` → «Найдено по ходу»).

### v0.1.1 — 2026-06-16
- Full Russian localization: all 9 components (Navigation, Hero, Story, Chef, SignatureDishes, Reservation, Gallery, Contact, Footer) translated to Russian.
- `lang="en"` → `lang="ru"` in layout.tsx; metadata (title/description/OG) translated.
- Brand name "Gastromania" kept in Latin script. Location (Copenhagen), chef name, and concept kept as-is — only text translated, not localized to a different city/context.
- Verified: TypeScript clean, dev server renders Russian text correctly.

### v0.1.0 — 2026-06-07
- Initial build. All 9 sections + layout + design system.
- Approved by project owner.

---

## Architectural Decisions

**Decision: No UI component library**
All components are handwritten. Reasoning: UI libraries impose visual and structural constraints that conflict with bespoke luxury design. Every pixel must be intentional.

**Decision: Framer Motion v12 variant pattern**
Transitions are defined on individual `motion.*` elements, not inside variant state objects. This is required by Framer Motion v12's stricter TypeScript types. Easing arrays must be cast `as [number, number, number, number]`.

**Decision: CSS utility classes over Tailwind for recurring patterns**
`.heading-editorial`, `.label-refined`, `.img-zoom`, `.nav-link`, `.refined` live in `globals.css`. Avoids repeating long Tailwind class strings for brand-critical typographic styles.

**Decision: `useInView` with `once: true`**
Animations trigger once on scroll entry, never on scroll out. This is appropriate for a marketing page — re-triggering would be jarring.

**Decision: External Unsplash images**
Currently using Unsplash for placeholder photography. In production these must be replaced with commissioned photography and served from the project's own domain or a CDN.

**Decision: Single-page architecture**
All sections are on one page with smooth scroll navigation. No routing needed for this phase. If a blog, press page, or private dining page is added, Next.js App Router page routing should be used.
