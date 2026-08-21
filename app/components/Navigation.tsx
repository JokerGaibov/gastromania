"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { smoothScrollTo } from "@/lib/motion";
import MagneticButton from "./MagneticButton";

const navLinks = [
  { label: "История", href: "#story" },
  { label: "Шеф", href: "#chef" },
  { label: "Меню", href: "#dishes" },
  { label: "Галерея", href: "#gallery" },
  { label: "Контакты", href: "#contact" },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeHref, setActiveHref] = useState<string>("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = navLinks
      .map((link) => document.querySelector<HTMLElement>(link.href))
      .filter((el): el is HTMLElement => !!el);
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
  }, []);

  const handleLinkClick = (href: string) => {
    setMenuOpen(false);
    smoothScrollTo(href);
  };

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
          scrolled
            ? "bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[rgba(245,240,232,0.08)]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-screen-xl mx-auto px-8 lg:px-16 h-20 flex items-center justify-between">
          {/* Logo */}
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="flex flex-col items-center leading-none"
          >
            <span
              style={{ fontFamily: "var(--font-playfair)", fontWeight: 400, letterSpacing: "0.25em", fontSize: "0.875rem" }}
              className="text-[#F5F0E8] tracking-widest uppercase"
            >
              Gastromania
            </span>
            <span
              style={{ fontFamily: "var(--font-inter)", fontWeight: 300, letterSpacing: "0.3em", fontSize: "0.5rem" }}
              className="text-[#8C7355] uppercase mt-0.5"
            >
              С 2018 года
            </span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-10">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleLinkClick(link.href)}
                className={`nav-link label-refined transition-colors duration-300 ${
                  activeHref === link.href ? "text-[#8C7355] nav-link-active" : "text-[#F5F0E8]/70 hover:text-[#F5F0E8]"
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Reserve CTA */}
          <div className="hidden lg:flex items-center gap-8">
            <div className="w-px h-5 bg-[rgba(245,240,232,0.2)]" />
            <MagneticButton>
              <button
                onClick={() => handleLinkClick("#reservation")}
                className="label-refined text-[#8C7355] hover:text-[#F5F0E8] transition-colors duration-300"
              >
                Забронировать столик
              </button>
            </MagneticButton>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden flex flex-col gap-1.5 p-2"
            aria-label="Toggle menu"
          >
            <motion.span
              animate={{ rotate: menuOpen ? 45 : 0, y: menuOpen ? 8 : 0 }}
              className="block w-6 h-px bg-[#F5F0E8] origin-center"
              transition={{ duration: 0.3 }}
            />
            <motion.span
              animate={{ opacity: menuOpen ? 0 : 1, scaleX: menuOpen ? 0 : 1 }}
              className="block w-4 h-px bg-[#F5F0E8]"
              transition={{ duration: 0.3 }}
            />
            <motion.span
              animate={{ rotate: menuOpen ? -45 : 0, y: menuOpen ? -8 : 0 }}
              className="block w-6 h-px bg-[#F5F0E8] origin-center"
              transition={{ duration: 0.3 }}
            />
          </button>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed inset-0 z-40 bg-[#0A0A0A] flex flex-col items-center justify-center"
          >
            <nav className="flex flex-col items-center gap-8">
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
                onClick={() => handleLinkClick("#reservation")}
                className="mt-4 label-refined text-[#8C7355] border border-[#8C7355]/40 px-8 py-3 hover:border-[#8C7355] transition-colors"
              >
                Забронировать столик
              </motion.button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
