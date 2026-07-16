import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import LandingBackground from "@/components/LandingBackground";
import Ticket3D from "@/components/Ticket3D";
import ScrollReveal from "@/components/ScrollReveal";
import LandingScrollMotion from "@/components/LandingScrollMotion";
import HeroCtas from "@/components/HeroCtas";

export default function HomePage() {
  return (
    <div className="landing-page relative flex min-h-screen flex-col overflow-x-hidden">
      <LandingScrollMotion />
      <LandingBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex flex-1 flex-col">
          <section className="relative mx-auto grid min-h-[calc(100vh-3.5rem)] w-full max-w-6xl items-center gap-10 px-4 pb-24 pt-16 sm:px-6 sm:pb-32 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
            <div className="landing-hero-copy">
              <ScrollReveal>
                <p className="text-sm font-medium tracking-wide text-[var(--accent)]">
                  Anti-revente frauduleuse
                </p>
              </ScrollReveal>
              <ScrollReveal delay={80}>
                <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl sm:leading-[1.05] lg:text-6xl">
                  Verify<span className="text-[var(--accent)]">My</span>Ticket
                </h1>
              </ScrollReveal>
              <ScrollReveal delay={160}>
                <p className="mt-5 max-w-lg text-lg text-[var(--text-muted)]">
                  Détectez si le même billet circule déjà après une revente. Enregistrez
                  votre QR code — jamais stocké en clair — et soyez alerté en cas de doublon.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={240}>
                <HeroCtas />
              </ScrollReveal>
            </div>

            <ScrollReveal
              variant="right"
              delay={120}
              className="hidden justify-center lg:flex lg:justify-end"
            >
              <div className="landing-ticket-parallax">
                <Ticket3D />
              </div>
            </ScrollReveal>
          </section>

          <section className="mt-8 border-t border-[var(--border)]/60 pb-28 pt-20 sm:mt-16 sm:pb-36 sm:pt-28">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <ScrollReveal>
                <p className="text-sm font-medium tracking-wide text-[var(--accent)]">
                  Comment ça marche
                </p>
                <h2 className="mt-2 max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">
                  Trois gestes simples pour acheter plus sereinement
                </h2>
              </ScrollReveal>

              <div className="mt-10 grid gap-5 sm:grid-cols-3 sm:gap-6">
                {[
                  {
                    step: "01",
                    title: "Choisissez l'événement",
                    text: "Indiquez le concert, la date et le lieu. On compare uniquement les billets de cette date précise.",
                  },
                  {
                    step: "02",
                    title: "Scannez ou collez le code",
                    text: "QR code, code-barres, ou seulement les 4 derniers caractères si le vendeur ne veut pas tout montrer.",
                  },
                  {
                    step: "03",
                    title: "Voyez s'il circule déjà",
                    text: "Si le même billet a déjà été signalé, vous êtes alerté. Sinon, vous avancez plus tranquillement.",
                  },
                ].map((item, i) => (
                  <ScrollReveal key={item.step} delay={i * 100} variant="up">
                    <article className="feature-card h-full">
                      <span className="feature-card__step" aria-hidden="true">
                        {item.step}
                      </span>
                      <h3 className="feature-card__title">{item.title}</h3>
                      <p className="feature-card__text">{item.text}</p>
                    </article>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
