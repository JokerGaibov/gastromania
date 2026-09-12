"use client";

import { motion } from "framer-motion";

// Small persistent call button, mobile only — the fastest path to actually
// reaching the restaurant on a phone. Fixed position, so it doesn't affect
// any section's layout/height.
export default function MobileContactCTA() {
  return (
    <motion.a
      href="tel:+79955552227"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 1.2 }}
      className="lg:hidden fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-[#8C7355] text-[#0A0A0A] shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
      aria-label="Позвонить в Gastromania"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.36 11.36 0 003.56.57 1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.49a1 1 0 011 1 11.36 11.36 0 00.57 3.56 1 1 0 01-.25 1.02l-2.2 2.21z"
          fill="currentColor"
        />
      </svg>
    </motion.a>
  );
}
