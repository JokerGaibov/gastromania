import type { Metadata } from "next";
import { Playfair_Display, Cormorant_Garamond, Inter } from "next/font/google";
import MotionProvider from "./components/MotionProvider";
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

export const metadata: Metadata = {
  title: "Gastromania — Высокая кухня",
  description:
    "Камерный гастрономический опыт, где кулинарное искусство встречается с сезонной чистотой вкуса. Gastromania — три звезды Мишлен, одно видение.",
  openGraph: {
    title: "Gastromania — Высокая кухня",
    description:
      "Камерный гастрономический опыт, где кулинарное искусство встречается с сезонной чистотой вкуса.",
    type: "website",
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
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
