"use client";

import LandingBackground from "@/components/LandingBackground";
import Ticket3D from "@/components/Ticket3D";
import ScrollReveal from "@/components/ScrollReveal";
import LandingScrollMotion from "@/components/LandingScrollMotion";
import HeroCtas from "@/components/HeroCtas";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { useLocale } from "@/components/LocaleProvider";

export default function LandingPageClient() {
  const { t } = useLocale();

  const howSteps = [
    { step: "01", title: t("howSection.s1Title"), text: t("howSection.s1Text") },
    { step: "02", title: t("howSection.s2Title"), text: t("howSection.s2Text") },
    { step: "03", title: t("howSection.s3Title"), text: t("howSection.s3Text") },
  ];

  const cases = [
    { title: t("useCases.c1Title"), text: t("useCases.c1Text") },
    { title: t("useCases.c2Title"), text: t("useCases.c2Text") },
    { title: t("useCases.c3Title"), text: t("useCases.c3Text") },
  ];

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
                  {t("hero.eyebrow")}
                </p>
              </ScrollReveal>
              <ScrollReveal delay={80}>
                <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl sm:leading-[1.05] lg:text-6xl">
                  Verify<span className="text-[var(--accent)]">My</span>Ticket
                </h1>
              </ScrollReveal>
              <ScrollReveal delay={160}>
                <p className="mt-5 max-w-lg text-lg text-[var(--text-muted)]">
                  {t("hero.subtitle")}
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
                  {t("howSection.eyebrow")}
                </p>
                <h2 className="mt-2 max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">
                  {t("howSection.title")}
                </h2>
              </ScrollReveal>

              <div className="mt-10 grid gap-5 sm:grid-cols-3 sm:gap-6">
                {howSteps.map((item, i) => (
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

          <section className="border-t border-[var(--border)]/60 pb-24 pt-20 sm:pb-32 sm:pt-24">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <ScrollReveal>
                <p className="text-sm font-medium tracking-wide text-[var(--accent)]">
                  {t("useCases.eyebrow")}
                </p>
                <h2 className="mt-2 max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">
                  {t("useCases.title")}
                </h2>
                <p className="mt-3 max-w-2xl text-[var(--text-muted)]">
                  {t("useCases.text")}
                </p>
              </ScrollReveal>
              <div className="mt-10 grid gap-6 sm:grid-cols-3">
                {cases.map((item, i) => (
                  <ScrollReveal key={item.title} delay={i * 80} variant="up">
                    <article className="h-full border-l-2 border-[var(--accent)] pl-4">
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                        {item.text}
                      </p>
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
