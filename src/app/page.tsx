import { ContactClock } from "@/components/contact-clock";
import { HomeHero } from "@/components/home-hero";
import { Marquee } from "@/components/marquee";

export default function Home() {
  return (
    <main className="home" id="main-content" tabIndex={-1}>
      <div className="home__stage">
        <HomeHero />
      </div>
      <footer className="home__foot">
        <ContactClock />
      </footer>
      <Marquee />
    </main>
  );
}
