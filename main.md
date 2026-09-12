# Gastromania — Project Master Document

> Read this before starting any development session. Update it after every significant change.

---

## Project Overview

**Gastromania** — реальный действующий ресторан в Москве (ул. 7-я Кожуховская, 9, ТЦ «Мозаика», м. Дубровка). Публичный сайт (лендинг + бронирование + доставка) плюс full-stack приложение поверх Supabase: аутентификация, панель администратора, корзина/checkout, готовая архитектура онлайн-оплаты (провайдер ещё не выбран), Telegram-уведомления персоналу. Изначально проект стартовал как вымышленный Awwwards-портфолио-кейс (три звезды Мишлен, Копенгаген) — с 2026-08-01 полностью переведён на реальные данные; с 2026-09-12 публичный маркетинговый контент тоже заменён на реальные факты (v0.1.21). Визуальный премиальный стиль исходного дизайна сохранён везде.

- **Location in filesystem:** `/Users/a1/Desktop/Сайт для Gastromania`
- **Dev server:** `npm run dev` → `http://localhost:3000`
- **Status:** Активная разработка. Публичный контент и админ-панель (брони/меню/акции/доставка/пользователи/заказы) готовы; оплата ждёт выбора провайдера; часть контента (фото, часы работы, меню) ждёт данных от владельца — см. `gastromania-tasks.md`, Блок 12.

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

### v0.1.22 — 2026-09-12
- **`SignatureDishes` скрыт с публичной главной**, по прямому решению владельца сразу вслед за v0.1.21 — описывал вымышленные блюда нордической кухни, не соответствующие реальной (турецкой/ближневосточной) команде. `app/page.tsx` больше не рендерит `<SignatureDishes />` — **компонент не удалён**, файл и вся его архитектура (интерактивный список, sticky-панель фото, снэпшот layout под мобильный/десктоп) остаются нетронутыми для будущего реального меню.
- Починены два прямых следствия скрытия секции (не более того — не расширял правку сверх необходимого): пункт «Меню» (`href="#dishes"`) убран из `Navigation.tsx`, «Посмотреть меню» убрано из `CallToAction.tsx` — обе ссылки вели бы в никуда (якорь `#dishes` больше не существует на странице). Не заменил их на дубли `/delivery` — там уже есть отдельный пункт «Доставка»/кнопка «Заказать доставку», указывать на то же самое дважды было бы лишним. Заголовок CTA-блока поправлен под новый состав кнопок («Стол, меню или доставка» → «Стол или доставка»).
- `gastromania-tasks.md`, Блок 12 — добавлена задача 12.11 «вернуть `SignatureDishes` после реального меню», с явным чек-листом (реальные блюда, снова включить импорт, по желанию вернуть пункты меню в навигацию/CTA).
- Проверено: `npm run build`/`lint` чистые.

