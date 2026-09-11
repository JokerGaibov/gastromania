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
│       ├── Reservation.tsx        ← Booking form, premium card UI, writes to Supabase
│       ├── reservation/           ← Reservation subcomponents (card UI + Supabase wiring)
│       │   ├── FieldShell.tsx     ← Shared field-card chrome (border/radius/shadow/focus)
│       │   ├── Calendar.tsx       ← Hand-rolled date popover (disables past + closed days)
│       │   ├── Dropdown.tsx       ← Generic listbox popover (time slots, guest count)
│       │   ├── PhoneField.tsx     ← RU phone mask input, no external dep
│       │   ├── icons.tsx          ← Hand-drawn line icons for the field set
│       │   ├── utils.ts           ← Mask/pluralization/email helpers + time/guest constants
│       │   └── actions.ts         ← "use server" — validates + inserts into `reservations`
│       ├── Gallery.tsx            ← Editorial grid with lightbox
│       ├── Contact.tsx            ← Address, hours, contact details
│       └── Footer.tsx             ← Minimal footer with Michelin notation
├── lib/
│   └── supabase/
│       ├── client.ts              ← Browser client, typed with `Database`
│       └── server.ts              ← Server client (cookies-based), typed with `Database`
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
- 5-column / 7-column split on lg; right column holds a self-contained ~520px booking
  card (white, `rounded-[24px]`, soft shadow) rather than a stretched bordered box —
  redesigned from the original underline-style inputs into bordered field-cards
  (`FieldShell`) with hover lift and a bronze focus ring
- Grain texture overlay (SVG data URI, same as Hero — duplicated, still tracked as a
  Moderate known issue below)
