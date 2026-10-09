import type { Metadata } from "next";

// Единственное место, где записан production-домен и общие SEO-значения.
// Всё остальное (metadataBase, canonical, sitemap, robots, JSON-LD) берёт
// их отсюда — чтобы смена домена была правкой одной строки.
export const SITE_URL = "https://гастромания.москва";
// Тот же адрес в punycode (https://xn--80aahwshepik3m.xn--80adxhks). Next.js
// сам приводит metadataBase к такому виду в canonical и og:url; в robots.txt,
// sitemap.xml и JSON-LD используем его же, чтобы везде был один и тот же
// ASCII-адрес, а не смесь кириллического и punycode-варианта.
export const SITE_ORIGIN = new URL(SITE_URL).origin;
export const SITE_NAME = "Gastromania";

// Реальные факты только — без выдуманных рейтингов, наград и отзывов.
export const SITE_TITLE = `${SITE_NAME} — ресторан в Москве у метро Дубровка`;
export const SITE_DESCRIPTION =
  "Ресторан Gastromania у метро Дубровка (ТЦ «Мозаика», ул. 7-я Кожуховская, 9). Работаем круглосуточно. Бронирование столика и доставка.";

// Страницы, которые должны индексироваться. Используется и в sitemap.ts, и
// в pageMetadata() — публичный путь объявляется в одном месте.
export const INDEXABLE_PATHS = ["/", "/delivery", "/promotions", "/privacy"] as const;

// Страница, которой не место в поиске (вход, регистрация, кабинет,
// оформление заказа, админка). noindex + follow=false: ссылки с них
// передавать нечего.
export const NO_INDEX: Metadata["robots"] = { index: false, follow: false };

// Метаданные публичной страницы. Next.js не сливает вложенный openGraph
// с корневым на уровне полей (страница с собственным openGraph полностью
// заменяет корневой), поэтому url/siteName/locale повторяются здесь явно.
// Картинки указаны явно: у страницы с собственным openGraph файловые
// opengraph-image.png / twitter-image.png из app/ НЕ подмешиваются (проверено
// на собранном HTML), и без этого превью при шеринге вышло бы без картинки.
const OG_IMAGE = {
  url: "/opengraph-image.png",
  width: 1200,
  height: 630,
  alt: SITE_TITLE,
};
export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: "ru_RU",
      type: "website",
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: "/twitter-image.png", width: 1200, height: 630, alt: SITE_TITLE }],
    },
  };
}
