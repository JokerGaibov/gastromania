import type { Metadata } from "next";
import { Playfair_Display, Cormorant_Garamond, Inter } from "next/font/google";
import MotionProvider from "./components/MotionProvider";
import ScrollProgress from "./components/ScrollProgress";
import { CartProvider } from "@/lib/cart/CartContext";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

// Real facts only — no invented rating, awards, or reviews (see
// gastromania-tasks.md "Найдено по ходу" for what's still pending from
// the client: email, real photos).
const SITE_NAME = "Gastromania";
const SITE_DESCRIPTION =
  "Ресторан Gastromania в Москве, у метро Дубровка — ТЦ «Мозаика», ул. 7-я Кожуховская, 9. Работаем круглосуточно. Международная команда кухни, бронирование столика и доставка.";

export const metadata: Metadata = {
  title: `${SITE_NAME} — ресторан в Москве у метро Дубровка`,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: `${SITE_NAME} — ресторан в Москве у метро Дубровка`,
    description: SITE_DESCRIPTION,
    type: "website",
    locale: "ru_RU",
    siteName: SITE_NAME,
  },
};

// Basic local-restaurant structured data — name and location only. No
// aggregateRating/review: nothing here is fabricated, and there's no real
// rating data to report yet.
const restaurantJsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: SITE_NAME,
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${playfair.variable} ${cormorant.variable} ${inter.variable} h-full`}
    >
      <body className="min-h-full antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd) }}
        />
        <MotionProvider>
          <ScrollProgress />
          <CartProvider>{children}</CartProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
