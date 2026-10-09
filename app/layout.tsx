import type { Metadata } from "next";
import { Playfair_Display, Cormorant_Garamond, Inter } from "next/font/google";
import MotionProvider from "./components/MotionProvider";
import ScrollProgress from "./components/ScrollProgress";
import { CartProvider } from "@/lib/cart/CartContext";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/seo";
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

// Корневые метаданные сайта. Значения живут в lib/seo.ts. Страницы с
// собственными title/description берут pageMetadata() оттуда же, а не
// наследуют отсюда openGraph целиком (Next не сливает его по полям).
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  // Для не перечисленных явно страниц (кабинет, формы входа) канонический
  // адрес не задаём: общий canonical "/" на всех страницах был бы ошибкой.
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    type: "website",
    locale: "ru_RU",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
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
        <MotionProvider>
          <ScrollProgress />
          <CartProvider>{children}</CartProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