- Fields: Имя, Телефон (RU mask), Email (optional), Дата (custom `Calendar` popover —
  disables past dates and the restaurant's closed days, Sun/Mon), Время (`Dropdown`,
  fixed slots), Гости (`Dropdown`, 1–6, correct RU pluralization), Комментарий
  (240-char counter). No wine-pairing toggle in the form (dropped in the redesign —
  wasn't in the requested field set); the fact still shows in the left-column details
  grid.
- **Wired to Supabase (`reservation/actions.ts`, a Server Action):** validates
  server-side (name/phone/date/time/guests required, email format if present — mirrors
  the client-side `validate()`, since the client can't be trusted alone), reads the
  current session via `supabase.auth.getUser()` for `profile_id` (null if anonymous),
  inserts into `reservations` with `status: "new"` (see Known Issues below for why not
  `"pending"`), returns `{ok:true} | {ok:false, error}`.
- Submit flow has four states (`idle | loading | success | error`): loading disables
  the button and shows a spinner, success clears the form and shows the thank-you
  panel, error shows a dismissable-on-retry banner **without** wiping the guest's
  typed data. The client→server call is wrapped in `try/catch` — a *thrown* exception
  (network failure, misconfigured client) lands on the same error state instead of
  leaving the button stuck on "Отправляем…" forever (this was an actual bug caught
  during testing, not just a hypothetical).
- Double-submit guarded two ways: `disabled` on the button (native, blocks the click)
  and an `if (status === "loading") return` guard inside `handleSubmit` itself
  (defense in depth for programmatic/Enter-key resubmits). Verified experimentally:
  three rapid clicks on the submit button produced exactly one `POST` server-side.
- Required consent checkbox (`ConsentCheckbox.tsx`) before the submit button, linking
  to `/privacy` (new tab, so the client-only form state isn't lost). `consent_at` is
  set to the server's own timestamp at the moment validation passes — genuinely "when
  consent was given," not the column's `default now()`.
- **Issue:** Date input's *time zone* is unresolved — `reserved_at` is written as a
  plain `YYYY-MM-DDTHH:MM:00` with no offset (interpreted in the DB session's
  timezone), because the restaurant's real timezone doesn't exist anywhere yet
  (Этап 2 hasn't landed a real address). Revisit together with Блок 6.4's kitchen-hours
  timezone question once real operating data exists.

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

Resolved by Блок 5 (see Changelog v0.1.9–v0.1.10): reservation form now writes to Supabase with server-side validation and proper loading/success/error states (was "submits to void"); the browser-native date input was replaced by a custom `Calendar` popover.

### Moderate (affects quality)
2. **Grain texture SVG is duplicated** in Hero and Reservation — should be a single global overlay or utility class.

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

### v0.1.14 — 2026-09-11
- Блок 7, задача 7.2 — **`/admin/reservations`: список броней, смена статуса, фильтр по дате.** Сделано вне порядкового номера (7.1 `/admin/orders` блокирован отсутствием Блока 6) по прямому запросу владельца, сразу после подтверждённой ручной проверки Блока 3.
- **`supabase/migrations/20260911140000_reservations_staff_access.sql`** — новая функция `public.is_staff()` (`role in ('admin','manager')`), переписаны политики `reservations_select_own_or_admin`/`reservations_admin_manage` под неё вместо `is_admin()`. **Реальный пробел, найденный при подготовке к задаче:** `/admin` уже одинаково открыт `admin` и `manager` на уровне Next.js-гарда (Блок 3), но RLS на `reservations` до этой миграции проверяла только `role = 'admin'` — менеджер прошёл бы гард страницы, но не увидел бы ни одной брони. `is_admin()` не трогали — она используется в политиках других таблиц (`menu_items`, `promotions`, `orders`, `delivery_settings`), куда доступ `manager` пока не запрашивался; новая `is_staff()` — отдельная функция специально ради этого.
- **`app/admin/AdminShell.tsx`** (новый) — общая шапка/навигация для всего `/admin/*` (вордмарк, ссылки «Обзор»/«Брони», кнопка выхода). Вынесена из `app/admin/layout.tsx` в момент появления второй настоящей страницы под `/admin` — с одной страницей (Блок 3) у каждой странице был свой полноэкранный wrapper, со второй это перестало иметь смысл. `app/admin/page.tsx` упрощён — отдаёт только карточку профиля, обёртку и шапку теперь даёт `AdminShell`.
- **`app/admin/reservations/page.tsx`** — серверный компонент, читает `reservations` через RLS (никакого admin-only RPC), сортировка по `reserved_at` по возрастанию (ближайшая бронь сверху — не порядок вставки), опциональный фильтр `?date=YYYY-MM-DD` по границам календарного дня. Повторно проверяет пользователя и роль сама (не полагается только на `layout.tsx` — см. комментарий в файле, ссылка на предупреждение Next.js про partial rendering между страницами одного layout).
- **`app/admin/reservations/ReservationsTable.tsx`** — мобильные карточки, не таблица (специально: с телефона неудобно читать широкую таблицу). Смена статуса — `<select>` с оптимистичным обновлением и откатом при ошибке, без отдельной кнопки «Сохранить».
- **`app/admin/reservations/actions.ts`** — server action `updateReservationStatus`, проверяет роль ещё раз сама (RLS — настоящий барьер, эта проверка только даёт понятную ошибку в интерфейсе вместо сырой ошибки Postgres).
- **`app/admin/reservations/DateFilter.tsx`** — нативный `<input type="date">` вместо кастомного календаря из `reservation/Calendar.tsx` — для админ-инструмента это осознанно проще и лучше работает на мобильном, чем поддержка ещё одного кастомного попапа.
- **Найдено и исправлено по ходу, не заводя в «Найдено по ходу» (напрямую мешало текущей задаче):** редирект неавторизованного в `app/admin/layout.tsx` был жёстко `'/login?next=/admin'`, независимо от того, на какую вложенную страницу человек на самом деле шёл — с появлением `/admin/reservations` это стало заметно (после входа с брони человека кидало на `/admin`, а не обратно). Server Component layout не получает текущий путь напрямую, поэтому `proxy.ts` теперь прокидывает его через заголовок `x-pathname` (`NextResponse.next({ request: { headers } })`), а `layout.tsx` читает его через `headers()` и строит точный `next=`. Проверено `curl`: `/admin/reservations` без сессии → `307` на `/login?next=/admin/reservations` (раньше было `/login?next=/admin`).
- **Сознательно не сделано:** счётчики на `/admin` (задача 7.6), `/admin/orders` (7.1, ждёт Блок 6). У `AdminShell` нет подсветки активного пункта навигации — не критично для двух пунктов, добавить тривиально, когда пунктов станет больше.
- Проверено: `npm run build`/`lint` чистые. `curl` по всем маршрутам (`/`, `/privacy`, `/admin`, `/admin/reservations`, `/login`) — ожидаемые коды. Playwright-скриншот `/login` на мобильной ширине (390px) — без ошибок консоли. **Полный цикл списка броней (реальные данные, смена статуса, фильтр по дате) не проверялся живьём** — нет тестовых броней/сессии в этой среде; миграция `20260911140000` ещё не применена к БД.

### v0.1.13 — 2026-09-11
- Блок 3, задачи 3.1, 3.2 (частично), 3.3 (частично) — **вход email+пароль через Supabase Auth и защита `/admin`.**
- `app/login/page.tsx` + `app/login/LoginForm.tsx` — страница входа в стиле сайта (та же визуальная система, что у `/privacy` и карточки бронирования: светлая секция `#F5F0E8`, белая карточка формы, `FieldShell` для полей). Форма переиспользует `FieldShell`, `MailIcon`, `isValidEmail` из `app/components/reservation/` — новый только `LockIcon`, добавлен в общий `icons.tsx`. Клиентская валидация (пусто/формат email), состояния `idle|loading|error`, ошибки Supabase (`Invalid login credentials` и т.п.) переведены на русский понятным текстом. `next` из query-параметра валидируется (`safeNextPath`) перед редиректом — без этого параметр из URL мог бы увести на внешний адрес.
- `supabase/migrations/20260911100000_expand_profile_roles.sql` — CHECK на `profiles.role` расширен с `'customer'|'admin'` до `'customer'|'admin'|'manager'|'waiter'|'courier'` (идемпотентно, тем же паттерном, что и миграция Блока 9 — динамический поиск constraint'а по определению, а не по имени). **`types/database.ts` теперь отстаёт от реальной схемы** (типизирован как `role: string`, так что расхождение не ломает типы, но `supabase gen types` стоит перегенерировать при случае).
- `lib/auth/roles.ts` (новый) — `ADMIN_PANEL_ROLES = ['admin', 'manager']` и `canAccessAdminPanel()`. На этом этапе `/admin` открыт только этим двум ролям; `waiter`/`courier` — валидные значения колонки на будущее, доступа никуда не дают.
- `app/admin/layout.tsx` — серверная проверка на каждый рендер: нет пользователя → `redirect('/login?next=/admin')`; есть пользователь, но роль не в `ADMIN_PANEL_ROLES` → рендерится экран «Доступ запрещён» вместо `children` (не редирект — так решил владелец в этом запросе, в отличие от исходного текста задачи 3.2/Готово-критерия в `gastromania-tasks.md`, который предполагал редирект на главную); admin/manager → доступ. Чтение профиля работает под обычной RLS (`profiles_select_own_or_admin` уже разрешает `auth.uid() = id` для любой роли), без дополнительных политик.
- `app/admin/page.tsx` — временная страница: имя (или «Без имени», если `full_name` пусто), email, человекочитаемая роль, кнопка «Выйти». Дублирует проверку из layout (см. комментарий в файле — ссылка на предупреждение Next.js о partial rendering: layout не гарантированно перевыполняется при клиентской навигации между будущими `/admin/*` страницами, поэтому каждая страница должна проверять себя сама).
- `app/admin/LogoutButton.tsx` — клиентский `supabase.auth.signOut()` + редирект на `/login` + `router.refresh()`.
- **`proxy.ts`** (корень проекта, новый файл) — **важная находка при подготовке к задаче:** в Next.js 16 `middleware.ts` переименован в `proxy.ts` (`export function proxy(...)` вместо `export function middleware(...)`) — подтверждено по `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`, как и предупреждает `AGENTS.md` про breaking changes этой версии. Файл делает **только обновление сессии** (вызывает `supabase.auth.getUser()` в контексте, который умеет писать cookies) — без него `lib/supabase/server.ts`'s `setAll` молча не срабатывает при рендере Server Component (см. комментарий в этом файле от Блока 2), и после первого истечения access-token'а следующее обновление могло бы использовать уже использованный rotating refresh-token и тихо разлогинивать пользователя. Никакой редирект-логики в `proxy.ts` нет — она вся в `app/admin/layout.tsx`, согласно собственному принципу проекта («Middleware это удобство, реальная защита в layout и в RLS»). Добавлено сверх буквального списка шагов в запросе владельца, но необходимо, чтобы «вход» был действительно рабочим, а не ломался через час.
- **Сознательно не сделано в этой задаче:** `app/account/layout.tsx` (раздела `/account` ещё нет — Блок 8); кнопка входа/выхода и имя пользователя в общей `Navigation.tsx` (задача 3.4 — не входила в шаги запроса); redirect (вместо отказа) для обычных пользователей, ушедших на `/admin`, — эта часть исходного Готово-критерия задачи 3.2 заменена на явный запрос владельца показывать «Доступ запрещён» на месте.
- Проверено: `npm run build` и `npm run lint` чистые (тот же единственный предсуществующий warning). Вручную: dev-сервер + `curl` — `GET /admin` без сессии отдаёт `307` на `/login?next=/admin`; Playwright-скриншот `/login` — форма рендерится корректно, консоль браузера чистая. Полный цикл вход → `/admin` → выход не проверялся живьём — нет тестовых учётных данных в Supabase (см. «Ручные шаги» в отчёте владельцу); миграция `20260911100000` ещё не применена к БД.

### v0.1.12 — 2026-09-11
- Блок 9, задачи 9.1, 9.2, частично 9.3/9.4 — **Telegram-уведомления о новой брони работают и проверены в бою.** Эта работа была начата вне процесса (файлы `supabase/functions/telegram-notify/index.ts` и миграция `20260822090000_telegram_notify_webhook.sql` лежали незакоммиченными и незадокументированными с прошлой сессии); по подтверждению владельца — доведена до конца в рамках этой сессии.
- **Переписана миграция `20260822090000_telegram_notify_webhook.sql`:** исходный вариант использовал `supabase_functions.http_request` — этот триггер никогда не мог сработать на этом проекте, т.к. схемы `supabase_functions` в БД не существует. Живая (уже работающая, настроенная владельцем вручную через SQL Editor) реализация использует `pg_net` → `net.http_post()`. Миграция переписана под это: `create extension if not exists pg_net`, функция `public.notify_telegram_on_reservation()` (`security definer`) вызывает `net.http_post` с заголовком `Authorization: Bearer <legacy anon JWT>` — именно legacy JWT-формат ключа (`Project Settings → API → Legacy anon key`), не новый `sb_publishable_...` (не JWT, не проходит проверку на шлюзе Edge Function) и не `service_role`. Значение получено напрямую от владельца и вставлено как есть, по его явному решению — это публичный/клиентский по природе ключ (как `NEXT_PUBLIC_SUPABASE_ANON_KEY`), не `service_role`, поэтому коммит в репозиторий не нарушает правило 8 из `gastromania-tasks.md`.
- Миграция сделана идемпотентной: `create extension if not exists`, `create or replace function`, `drop trigger if exists` + `create trigger` — повторный прогон не упадёт и не создаст дублирующий триггер.
- **Найден и исправлен реальный баг сборки, не связанный напрямую с задачей, но блокирующий любой `npm run build` из-за этих же файлов:** `tsconfig.json` включал `**/*.ts` по всему проекту без исключения `supabase/functions/` — Next.js пытался типизировать Deno-рантайм edge-функции (`Cannot find name 'Deno'`) как часть Node/браузерного проекта. Добавлено `supabase/functions` в `exclude`.
- `supabase/functions/telegram-notify/index.ts` не менялся — код уже был написан корректно (валидация формы payload, `formatReservation`/`formatOrder`, HTML-экранирование, секреты `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` только через `Deno.env`/`supabase secrets set`, не в репозитории).
- **Что не сделано осознанно:** триггер на `orders` (вторая часть задачи 9.3) не добавлен — таблица `orders` существует с Блока 2, но реальных заказов ещё нет (Блок 6 не начат), проверить нечем. `formatOrder` в edge-функции уже готов к этому моменту, подключается одной дополнительной миграцией по образцу этой, без изменений в самой функции.
- Проверено: `npm run build` (после фикса `tsconfig.json`) и `npm run lint` чистые (тот же единственный предсуществующий warning — неиспользуемый `useEffect` в `Hero.tsx`). Работу самого триггера/Telegram-доставки проверить локальной сборкой нельзя — по словам владельца, живой тест (реальная бронь → сообщение в Telegram) уже проходил на текущей (не идемпотентной) версии триггера в БД; повторное применение переписанной миграции остаётся на владельце.

### v0.1.11 — 2026-08-22
- Блок 5, задачи 5.2 и 5.4 — **Блок 5 закрыт полностью**, подтверждено владельцем через Supabase Table Editor.
- `app/components/reservation/ConsentCheckbox.tsx` (новый) — обязательный чекбокс согласия на обработку ПД, кастомный (бронзовая заливка + белая галочка), со ссылкой на `/privacy`, открывающейся в новой вкладке (форма client-only, переход по ссылке в текущей вкладке стёр бы введённые данные). Валидация на клиенте и в server action.
- `app/privacy/page.tsx` (новый) — страница политики конфиденциальности, 10 разделов, полностью в дизайн-системе сайта. Юридические реквизиты (ИНН/ОГРН/адрес) честно помечены как «будут опубликованы после оформления юрлица», не выдуманы.
- `actions.ts` — `consent_at` теперь пишется явным серверным `new Date().toISOString()` в момент успешной валидации, а не дефолтом колонки `now()` — раньше это было формально «время вставки строки», а не «момент согласия».
- `Footer.tsx` — «Конфиденциальность» ведёт на `/privacy` вместо `href="#"`.
- **Два реальных бага найдены и исправлены при разработке:** (1) галочка в чекбоксе не появлялась визуально — `peer-checked:opacity-100` был на SVG, вложенном на уровень глубже, чем позволяет Tailwind `peer` (матчит только прямых соседей); переведено на управление через React `checked`-проп напрямую. (2) На мобильном слово «конфиденциальности» в H1 обрезалось за края экрана — добавлен `break-words`.
- Проверено: `npm run build`/`lint` чистые; Playwright — блокировка отправки без согласия, клик по ссылке политики не переключает чекбокс, успешная отправка передаёт `consentGiven: true` в лог сервера без ошибок, мобильная версия `/privacy` без горизонтальной обрезки.

### v0.1.10 — 2026-08-22
- Блок 5, задача 5.1 (частично 5.3) — **бронирование пишет в Supabase**. `app/components/reservation/actions.ts` — новый Server Action `submitReservation`: серверная валидация (имя/телефон/дата/время/гости обязательны, email проверяется форматом, если указан — зеркалит клиентскую `validate()`, т.к. фронтенду не доверяем), читает текущую сессию через `supabase.auth.getUser()` для `profile_id`, вставляет в `reservations` со статусом `"new"`.
- **Решение по статусу:** в задаче просили `pending`, но `CHECK`-ограничение в применённой миграции (`20260801000001_create_core_tables.sql`) допускает только `new|confirmed|cancelled|completed`. Показал находку, владелец подтвердил — используем `'new'` (семантически то же самое, без миграции БД).
- `Reservation.tsx`: состояния `idle|loading|success|error` вместо одного `submitted`. Кнопка блокируется на время отправки (`disabled` + спиннер) и защищена от повторного клика двумя способами — атрибут `disabled` и ранний `return` внутри `handleSubmit`; экспериментально проверено (см. ниже) — три быстрых клика дают ровно один `POST`. При успехе форма очищается и показывается карточка «Спасибо»; при ошибке — баннер с понятным текстом, данные гостя не стираются.
- `lib/supabase/client.ts` и `server.ts` типизированы дженериком `Database` из `types/database.ts` (был долг из v0.1.3 — «не входило в рамки 2.5»).
- **Найден и исправлен реальный баг вне первоначального плана:** `handleSubmit` не оборачивал вызов `submitReservation` в `try/catch` — если сервер-экшен бросает исключение (а не возвращает `{ok:false}`), кнопка зависала на «Отправляем…» навсегда. Поймано при тестировании с намеренно сломанным Supabase URL, не гипотетически. Исправлено.
- **Найдена и устранена утечка секрета, не связанная напрямую с задачей, но обнаруженная по ходу.** В `.env.local` (и, соответственно, в переменных окружения Vercel, куда они были скопированы в задаче 2.1) значения были перепутаны: `NEXT_PUBLIC_SUPABASE_URL` содержал publishable-ключ, а `NEXT_PUBLIC_SUPABASE_ANON_KEY` — похоже на **secret-ключ** (аналог `service_role` в новом формате ключей Supabase, `sb_secret_...`), опубликованный под `NEXT_PUBLIC_*` — то есть потенциально вшитый в клиентский JS-бандл продакшена. Владелец перегенерировал ключи в Supabase Dashboard до того, как я продолжил работу. Также обнаружилось, что присланный владельцем project URL содержал опечатку (переставлены два символа) — сверил с `supabase/.temp/linked-project.json` и живым HTTP-ответом, подтвердил правильный `ref` перед использованием. Переменные на Vercel (Production/Development) обновлены на корректные значения, продакшен пересобран через `vercel redeploy` (без выкладки неподтверждённой ветки) — старое значение больше не в собранном бандле. Preview-переменные по-прежнему не выставлены (CLI-квирк, тот же что в v0.1.7 — `git_branch_required` даже при указанной команде для «all Preview branches»; не блокирует эту задачу).
- Проверено: `npm run build` и `npm run lint` чистые (тот же единственный предсуществующий warning). Полный ручной прогон через Playwright — успешная отправка (запись подтверждена косвенно: `POST / 200`, никаких ошибок в логе сервера, экран «Спасибо» появляется только при `result.ok === true`; **визуальная проверка в Supabase Table Editor остаётся на владельце** — не входит в мои возможности), невалидный email блокируется на клиенте без обращения к серверу, пустая форма — все 5 обязательных полей подсвечиваются с понятным текстом, реальный сетевой сбой (временно битый URL) корректно приводит к баннеру ошибки с сохранением введённых данных.
- Не сделано в этой задаче (сознательно, по её рамкам): чекбокс согласия на обработку ПД и `consent_at` (задача 5.2), страница `/privacy` (задача 5.4), Telegram-уведомления, админка, доставка.

### v0.1.9 — 2026-08-22
- Полная визуальная переработка секции «Бронирование» — премиальная карточка вместо блёклых underline-полей. Новые файлы в `app/components/reservation/`: `FieldShell` (общая карточка поля — рамка/радиус/тень/hover/focus), `Calendar` (собственный попап-календарь без зависимостей, закрытые дни вт–сб исключены), `Dropdown` (универсальный listbox для времени и гостей, полная клавиатурная навигация), `PhoneField` (маска `+7 (___) ___-__-__`), `icons.tsx`, `utils.ts`.
- Состав полей приведён к ТЗ: Имя, Телефон, Email (необязательно), Дата, Время, Гости, Комментарий (счётчик 240 символов). Убран переключатель «Винная пара» из формы (не входил в список полей ТЗ, к состоянию не был подключён — терять нечего); сам факт остался в блоке деталей слева.
- Состояние формы типизировано под колонки таблицы `reservations` из спеки — заложено специально, чтобы v0.1.10 не пришлось переформировывать форму.
- Кнопка отправки — 56px, hover-увеличение и тень, нажатие с пружинным сжатием (Framer Motion).
- Найденный и исправленный на месте баг: `overflow-hidden`-подобная проблема с шевроном dropdown, наезжающим на двухстрочный плейсхолдер в узкой 3-колоночной сетке — перекомпоновано в 2 колонки (Дата+Время / Гости на всю ширину).
- Проверено: `npm run build` и `npm run lint` чистые; вручную проверено на desktop/tablet/mobile через Playwright.
- Ветка `feature/reservation-redesign` также включает отдельный коммит, убирающий кастомный курсор (был добавлен в `feature/creative-polish` для визуальной полировки, по отдельному запросу владельца удалён из обеих веток, чтобы не всплыл при будущем мёрдже).

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
