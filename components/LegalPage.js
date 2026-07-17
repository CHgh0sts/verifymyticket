"use client";

import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { LEGAL } from "@/lib/legal";
import { useLocale } from "@/components/LocaleProvider";

export function LegalPage({ title, children }) {
  const { t } = useLocale();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-sm text-[var(--text-muted)]">
          <Link href="/" className="hover:text-[var(--accent)]">
            {t("common.home")}
          </Link>
          {" / "}
          <span>{title}</span>
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          {t("legal.lastUpdate")} {LEGAL.lastUpdate}
        </p>
        {LEGAL.incomplete && (
          <div
            className="mt-4 rounded-lg border border-[var(--warning)]/40 bg-[var(--warning-soft)] px-4 py-3 text-sm text-[var(--warning)]"
            role="status"
          >
            {t("legal.incomplete")}
          </div>
        )}
        <p className="mt-3 text-xs text-[var(--text-muted)]">{t("legal.langNote")}</p>
        <article className="legal-prose mt-10 space-y-8 text-[var(--text)]">
          {children}
        </article>
        <nav className="mt-14 flex flex-wrap gap-x-4 gap-y-2 border-t border-[var(--border)] pt-6 text-sm text-[var(--text-muted)]">
          <Link href="/mentions-legales" className="hover:text-[var(--accent)]">
            {t("footer.mentions")}
          </Link>
          <Link href="/cgu" className="hover:text-[var(--accent)]">
            {t("footer.terms")}
          </Link>
          <Link href="/confidentialite" className="hover:text-[var(--accent)]">
            {t("footer.privacy")}
          </Link>
          <Link href="/cookies" className="hover:text-[var(--accent)]">
            {t("footer.cookies")}
          </Link>
        </nav>
      </main>
      <SiteFooter />
    </div>
  );
}

export function LegalSection({ title, children }) {
  return (
    <section>
      <h2 className="text-xl font-semibold tracking-tight text-[var(--text)]">{title}</h2>
      <div className="mt-3 space-y-3 text-[0.95rem] leading-relaxed text-[var(--text-muted)]">
        {children}
      </div>
    </section>
  );
}
