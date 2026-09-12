import Navigation from "./components/Navigation";
import Hero from "./components/Hero";
import Story from "./components/Story";
import Chef from "./components/Chef";
import Reservation from "./components/Reservation";
import Gallery from "./components/Gallery";
import Contact from "./components/Contact";
import CallToAction from "./components/CallToAction";
import Footer from "./components/Footer";

// SignatureDishes is deliberately not rendered — its dish content is
// invented Nordic-tasting-menu copy that doesn't match this restaurant's
// real (Turkish/Middle Eastern) kitchen. Component kept intact, not
// deleted — see gastromania-tasks.md Блок 12 for bringing it back once
// there's a real menu to put in it.

export default function Home() {
  return (
    <main>
      <Navigation />
      <Hero />
      <Story />
      <Chef />
      <Reservation />
      <Gallery />
      <Contact />
      <CallToAction />
      <Footer />
    </main>
  );
}
