import PublicHeader from "./components/PublicHeader";
import Hero from "./components/Hero";
import Story from "./components/Story";
import Chef from "./components/Chef";
import Reservation from "./components/Reservation";
import Gallery from "./components/Gallery";
import Contact from "./components/Contact";
import CallToAction from "./components/CallToAction";
import Footer from "./components/Footer";
import MobileContactCTA from "./components/MobileContactCTA";
import RestaurantJsonLd from "./components/RestaurantJsonLd";
import { getPublicNavState } from "@/lib/auth/publicNav";
import { SITE_DESCRIPTION, SITE_TITLE, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: SITE_TITLE, description: SITE_DESCRIPTION, path: "/" });

// SignatureDishes is deliberately not rendered — its dish content is
// invented Nordic-tasting-menu copy that doesn't match this restaurant's
// real (Turkish/Middle Eastern) kitchen. Component kept intact, not
// deleted — see gastromania-tasks.md Блок 12 for bringing it back once
// there's a real menu to put in it.

export default async function Home() {
  // Сессия и роль определяются здесь, на сервере, а не эффектом в шапке —
  // иначе возвращается flicker «Войти → Аккаунт» (main.md v0.1.30).
  const nav = await getPublicNavState();

  return (
    <main>
      <RestaurantJsonLd />
      <PublicHeader variant="overlay" {...nav} />
      <Hero />
      <Story />
      <Chef />
      <Reservation />
      <Gallery />
      <Contact />
      <CallToAction />
      <Footer />
      <MobileContactCTA />
    </main>
  );
}
