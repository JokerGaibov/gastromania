"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { smoothScrollTo } from "@/lib/motion";
import MagneticButton from "./MagneticButton";
import LogoutButton from "../admin/LogoutButton";

// Единая шапка для всех публичных страниц (/, /promotions, /delivery,
// /checkout, /login, /register, /forgot-password, /reset-password,
// /account/orders, /privacy). Раньше у каждой внутренней страницы был свой
// дублированный мини-хедер с единственной ссылкой «На главную» — из него
// нельзя было попасть ни в меню, ни в акции, ни в кабинет.
//
// Два варианта отображения:
//  - "overlay" — только главная: фиксированная прозрачная шапка поверх
//    hero, темнеет при скролле, подсвечивает активную секцию, якоря
//    скроллят по текущей странице;
//  - "solid" — все остальные страницы: обычная светлая шапка в потоке
//    документа, якоря ведут на главную (/#story).
//
// Состояние сессии приходит пропсами с сервера (getPublicNavState) — не
// определяется здесь эффектом, иначе возвращается flicker «Войти →
// Аккаунт».
type Variant = "overlay" | "solid";

const SECTION_ANCHORS = ["#story", "#reservation"];

function navLinksFor(variant: Variant) {
  const homeAnchor = (hash: string) => (variant === "overlay" ? hash : `/${hash}`);
  return [
    { label: "Главная", href: variant === "overlay" ? "/" : "/" },
    { label: "О ресторане", href: homeAnchor("#story") },
    { label: "Акции", href: "/promotions" },
    { label: "Доставка", href: "/delivery" },
  ];
}

