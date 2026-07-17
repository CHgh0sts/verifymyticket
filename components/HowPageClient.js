"use client";

import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { useLocale } from "@/components/LocaleProvider";

export default function HowPageClient() {
  const { t, dict } = useLocale();
  const steps = dict.howPage?.steps || [];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <p className="text-sm font-medium text-[var(--accent)]">{t("howPage.eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("howPage.title")}
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--text-muted)]">{t("howPage.intro")}</p>

        <ol className="mt-10 space-y-6">
          {steps.map((s) => (
            <li key={s.title} className="border-l-2 border-[var(--accent)] pl-5">
              <h2 className="text-lg font-medium">{s.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                {s.text}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/check" className="btn btn-primary">
            {t("howPage.ctaCheck")}
          </Link>
          <Link href="/faq" className="btn btn-secondary">
            {t("howPage.ctaFaq")}
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
