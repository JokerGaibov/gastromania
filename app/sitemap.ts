import type { MetadataRoute } from "next";
import { INDEXABLE_PATHS, SITE_ORIGIN } from "@/lib/seo";

// Только публичные страницы, которые должны индексироваться. Не включены:
// /admin, /account, /checkout, /login, /register, /forgot-password,
// /reset-password, /auth/*. lastModified намеренно не указан: реальной даты
// изменения контента у нас нет, а подставлять дату сборки значило бы
// говорить поисковику неправду (кроме /privacy, у неё дата в самом тексте).
const PRIVACY_UPDATED = new Date("2026-08-22");

export default function sitemap(): MetadataRoute.Sitemap {
  return INDEXABLE_PATHS.map((path) => ({
    url: path === "/" ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${path}`,
    ...(path === "/privacy" ? { lastModified: PRIVACY_UPDATED } : {}),
  }));
}
