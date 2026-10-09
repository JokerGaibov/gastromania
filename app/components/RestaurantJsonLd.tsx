import { SITE_NAME, SITE_ORIGIN } from "@/lib/seo";

// Structured data Restaurant для главной. Только факты, которые уже есть в
// проекте: название, адрес, телефон, круглосуточный режим работы (подтверждено
// владельцем, 2026-09-12). Намеренно НЕ указаны: рейтинг и отзывы
// (aggregateRating/review), кухня, ценовой диапазон, email, соцсети (sameAs),
// координаты (geo), индекс — реальных данных для них нет. Добавить, когда
// владелец их предоставит.
const restaurantJsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "@id": `${SITE_ORIGIN}/#restaurant`,
  name: SITE_NAME,
  url: `${SITE_ORIGIN}/`,
  image: `${SITE_ORIGIN}/opengraph-image.png`,
  telephone: "+79955552227",
  address: {
    "@type": "PostalAddress",
    streetAddress: "ул. 7-я Кожуховская, 9, ТЦ «Мозаика»",
    addressLocality: "Москва",
    addressCountry: "RU",
  },
  areaServed: "Москва",
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "00:00",
    closes: "23:59",
  },
};

export default function RestaurantJsonLd() {
  return (
    <script
      type="application/ld+json"
      // "<" экранируется: защита от закрытия тега </script> внутри значения.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd).replace(/</g, "\\u003c") }}
    />
  );
}
