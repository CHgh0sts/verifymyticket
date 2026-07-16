import Link from "next/link";
import SiteHeaderClient from "@/components/SiteHeaderClient";
import { LEGAL } from "@/lib/legal";

export function SiteHeader({ showAuth = true }) {
  return <SiteHeaderClient showAuth={showAuth} />;
}

export function SiteFooter() {
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
              Vérifiez qu&apos;un billet n&apos;a pas déjà circulé lors d&apos;une revente.
              Simple, rapide, sans stocker votre QR code en clair.
            </p>
            <Link
              href="/check"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)] transition hover:opacity-80"
            >
              Vérifier un billet
              <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:col-span-1 lg:col-span-7 lg:grid-cols-3">
            <div>
              <p className="site-footer__heading">Produit</p>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <Link href="/check" className="site-footer__link">
                    Vérifier
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="site-footer__link">
                    Créer un compte
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="site-footer__link">
                    Connexion
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="site-footer__link">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="site-footer__heading">Légal</p>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <Link href="/mentions-legales" className="site-footer__link">
                    Mentions légales
                  </Link>
                </li>
                <li>
                  <Link href="/cgu" className="site-footer__link">
                    CGU
                  </Link>
                </li>
                <li>
                  <Link href="/confidentialite" className="site-footer__link">
                    Confidentialité
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="site-footer__link">
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <p className="site-footer__heading">Contact</p>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <a href={`mailto:${LEGAL.contact.email}`} className="site-footer__link break-all">
                    {LEGAL.contact.email}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${LEGAL.dpo.email}`} className="site-footer__link break-all">
                    Demandes RGPD
                  </a>
                </li>
              </ul>
              <p className="mt-5 text-xs leading-relaxed text-[var(--text-muted)]">
                Ce service ne remplace pas une vérification officielle auprès d&apos;un
                organisateur ou d&apos;une billetterie.
              </p>
            </div>
          </div>
        </div>

        <div className="site-footer__bottom">
          <p className="text-xs text-[var(--text-muted)]">
            © {year} {LEGAL.siteName}. Tous droits réservés.
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Fait pour acheter plus sereinement.
          </p>
        </div>
      </div>
    </footer>
  );
}
