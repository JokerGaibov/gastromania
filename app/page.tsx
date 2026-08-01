import Navigation from "./components/Navigation";
import Hero from "./components/Hero";
import Story from "./components/Story";
import Chef from "./components/Chef";
import SignatureDishes from "./components/SignatureDishes";
import Reservation from "./components/Reservation";
import Gallery from "./components/Gallery";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <main>
      <Navigation />
      <Hero />
      <Story />
      <Chef />
      <SignatureDishes />
      <Reservation />
      <Gallery />
      <Contact />
      <Footer />
    </main>
  );
}