export default function PublicHeader({
  variant = "solid",
  accountHref = "/login",
  accountLabel = "Войти",
  isLoggedIn = false,
}: {
  variant?: Variant;
  accountHref?: string;
  accountLabel?: string;
  isLoggedIn?: boolean;
}) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeHref, setActiveHref] = useState<string>("");

  const isOverlay = variant === "overlay";
  const navLinks = navLinksFor(variant);
  const reservationHref = isOverlay ? "#reservation" : "/#reservation";

  useEffect(() => {
    if (!isOverlay) return;
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isOverlay]);

  useEffect(() => {
    if (!isOverlay) return;
    // Только "#..." — document.querySelector() бросает исключение на
    // строке вроде "/delivery", поэтому реальные маршруты отфильтрованы.
    const sections = SECTION_ANCHORS.map((hash) => document.querySelector<HTMLElement>(hash)).filter(
      (el): el is HTMLElement => !!el
    );
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const top = visible.reduce((a, b) => (a.intersectionRatio > b.intersectionRatio ? a : b));
        setActiveHref(`#${top.target.id}`);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [isOverlay]);

  const handleLinkClick = (href: string) => {
    setMenuOpen(false);
    if (isOverlay && href === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (href.startsWith("#")) {
      smoothScrollTo(href);
    } else {
      router.push(href);
    }
  };

  // Цвета под фон: тёмная шапка поверх hero vs светлая на внутренних.
  const logoClass = isOverlay ? "text-[#F5F0E8]" : "text-[#0A0A0A]";
  const linkClass = isOverlay
    ? "text-[#F5F0E8]/70 hover:text-[#F5F0E8]"
    : "text-[#0A0A0A]/55 hover:text-[#0A0A0A]";
  const accountClass = isOverlay
    ? "text-[#F5F0E8]/60 hover:text-[#F5F0E8]"
    : "text-[#0A0A0A]/55 hover:text-[#0A0A0A]";
  const logoutClass = `label-refined transition-colors duration-300 disabled:opacity-50 ${accountClass}`;
  const dividerClass = isOverlay ? "bg-[rgba(245,240,232,0.2)]" : "bg-[#0A0A0A]/12";
  const burgerClass = isOverlay ? "bg-[#F5F0E8]" : "bg-[#0A0A0A]";

  const headerClass = isOverlay
    ? `fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
        scrolled
          ? "bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[rgba(245,240,232,0.08)]"
          : "bg-transparent"
      }`
    : "relative z-30 border-b border-[#0A0A0A]/8 bg-[#F5F0E8]";

  const header = (
    <div className="max-w-screen-xl mx-auto px-8 lg:px-16 h-20 flex items-center justify-between">
      {/* Логотип */}
      <button
        type="button"
        onClick={() => handleLinkClick("/")}
        className="flex flex-col items-start leading-none text-left"
      >
        <span
          style={{ fontFamily: "var(--font-playfair)", fontWeight: 400, letterSpacing: "0.25em", fontSize: "0.875rem" }}
          className={`${logoClass} tracking-widest uppercase`}
        >
          Gastromania
        </span>
        <span
          style={{ fontFamily: "var(--font-inter)", fontWeight: 300, letterSpacing: "0.3em", fontSize: "0.5rem" }}
          className="text-[#8C7355] uppercase mt-0.5"
        >
          Москва · м. Дубровка
        </span>
      </button>

      {/* Десктопная навигация */}
      <nav className="hidden lg:flex items-center gap-8">
        {navLinks.map((link) => (
          <button
            key={link.href}
            onClick={() => handleLinkClick(link.href)}
            className={`nav-link label-refined transition-colors duration-300 ${
              isOverlay && activeHref === link.href ? "text-[#8C7355] nav-link-active" : linkClass
            }`}
          >
            {link.label}
          </button>
        ))}
      </nav>

      {/* Брони + аккаунт */}
      <div className="hidden lg:flex items-center gap-6">
        <div className={`w-px h-5 ${dividerClass}`} />
        <MagneticButton>
          <button
            onClick={() => handleLinkClick(reservationHref)}
            className="label-refined text-[#8C7355] hover:text-[#0A0A0A] transition-colors duration-300"
          >
            Брони
          </button>
        </MagneticButton>
        <button
          onClick={() => router.push(accountHref)}
          className={`label-refined transition-colors duration-300 ${accountClass}`}
        >
          {accountLabel}
        </button>
        {isLoggedIn && <LogoutButton className={logoutClass} />}
      </div>

      {/* Мобильная кнопка меню */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="lg:hidden flex flex-col gap-1.5 p-2"
        aria-label="Открыть меню"
      >
        <motion.span
          animate={{ rotate: menuOpen ? 45 : 0, y: menuOpen ? 8 : 0 }}
          className={`block w-6 h-px origin-center ${burgerClass}`}
          transition={{ duration: 0.3 }}
        />
        <motion.span
          animate={{ opacity: menuOpen ? 0 : 1, scaleX: menuOpen ? 0 : 1 }}
          className={`block w-4 h-px ${burgerClass}`}
          transition={{ duration: 0.3 }}
        />
        <motion.span
          animate={{ rotate: menuOpen ? -45 : 0, y: menuOpen ? -8 : 0 }}
          className={`block w-6 h-px origin-center ${burgerClass}`}
          transition={{ duration: 0.3 }}
        />
      </button>
    </div>
  );

  return (
    <>
      {isOverlay ? (
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={headerClass}
        >
          {header}
        </motion.header>
      ) : (
        <header className={headerClass}>{header}</header>
      )}

      {/* Мобильное меню — одинаковое для обоих вариантов */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed inset-0 z-40 bg-[#0A0A0A] flex flex-col items-center justify-center"
          >
            <nav className="flex flex-col items-center gap-7">
              {navLinks.map((link, i) => (
                <motion.button
                  key={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.07, duration: 0.4 }}
                  onClick={() => handleLinkClick(link.href)}
                  className="heading-editorial text-4xl text-[#F5F0E8] hover:text-[#8C7355] transition-colors"
                >
                  {link.label}
                </motion.button>
              ))}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                onClick={() => handleLinkClick(reservationHref)}
                className="mt-4 label-refined text-[#8C7355] border border-[#8C7355]/40 px-8 py-3 hover:border-[#8C7355] transition-colors"
              >
                Брони
              </motion.button>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                onClick={() => {
                  setMenuOpen(false);
                  router.push(accountHref);
                }}
                className="label-refined text-[#F5F0E8]/50 hover:text-[#F5F0E8] transition-colors"
              >
                {accountLabel}
              </motion.button>
              {isLoggedIn && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.65, duration: 0.4 }}
                  onClick={() => setMenuOpen(false)}
                >
                  <LogoutButton className="label-refined text-[#F5F0E8]/50 hover:text-[#F5F0E8] transition-colors" />
                </motion.div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
