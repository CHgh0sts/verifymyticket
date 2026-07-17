"use client";

import Link from "next/link";
import { LEGAL } from "@/lib/legal";
import { useLocale } from "@/components/LocaleProvider";

export default function SiteFooterClient() {
  const { t } = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer mt-auto">
      <div className="site-footer__glow" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <Link href="/" className="inline-block text-xl font-semibold tracking-tight">
              Verify<span className="text-[var(--accent)]">My</span>Ticket
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--text-muted)]">
              {t("footer.tagline")}
            </p>
            <Link
              href="/check"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)] transition hover:opacity-80"
            >
              {t("nav.checkTicket")}
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:col-span-1 lg:col-span-7 lg:grid-cols-3">
            <div>
              <p className="site-footer__heading">{t("footer.product")}</p>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <Link href="/check" className="site-footer__link">
                    {t("footer.check")}
                  </Link>
                </li>
                <li>
                  <Link href="/comment-ca-marche" className="site-footer__link">
                    {t("footer.how")}
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="site-footer__link">
                    {t("nav.faq")}
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="site-footer__link">
                    {t("footer.createAccount")}
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="site-footer__link">
                    {t("footer.login")}
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="site-footer__link">
                    {t("footer.dashboard")}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="site-footer__heading">{t("footer.legal")}</p>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <Link href="/mentions-legales" className="site-footer__link">
                    {t("footer.mentions")}
                  </Link>
                </li>
                <li>
                  <Link href="/cgu" className="site-footer__link">
                    {t("footer.terms")}
                  </Link>
                </li>
                <li>
                  <Link href="/confidentialite" className="site-footer__link">
                    {t("footer.privacy")}
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="site-footer__link">
                    {t("footer.cookies")}
                  </Link>
                </li>
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <p className="site-footer__heading">{t("footer.contact")}</p>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <a
                    href={`mailto:${LEGAL.contact.email}`}
                    className="site-footer__link break-all"
                  >
                    {LEGAL.contact.email}
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${LEGAL.dpo.email}`}
                    className="site-footer__link break-all"
                  >
                    {t("footer.rgpd")}
                  </a>
                </li>
              </ul>
              <p className="mt-5 text-xs leading-relaxed text-[var(--text-muted)]">
                {t("footer.disclaimer")}
              </p>
            </div>
          </div>
        </div>

        <div className="site-footer__bottom">
          <p className="text-xs text-[var(--text-muted)]">
            © {year} {LEGAL.siteName}. {t("footer.rights")}
          </p>
          <p className="text-xs text-[var(--text-muted)]">{t("footer.madeFor")}</p>
        </div>
      </div>
    </footer>
  );
}