### v0.1.21 — 2026-09-12
- **Публичный контент и production polish — вне очереди, по прямому запросу владельца.** Заменён почти весь вымышленный демо-контент (Копенгаген, три звезды Мишлен, вымышленный шеф «Элара Восс», World's 50 Best, «100 км радиус закупок», «18 гостей», выдуманные email/телефон/соцсети) на реальные факты о ресторане. Backend (auth/admin/orders/RLS/payment-архитектура/Telegram) не тронут — только публичные страницы и контент. Платёжный провайдер не подключался.
- **`app/components/Chef.tsx` — полностью переписан.** Реальный шеф Эргюн Даи, биография — точный текст владельца без изменений (только разбит на абзацы). **Фото шефа нет — сознательно не использован stock/AI-портрет** (это было бы хуже, чем совсем без фото): вместо `<Image>` — премиальный текстовый плейсхолдер (моно-инициалы «ЭД» на тёмном фоне, те же пропорции grid/aspect, что и у фото) — замена на реальное фото потом будет заменой одного элемента, не переделкой layout. Добавлена секция «Команда кухни» — три карточки (Рюстем Умидович, Хайри Алпарслан, Абдулла Сезгин), тоже без фото. Убрана вымышленная «timeline» (Kikunoi/Geranium/2018) — реальных дат основания нет.
- **`app/components/Story.tsx` — About/концепция переписаны.** Текст про «поле → кухню → стол», «100 км радиус», «один приём гостей» — убран (ничего из этого не соответствует реальному ресторану). Заменён на текст о международной команде (страны из био шефов), гастрономии, гостеприимстве — без дат/наград/фамилий владельцев. **«Awards row»** (3 звезды Мишлен / 18 гостей / #4 World's 50 Best / 100 км) удалён целиком — вместо выдумывания замены поставлена **реальная** география команды (Турция/Катар/ОАЭ и Оман/Украина/Ирак/Россия) в том же визуальном ритме.
- **`app/components/Contact.tsx` — переписан под реальный адрес.** Москва, ул. 7-я Кожуховская 9, ТЦ «Мозаика», м. Дубровка, три преимущества локации (рядом с метро / отдельный вход через трап / собственная парковка) — все три факта от владельца, не выдуманы. Часы работы — честно `«Уточняется»`, не подставлены вымышленные (в отличие от старого «Вторник–Суббота, 19:00»). Fake email/phone (`reservations@gastronomia.dk`, датский номер) и мёртвые ссылки на Instagram/Pinterest (`href="#"`) — удалены целиком, не заменены на другие выдумки. Добавлен плейсхолдер под карту (без подключения Яндекс.Карт или другого API — не было необходимости, задача явно просила не тащить лишнюю интеграцию).
- **`app/components/Footer.tsx`** — «Копенгаген · С 2018 года» → «Москва · м. Дубровка»; «Три звезды Мишлен» (полностью выдумано) убрано, вместо него — реальный адрес; «Gastromania ApS» (датское юрлицо, неверная юрисдикция) → просто «Gastromania» (тем же принципом честности, что уже применялся в `/privacy` для реквизитов юрлица); мёртвые ссылки «Пресса»/«Доступность» (`href="#"`, никуда не ведущие) удалены — остался только рабочий `/privacy`.
- **`app/components/Hero.tsx`** — эйбрow «Три звезды Мишлен · Копенгаген» → «Москва · м. Дубровка»; подзаголовок «Восемнадцать гостей, одно вечернее видение» (выдуманная вместимость) → про международную команду; нижний правый блок «Дегустационное меню · 18 блюд · 4,5 часа» (полностью выдуман) — удалён целиком, заменить нечем, пока нет реального меню.
- **`app/components/SignatureDishes.tsx`** — точечно тронута только CTA-строка: убрана выдуманная «18 БЛЮД» и поправлен реальный баг (кнопка называлась «Полное меню», но вела на `#reservation`, а не на меню — переименована в «Забронировать столик», чтобы текст соответствовал месту назначения). **Сами карточки блюд (авангардная нордическая кухня — морской ёж, гранитный бульон, ферментированные сливки) намеренно не тронуты** — они не просто демо-контент, а описывают полностью другую кухню, чем у реальной команды (турецкая/ближневосточная, судя по био шефов). Переписать своими выдуманными блюдами означало бы нарушить тот же принцип «не выдумывать факты» — нужно либо реальное меню, либо явное решение владельца скрыть секцию. Отмечено как открытый вопрос в `gastromania-tasks.md` (Блок 12).
- **`app/components/Gallery.tsx`** — те же 6 Unsplash-плейсхолдеров (не менялись — реальные фото/видео у владельца есть, но ещё не переданы в проект), подписи переведены с вымышленной нордической поэзии («Первый Снег», «Камень и Берег») на честные генерические категории (Интерьер/Атмосфера/Блюда/На кухне/Сервировка), плюс `alt`-текст явно помечает «временное фото» — структура теперь прямо соответствует тому, что просил владелец (Hero media/Интерьер/Атмосфера/Блюда/Галерея), готова принять реальные категоризированные фото без переделки.
- **`app/components/Navigation.tsx`** — состав пунктов: Главная (скролл наверх)/О ресторане/Меню/Акции/Доставка, отдельно CTA «Брони» (тот же визуальный вес, что был у старой кнопки «Забронировать столик» — просто переименован, не задвоен отдельным пунктом навигации) и **новый пункт «Аккаунт»/«Вход»** — читает сессию на клиенте (`supabase.auth.getUser()`, только для выбора текста/ссылки, ничего не меняет и не пишет) и ведёт на `/account/orders`, если пользователь уже вошёл, иначе на `/login`. Admin-ссылок в публичной навигации не было и не появилось.
- **`app/promotions/page.tsx` (новая)** — публичная страница активных акций, понадобилась под пункт «Акции» в навигации (иначе он вёл бы в никуда). Та же логика «сейчас активна» (is_active + окно `starts_at`/`ends_at`), что уже используется в счётчике `/admin`-дашборда — никаких новых RLS-политик, `promo_public_read` уже это разрешала.
- **`app/components/CallToAction.tsx` (новый компонент)** — блок «Готовы начать?» перед `Footer`: Забронировать стол / Посмотреть меню / Как добраться (все три — скролл по текущей странице) / Заказать доставку (`/delivery`). Без телефона и соцсетей — их всё ещё нет.
- **`app/layout.tsx`** — `title`/`description`/OpenGraph под реальный адрес и локацию; добавлен базовый JSON-LD `Restaurant` (`@type: Restaurant`, имя + адрес + `areaServed`) — **никакого `aggregateRating`/`review`**, потому что реальных данных для этого нет. Фавикон не менялся — нового лого не появилось.
- **Найденный по ходу реальный баг сети песочницы (не код-баг):** первый визуальный прогон домашней страницы через Playwright показал console-ошибки `400` на все Unsplash-изображения — `images.unsplash.com` резолвится в приватный IP (`240.0.0.142`) при DNS-запросе из процесса `next dev` в этой sandboxed-среде, и встроенная SSRF-защита Next.js Image Optimizer отказывается проксировать такой ответ. Прямой `curl` до того же URL из этой же сессии отдаёт `200` — значит проблема в сетевом пути конкретно dev-сервера в этой песочнице, не в коде и не в самом Unsplash. На реальном Vercel-деплое такого не будет (DNS резолвится нормально). Не пытался «чинить» — это не баг, который можно починить в коде.
- Проверено: `npm run build`/`lint` чистые. Playwright на 390/768/1440 — Hero, About, Chef (+ команда), Contact (+ преимущества + карта-плейсхолдер), CTA, Footer, `/promotions` — все читаются, вёрстка не ломается, реальные факты отображаются корректно (текст виден несмотря на баг с Unsplash-картинками выше). **Полный список того, что ещё нужно от заказчика — в `gastromania-tasks.md`, Блок 12.**

### v0.1.20 — 2026-09-11
- `/admin/orders` — визуальное разделение по `payment_status`. Новый `PaymentStatusBadge.tsx` — 5 отдельных цветовых состояний (pending/paid/failed/refunded/cancelled), чистая презентационная логика без интерактивности (менять `payment_status` из UI и раньше было нельзя — `orders_guard_payment_status`, v0.1.17 — сейчас только визуал сверху).
- `pending` получил отдельную, самую громкую подачу — сплошной красный баннер на всю ширину карточки, «⚠ НЕ ОПЛАЧЕН», а не просто значок в углу, как остальные три неоплаченных статуса (`failed`/`refunded`/`cancelled` — своя более спокойная плашка тем же принципом «не начинать приготовление», но без сплошной заливки). `paid` — компактный зелёный бейдж в шапке карточки, раньше при оплаченном заказе статус оплаты вообще не показывался явно.
- `OrderStatusControl.tsx` **не тронут** — вся логика "смена статуса только при оплате, иначе доступна только отмена" сохранена как есть, по прямому требованию.
- Мелкие мобильные правки: `overflow-hidden` на карточке (чтобы баннер не вылезал за скруглённые углы), `truncate` на длинных email/названиях позиций, шапка карточки в колонку на узких экранах вместо сжатия в одну строку.
- Telegram-шаблон (`telegram-notify/index.ts`) — **сверен с чек-листом этого запроса, не менялся.** Уже покрывает всё: номер заказа, клиент, телефон, адрес, позиции с количеством, subtotal по позициям и общий, доставка, итог, комментарий, время, явная отметка «✅ Оплата подтверждена» — готов с v0.1.18/19, всё ещё не подключён ни к какому триггеру.
- Проверено: `npm run build`/`lint` чистые. Визуально в браузере на живой сессии `/admin/orders` не проверял — нет доступа с admin-сессией из этой среды; полагался на код-ревью и то, что build/typecheck проходят.

### v0.1.19 — 2026-09-11
- Человекочитаемый номер заказа. `supabase/migrations/20260911250000_order_number.sql` — `orders.order_number` (`integer`, `unique`, `default nextval(orders_order_number_seq)`, старт с 1001), `orders.id` (uuid) остаётся техническим — FK (`order_items.order_id`) продолжают строиться через него. Безопасный бэкфилл для уже существующих заказов (в базе как минимум один — ручной тест владельца из v0.1.18): нумерует по `created_at` от старого к новому начиная с 1001, затем двигает sequence за пределы выданных значений, чтобы следующий реальный заказ не столкнулся с бэкфилленным номером.
- `create_order()` пришлось пересоздать с новым типом возврата (`uuid` → `jsonb`, `{order_id, order_number}`) — Postgres не даёт поменять возвращаемый тип через `create or replace`, только `drop` + заново. Сам номер клиент передать не может — это `default` на колонке, а не параметр функции.
- UUID убран из customer-facing экранов: checkout success показывает `#{order_number}`, как и `/account/orders`, `/admin/orders`, `telegram-notify` (функция не подключена к триггеру, но обновлена заранее — то же правило, что и раньше: не переделывать её при реальном подключении).
- Проверено: `npm run build`/`lint` чистые. `curl` на `/`, `/delivery`, `/checkout` — без регрессий. Живой прогон с реальным заказом не делал — миграция ещё не применена.

### v0.1.18 — 2026-09-11
- **Блок 6 (кроме подключения провайдера) — корзина, checkout, безопасное создание заказа, `/account/orders`, `/admin/orders`.** Задача 6.5 закрыта — это был блокер, отдельно оговорённый владельцем перед началом блока.

**6.5 — безопасное создание заказа (главное в этой сессии)**
- `supabase/migrations/20260911240000_secure_order_creation.sql` — функция `public.create_order()` (`security definer`), единственный путь записи в `orders`/`order_items`. Принимает только `menu_item_id`+`quantity` по каждой позиции плюс контактные данные — ни цены, ни `total_amount`, ни `payment_status` среди параметров нет вообще, их неоткуда передать с клиента. Внутри: подряд для каждой позиции читает `menu_items` (обязательно `is_active = true`, иначе — исключение «Блюдо больше недоступно»), считает `subtotal`, суммирует, сверяет с `delivery_settings.min_order_amount`, считает `delivery_fee` (с учётом `free_delivery_from`), пишет `orders` (`payment_status='pending'`, `order_status='new'`), затем `order_items` — снэпшот `name`/`unit_price`/`quantity`/`subtotal` на момент заказа.
- **Прямые небезопасные INSERT убраны:** `drop policy "orders_insert_any"` и `drop policy "order_items_insert_any"` — тот самый пробел, отмеченный как открытый вопрос в v0.1.17. Теперь `grant execute on function create_order(...) to anon, authenticated` — единственный способ для клиента создать заказ.
- `orders.guest_email` — колонки не было вовсе (только у `reservations`), а форма checkout её запрашивает; добавлена.

**Корзина и публичные страницы**
- `lib/cart/CartContext.tsx` — React Context + `localStorage`, без внешних зависимостей (соответствует решению проекта «никаких UI-библиотек»). Хранит `menuItemId`/`name`/`price`/`imageUrl`/`quantity` — `price` только для отображения, `create_order()` его игнорирует и пересчитывает сам.
- `app/delivery/page.tsx` — публичная страница, читает `menu_items` (`category='delivery'`, `is_active=true`) через уже существующую RLS-политику `menu_public_read`, без новых политик. `DeliveryMenuGrid.tsx` (добавление в корзину/степпер количества), `CartBar.tsx` (закреплённая внизу панель с суммой и переходом на checkout, скрыта при пустой корзине).
- `app/checkout/page.tsx` + `CheckoutForm.tsx` — сводка корзины (количество/удаление), поля имя/телефон (`PhoneField`, переиспользован из `reservation/`)/email (подставляется из `profiles.email`, если есть сессия)/адрес/комментарий, `ConsentCheckbox` (тоже переиспользован без изменений). Итог на экране — **только предпросмотр**: реальная сумма всегда только та, что вернул `create_order()`. Кнопка отправки блокируется, если сумма корзины меньше `min_order_amount` или доставка выключена (`delivery_settings.is_delivery_enabled`) — сервер проверяет то же самое ещё раз внутри RPC, экран это не единственная защита.
- **После успешного заказа** — не редирект, а состояние прямо на странице: номер заказа + «Для завершения оформления требуется онлайн-оплата» (провайдера ещё нет — ничего похожего на «оплачено» не показывается и не может быть показано, `payment_status` остаётся `pending`).
- `app/components/Navigation.tsx` — добавлен пункт «Доставка» → `/delivery`. **Попутно найденный и исправленный баг:** остальные пункты навигации — это `#`-якоря на одной странице (`document.querySelector('#story')` и т.д.); `document.querySelector('/delivery')` — синтаксически невалидный CSS-селектор, бросил бы исключение прямо в `useEffect` при монтировании. `handleLinkClick` и эффект с `IntersectionObserver` теперь различают `#`-якоря и обычные роуты.

**`/account/orders` — личный кабинет покупателя**
- `app/account/layout.tsx` (новый) — гард на любого авторизованного пользователя (не только admin, в отличие от `app/admin/layout.tsx`), тот же приём с `x-pathname` из `proxy.ts` для точного `next=` после логина.
- `app/account/orders/page.tsx` — список своих заказов с составом. RLS уже была верной с прошлой сессии (`orders_select_own_or_admin`/`order_items_select_own_or_admin`, `profile_id = auth.uid() or is_admin()`) — новых политик не потребовалось, только интерфейс.

**`/admin/orders`**
- Список с фильтрами по `order_status` (все 7 значений + «Все»), видно всё, что просил владелец: номер, дата, клиент, телефон, адрес, состав, суммы, `payment_status`, `paid_at`, комментарий.
- `OrderStatusControl.tsx` — меняет только `order_status` (реальная защита `payment_status` — триггер `orders_guard_payment_status` из v0.1.17, эта проверка тут лишняя подстраховка). **Пока `payment_status != 'paid'` — обычный select недоступен вообще**, единственное действие — «Отменить заказ»: UI-уровневая реализация правила «кухня не начинает заказ, пока не оплачен» (не отдельный DB CHECK — такой constraint сломал бы легитимный возврат после доставки, см. рассуждение в v0.1.17). Неоплаченные заказы дополнительно выделены рамкой и баннером.

**Telegram — по-прежнему не подключён, специально**
- Функция `telegram-notify` не менялась в этой сессии (уже готова с v0.1.17: ждёт перехода `payment_status` в `'paid'`, сама подтягивает `order_items`). Триггер на `orders` **не создавался** — подключать раньше провайдера бессмысленно и рискованно (неоплаченные заказы просто никогда не породили бы событие, проверить дошло бы сообщение или нет было бы нечем).

**Сознательно не сделано / известные ограничения**
- Провайдер не подключён, `payment_status` никогда не станет `'paid'` в этой сборке — соответствует прямому указанию не делать fake payment.
- Часы работы кухни (`delivery_settings.kitchen_opens`/`kitchen_closes`) **не проверяются** при оформлении — ни на клиенте, ни в `create_order()`. Не было явно указано в списке требований этой сессии, а придумывать поведение (что считать «сейчас»: серверное время, время браузера гостя?) без ответа на этот вопрос не стал.
- Зона/радиус доставки — показывается информационно (список районов из `delivery_settings.zones`), адрес гостя **не сверяется** с ним программно. Гео-модели в схеме нет (только плоский список названий районов), сверка потребовала бы либо геокодирования, либо доверия свободному тексту — ни то, ни другое не выглядело правильным решением без обсуждения.
- Гость (без регистрации) не может вернуться на `/account/orders` за своим заказом — у него нет сессии, `profile_id` в его заказе `null`. Тот же, уже известный компромисс, что и раньше принимался для брони гостем.
- Проверено: `npm run build`/`lint` чистые — по ходу поймал настоящую ошибку линта (новое правило `react-hooks/set-state-in-effect` на гидратации корзины из `localStorage`; это легитимный «запускается один раз при монтировании» паттерн, а не тот антипаттерн, который правило ловит — точечно подавлено одной строкой с комментарием, не глобально). `curl` без сессии: `/delivery` и `/checkout` — `200` (публичные), `/account/orders` и `/admin/orders` — `307` на точный `/login?next=...`. Playwright, мобильная ширина 390px — пустые состояния `/delivery` и `/checkout` рендерятся корректно, консоль браузера чистая. **Реального заказа никто не оформлял** — в БД пока нет ни одного блюда с `category='delivery'`, создать тестовые данные я не могу (нет доступа к живой БД); миграция `20260911240000` не применена.

### v0.1.17 — 2026-09-11
- **Архитектурная сессия, вне очереди задач, по прямому запросу владельца.** Зафиксирована финальная модель ролей (`admin`/`customer`), схема `orders`/`order_items` под онлайн-оплату, защитные триггеры. Никакой платёжный провайдер не подключён, `/admin/orders` не построен — сознательно, так велел владелец.

**1. Роли: admin/customer, manager/waiter/courier убраны**
- `supabase/migrations/20260911210000_simplify_roles_to_admin_customer.sql` — существующие строки сначала перемаплены (`manager` → `admin`, у него и так был полный доступ; `waiter`/`courier` → `customer`, они не давали доступа ни к чему), затем CHECK на `profiles.role` ужесточён обратно до `('customer','admin')`. Тем же динамическим поиском constraint'а, что и раньше.
- `supabase/migrations/20260911220000_replace_is_staff_with_is_admin.sql` — `is_staff()` (admin OR manager, была введена в 20260911140000) больше не нужна. Все политики, которые на неё ссылались — `reservations_select_own_or_admin`/`reservations_admin_manage`, `menu_public_read`/`menu_admin_write`, `promo_public_read`/`promo_admin_write`, `delivery_admin_write`, плюс шесть storage-политик на `menu-images`/`promo-images` — пересозданы на `is_admin()`. Функция `is_staff()` удалена (`drop function`) — порядок операций важен: сперва снять с неё все зависимости (иначе `DROP FUNCTION` падает), потом дропнуть.
- `lib/auth/roles.ts` — `ADMIN_PANEL_ROLES = ['admin']`, `ALL_ROLES` — только `customer`/`admin`.
- **UI-чистка вслед за упрощением:** `AdminShell.tsx` и `app/admin/page.tsx` (дашборд) раньше скрывали пункт «Пользователи» от `manager` через `adminOnly`-фильтр — теперь эта развилка бессмысленна (кто угодно, кто вообще попал в `/admin`, уже `admin`), фильтр убран, `AdminShell` больше не принимает `role` как проп. Комментарии в `app/admin/{reservations,menu,users}/{page,actions}.tsx`, упоминавшие `is_staff()`/`manager`, поправлены на актуальное состояние (исторические упоминания в более старых записях этого changelog **не трогал** — это факт истории, а не текущее состояние).
- Защита от самоповышения роли (`guard_profile_role_change`, Блок 7.7) и защита последнего admin'а — **не тронуты, продолжают работать** ровно так же под новой моделью.

**2. Архитектура заказов и онлайн-оплаты (`orders`/`order_items`)**
- `supabase/migrations/20260911230000_orders_payment_architecture.sql`:
  - `orders.status` → переименован в **`order_status`** (со старым CHECK `new/in_progress/delivered/cancelled` → новым `new/accepted/preparing/ready/out_for_delivery/delivered/cancelled`) — явно развели «статус кухни/доставки» и «статус оплаты», их больше не спутать.
  - `orders.items` (jsonb-блок) **удалена** — заменена нормализованной таблицей `order_items` (`menu_item_id` → `set null`, не `cascade`, чтобы удаление блюда из меню не портило историю заказа; `name`/`unit_price`/`quantity`/`subtotal` — снэпшот на момент заказа, независимый от текущих `menu_items.price`).
  - Новые колонки `orders`: `payment_status` (`pending|paid|failed|refunded|cancelled`, default `pending`), `provider_payment_id`, `paid_at`, `delivery_fee` (снэпшот стоимости доставки на момент оформления — независим от последующих правок `delivery_settings`), `comment` (в исходной схеме Блока 2 отсутствовала вовсе, а Telegram-сообщение о заказе должно её показывать — как у `reservations`).
  - `payment_method` — CHECK теперь разрешает только `'online'` (было `default 'on_delivery'` без CHECK вовсе). Ослабить можно будет отдельной миграцией, если оплата при получении когда-нибудь понадобится.
  - **`orders_guard_payment_status`** — `BEFORE UPDATE`-триггер: если меняется `payment_status` или `paid_at`, а `auth.role() <> 'service_role'` — исключение. Реальная гарантия того, что «клиент не должен иметь возможность напрямую менять payment_status» — не на уровне приложения, а на уровне БД; не обходится ни через `orders_admin_manage` (она осталась на `is_admin()`, но эта проверка её не заменяет — работает поверх, для любого запроса, включая admin через обычный клиент). Будущий контролируемый refund-flow (упомянутый владельцем) тоже должен будет идти через service_role-контекст, а не через обычную сессию администратора — иначе тот же триггер его заблокирует.
  - `order_items` — RLS включена: `select` своё-или-admin (через `exists`-подзапрос к `orders`, т.к. прямого `profile_id` в этой таблице нет), `update`/`delete` только `is_admin()`. **`insert` — `with check (true)`, тем же принципом, что уже был у `orders_insert_any`/`reservations_insert_any` (гость оформляет без регистрации).**
- **Незакрытый архитектурный вопрос, явно вынесенный в `gastromania-tasks.md` (задача 6.5), не решён сейчас по прямому указанию владельца не строить checkout:** `with check (true)` на `order_items`/`orders` сам по себе не мешает клиенту с publishable-ключом вставить строку с произвольной ценой в обход сервера — RLS это не JS-код, «сервер посчитает сумму» ничего не гарантирует, пока единственный путь записи не станет security-definer RPC (или другим механизмом, закрывающим именно вставку, а не только доверяя тому, что вызовется правильный Server Action). Это нужно решить до того, как форма оформления заказа станет доступна гостям, не раньше.
- `types/database.ts` — правлен вручную (миграции ещё не применены к живой БД): `orders` под новую форму, новый блок `order_items`. Как и с `profiles.email` в Блоке 7.7 — после применения миграций стоит перегенерировать, разница должна быть нулевой.

**3. Telegram под новую схему, триггер по-прежнему не подключён**
- `supabase/functions/telegram-notify/index.ts` переписан: `formatOrder` теперь **async** и сама делает отдельный запрос к `order_items` (payload Database Webhook несёт только строку `orders`, вложенные строки другой таблицы в нём никогда не бывает) — через `createClient` из `npm:@supabase/supabase-js@2` с `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`. **Это не новый секрет, который нужно заводить руками** — Supabase сама прокидывает обе переменные в рантайм каждой Edge Function по умолчанию; `service_role` тут в *серверной* (не Next.js) среде, категориально другой контекст, чем правило 8 из `gastromania-tasks.md`.
- `formatMessage` теперь триггерит заказ не на `INSERT`, а на переход `payment_status` в `'paid'` (`UPDATE`, с проверкой `old_record.payment_status !== 'paid'`, чтобы не спамить на каждое последующее изменение `order_status`) — ровно то, что просил владелец: уведомление только после подтверждённой оплаты.
- Сообщение включает номер заказа, имя, телефон, адрес, состав (из `order_items`), сумму блюд отдельно от доставки, итог, отметку об оплате, комментарий, время.
- **Триггер на `orders` по-прежнему не создан** — по прямому указанию не подключать Блок 6 сейчас. Когда он появится (задача 6.10 в `gastromania-tasks.md`) — это будет одна новая миграция (`pg_net`-триггер на `update`, тем же паттерном, что у `reservations` в 20260822090000), саму функцию переделывать не придётся.

**4. Документация**
- `gastromania-spec.md` — SQL-блок `orders` переписан под новую схему, добавлен блок `order_items`, RLS-раздел дополнен политиками `order_items` и триггером `orders_guard_payment_status`, абзац «Оплата» в Этапе 5 обновлён (online вместо on_delivery), вопрос 2 из «Решить до старта» отмечен решённым (один сотрудник = один `admin`).
- `gastromania-tasks.md` — Блок 6 переписан заново под платёжную архитектуру (задачи 6.5–6.11: security-definer-вопрос, выбор провайдера отдельным пунктом с явной пометкой «требует подтверждения владельца», webhook, Telegram, `/admin/orders`); задача 7.1 указывает на 6.11 вместо дублирования; статусы Блоков 3 и 7.7 поправлены под `admin`/`customer`.
- Прошлые записи этого changelog (v0.1.13, v0.1.14, v0.1.16), где упоминаются `manager`/`is_staff()`, **намеренно не переписаны** — это исторические записи о том, что было сделано на тот момент, переписывать историю задним числом было бы неправильно.

**Проверено:** `npm run build`/`lint` чистые (после каждого смыслового куска — роли, затем orders-архитектура; один цикл, без ошибок ни разу). `curl` без сессии на весь `/admin/*` — прежнее поведение (307 на точный `/login?next=...`), регрессий не внесено. **Ничего из этого не применялось к реальной БД** — все шесть новых миграций (20260911210000–20260911230000) ждут ручного применения; сам checkout/оплата/`/admin/orders` не реализовывались, как и было указано.

### v0.1.16 — 2026-09-11
- Блок 7, задачи 7.4–7.7 — **`/admin/promotions`, `/admin/delivery`, дашборд `/admin`, `/admin/users`.** Закрывает весь Блок 7, кроме 7.1 (`/admin/orders`), который по-прежнему ждёт Блок 6 — заказов не существует, нечего показывать и не с чем проверить.

**7.4 `/admin/promotions`**
- `supabase/migrations/20260911180000_promotions_staff_access.sql` — та же замена `is_admin()` → `is_staff()`, что и в 7.2/7.3, плюс новый bucket `promo-images` (отдельный от `menu-images` — баннеры акций и фото блюд разного назначения, проще чистить порознь).
- `app/admin/promotions/*` — CRUD по образцу `/admin/menu`: список, `new`/`[id]/edit`, `ActiveToggle.tsx`, `DeletePromotionButton.tsx`, `ImageUpload.tsx`. **Осознанно не переиспользовал** уже рабочие `menu/ImageUpload.tsx`/`menu/StopListToggle.tsx` через параметризацию — по явному требованию владельца не трогать уже проверенный `/admin/menu` в рамках этого пакета; вместо общего компонента — два близких файла с разными bucket/лейблами. Обменял немного DRY на нулевой риск регресса в уже принятой функциональности.
- Поля: заголовок, описание, скидка % (необязательно), даты начала/окончания (необязательно, `date`-инпут → `timestamptz` полночь по серверному времени), изображение, статус публикации.

**7.5 `/admin/delivery`**
- `supabase/migrations/20260911190000_delivery_staff_access.sql` — `delivery_admin_write` на `is_staff()`. `delivery_public_read` не трогал — оно и так публичное, staff-доступа не касается.
- Новых колонок не понадобилось — все запрошенные поля уже были в `delivery_settings` с Блока 2: `is_delivery_enabled`, `min_order_amount`, `delivery_fee`, `free_delivery_from`, `kitchen_opens`/`kitchen_closes`, `zones` (jsonb). Часы кухни в шаге владельца не упоминались, но добавил их в форму — это те же две колонки той же таблицы настроек, и они были в исходном тексте задачи 7.5 в `gastromania-tasks.md`; оставить их недоступными в единственной странице настроек этой таблицы было бы странно.
- «Контактный телефон/инструкции» из пожелания владельца — **не добавлял**: колонки нет, явно помечено «если предусмотрено схемой». Не похоже на что-то, без чего доставка не работает — общие контакты ресторана уже есть в `Contact.tsx`.
- `zones` — простой список строк (район добавляется/удаляется как тег), не радиус/гео — так и было закомментировано в исходной миграции («список районов доставки»), придумывать более сложную модель не стал.
- `actions.ts` — `updateDeliverySettings` всегда делает `UPDATE ... where id = 1`, никогда `INSERT` — по конструкции невозможно завести вторую строку настроек через эту форму.

**7.6 Дашборд `/admin`**
- Переписан `app/admin/page.tsx`: вместо карточки «кто я» (которая теперь дублируется шапкой `AdminShell` с кнопкой выхода) — приветствие в одну строку + шесть плиток с реальными счётчиками (`count: 'exact', head: true` — без выборки строк) и блок быстрых переходов. Все числа — живые запросы к Supabase, не заглушки.
- «Активные акции» — не просто `is_active = true`, а с учётом окна `starts_at`/`ends_at` (та же логика, что в описании Этапа 4 `gastromania-spec.md` для публичной страницы `/promotions`, которой пока нет) — иначе плитка врала бы про акции, которые формально включены, но ещё не начались или уже кончились.
- Пункт «Пользователи» в быстрых переходах скрыт для не-admin, тем же принципом, что и в `AdminShell`.

**7.7 `/admin/users` — самая чувствительная часть пакета**
- **Реальная уязвимость, найденная и закрытая по ходу подготовки, не гипотетически.** У политики `profiles_update_own` (Блок 2) не было ограничения по колонкам — **любой авторизованный пользователь уже мог выполнить `supabase.from('profiles').update({role:'admin'}).eq('id', ownId)` собственным клиентским ключом и назначить себе роль admin**, RLS это не запрещала. Обнаружилось только сейчас, при подготовке страницы управления ролями — строить UI для смены ролей и не закрыть очевидный путь самоповышения было бы безответственно. Закрыто триггером `guard_profile_role_change` (`supabase/migrations/20260911200000_profiles_admin_management.sql`) — именно триггером, а не одной RLS `with check`, потому что нужно сравнение с OLD-строкой (`new.role <> old.role`), а `with check` видит только NEW.
- Тот же триггер не даёт понизить **последнего** администратора — ни через интерфейс, ни прямым запросом в обход UI. Проверка есть и в `actions.ts` (для понятной ошибки в интерфейсе), и в самом триггере (настоящая гарантия, а не только на уровне приложения).
- **Email без service_role.** `auth.users.email` не виден обычному клиенту ни при какой роли — единственный API-путь к нему без прямого доступа к БД это Supabase Admin API, которому нужен `service_role`. В проекте `service_role` не заведён нигде (ни `.env.local`, ни Vercel) — заводить его специально ради одного поля означало бы новый секрет того же класса, что уже один раз реально утёк (v0.1.10). Вместо этого — колонка `public.profiles.email`, которую наполняет `handle_new_user` при регистрации и держит в актуальном состоянии новый триггер `on_auth_user_email_updated` (на `update of email on auth.users`) — это внутрибазовая синхронизация в момент срабатывания триггера, не API-вызов, `service_role` тут вообще не участвует. Для пользователей, заведённых до этой миграции, — разовый SQL-бэкфилл прямо в тексте миграции (это тоже не через API — миграция выполняется с полными правами в самой базе, как и все остальные миграции проекта).
- `types/database.ts` **правлен вручную** — миграция ещё не применена к живой БД, поэтому `supabase gen types` сейчас вернул бы схему без `profiles.email` и сборка не прошла бы typecheck. Добавлено вручную под ожидаемую схему; после применения миграции стоит перегенерировать по факту, разница должна быть нулевой.
- `profiles_select_own_or_admin` (Блок 2) **не трогал** — она и так на `is_admin()`, не `is_staff()`, а именно это и нужно: manager не должен видеть список чужих профилей, как и просил владелец. Раньше вообще ни у кого, кроме владельца своей строки, не было права на `UPDATE` чужого профиля — добавлена новая политика `profiles_admin_update_any` (`is_admin()`), без неё admin не смог бы сохранить смену роли через обычный клиентский запрос.
- `AdminShell` — пункт «Пользователи» скрыт для не-admin (принимает `role` от `layout.tsx`); сама страница `/admin/users` всё равно перепроверяет роль на сервере независимо от того, показан пункт меню или нет.
- **Найдено, не чинил (вне рамок):** `profiles_update_own` по-прежнему не ограничивает `email`/`full_name`/`phone` по отдельности — пользователь может сам переписать себе отображаемый `email` в `profiles` (не настоящий auth-email, только то, что видит персонал в списке). Не эскалация прав, просто неточность отображения; в `role` эта дыра не пускает — его защищает отдельный триггер.
- Проверено: `npm run build`/`lint` чистые после каждого из 4 блоков (один type-error на `number | null` в `delivery/actions.ts` найден и исправлен по ходу). `curl` без сессии на все новые маршруты (`/admin/promotions`, `/admin/promotions/new`, `/admin/promotions/[id]/edit`, `/admin/delivery`, `/admin/users`) — точный `307` на `/login?next=...`. Playwright — `/login` без ошибок консоли на мобильной ширине. **Полный цикл на реальных данных (акции, доставка, дашборд, смена ролей) не проверялся живьём** — нет тестовой сессии в этой среде; четыре новые миграции ещё не применены к БД.

### v0.1.15 — 2026-09-11
- Блок 7, задача 7.3 — **`/admin/menu`: полный CRUD блюд, загрузка фото, крупный тумблер стоп-листа.**
- **`supabase/migrations/20260911160000_menu_admin_access.sql`** — тот же пробел, что и с `reservations` (см. v0.1.14): `menu_public_read`/`menu_admin_write` проверяли только `is_admin()`. Хуже, чем в брони: `menu_public_read` без `is_staff()` вообще не давал менеджеру увидеть неактивные (86'd) блюда — то есть найти блюдо, чтобы снять его со стоп-листа, было бы нечем. Обе политики переведены на `is_staff()`. Там же — новый bucket `menu-images` в Supabase Storage (публичный на чтение; запись/изменение/удаление — только `is_staff()`), плюс политики на `storage.objects`.
- **`next.config.ts`** — домен `rqiqqeuqjgvlvngdhlhj.supabase.co` (путь `/storage/v1/object/public/**`) добавлен в `images.remotePatterns` — без этого `next/image` отказывался бы отдавать загруженные фото блюд.
- **`app/admin/menu/ImageUpload.tsx`** — загрузка идёт прямо из браузера в Storage через уже существующий `lib/supabase/client.ts` (сессия пользователя), без прокладки через server action — файл не проходит через сервер Next.js. Правда обеспечивает не код, а RLS-политика `menu_images_staff_write`.
- **`app/admin/menu/actions.ts`** — `createMenuItem`/`updateMenuItem`/`toggleMenuItemActive`/`deleteMenuItem`, у каждого своя серверная проверка роли и валидация (цена/категория/название) — тот же принцип «не доверяем клиенту», что и в `reservation/actions.ts` и `admin/reservations/actions.ts`. `toggleMenuItemActive` — отдельный экшен от полного сохранения, специально ради задачи «снять со стоп-листа за несколько секунд».
- **`app/admin/menu/StopListToggle.tsx`** — крупный (64×36px) переключатель с текстовым лейблом и цветом (зелёный/красный), а не мелкий чекбокс — по прямому требованию спеки. Оптимистичное обновление с откатом при ошибке.
- **`app/admin/menu/MenuItemForm.tsx`**, **`DeleteMenuItemButton.tsx`**, **`app/admin/menu/page.tsx`** (список по категориям), **`app/admin/menu/new/page.tsx`**, **`app/admin/menu/[id]/edit/page.tsx`** — создание/редактирование через отдельные страницы, не модалки (модалка требовала бы своего focus-trap/`aria-modal`, как в лайтбоксе галереи, — отдельная страница проще и не хуже на мобильном). Категория — фиксированный `<select>` по четырём значениям из `gastromania-spec.md` (`signature`/`business_lunch`/`banquet`/`delivery`), не свободный текст — опечатка молча вырезала бы блюдо из публичной страницы меню (Блок 4, ещё не сделан).
- **`app/components/reservation/FieldShell.tsx`** — `icon` стал необязательным (`icon?: ReactNode`), рендерится только если передан. Для полей вроде цены или порядка сортировки нет естественной иконки — проще расширить существующий компонент, чем городить второй.
- `AdminShell.tsx` — добавлен пункт навигации «Меню».
- **Сознательно не сделано:** публичная сторона (`/menu`, Блок 4) не тронута — по-прежнему хардкод в `SignatureDishes.tsx`; теперь, когда есть `/admin/menu`, владелец может внести реальные блюда с ценами через интерфейс, и это как раз снимает блокер «нужно реальное меню с ценами» перед Блоком 4.
- Проверено: `npm run build`/`lint` чистые. `curl` без сессии на все новые маршруты (`/admin/menu`, `/admin/menu/new`, `/admin/menu/[id]/edit`) — `307` на точный `/login?next=...`. **Полный цикл (загрузка фото, сохранение, тумблер, удаление на реальных данных) не проверялся живьём** — нет тестовой сессии в этой среде; обе миграции (`20260911160000` и более ранняя `20260911140000`, если ещё не применена) нужно применить в Supabase.

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
