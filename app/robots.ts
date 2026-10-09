import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/seo";

// Закрываем от обхода то, что не должно попадать в поиск вообще: админка,
// личный кабинет, оформление заказа и служебные auth-маршруты (обмен токена
// из письма). Страницы /login, /register, /forgot-password и /reset-password
// НЕ закрыты здесь намеренно: у них стоит meta noindex, а робот, которому
// запретили обход, этот noindex не увидит и может оставить URL в выдаче.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/account", "/checkout", "/auth/"],
    },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  };
}
