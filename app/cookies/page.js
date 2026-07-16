import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata = {
  title: `Politique de cookies — ${LEGAL.siteName}`,
  description: `Informations sur les cookies et traceurs utilisés par ${LEGAL.siteName}.`,
};

export default function CookiesPage() {
  return (
    <LegalPage title="Politique de cookies">
      <LegalSection title="1. Qu'est-ce qu'un cookie ?">
        <p>
          Un cookie est un petit fichier déposé sur votre terminal lors de la visite
          d&apos;un site. Des technologies similaires (stockage local, pixels, scripts)
          peuvent aussi être utilisées. En France, le dépôt de cookies non essentiels
          nécessite en principe votre consentement (directives ePrivacy / recommandations
          CNIL).
        </p>
      </LegalSection>

      <LegalSection title={`2. Cookies et traceurs utilisés par ${LEGAL.siteName}`}>
        <p className="font-medium text-[var(--text)]">Strictement nécessaires (exemptés de consentement)</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-[var(--text)]">Cookie de session</strong> (
            <code>vmt_session</code>) : authentification HttpOnly, indispensable pour
            rester connecté et accéder au tableau de bord. Durée : environ 7 jours.
          </li>
          <li>
            <strong className="text-[var(--text)]">Préférence cookies</strong> (
            <code>vmt_cookie_consent</code>) : mémorise votre choix sur le bandeau
            cookies (stockage local / cookie technique).
          </li>
        </ul>

        <p className="mt-4 font-medium text-[var(--text)]">Sécurité / anti-abus</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-[var(--text)]">Cloudflare Turnstile</strong> (si
            configuré) : protection CAPTCHA sur la vérification publique. Peut déposer
            des cookies / lire des données techniques selon la configuration Cloudflare.
            Consultez la politique de Cloudflare.
          </li>
        </ul>

        <p className="mt-4 font-medium text-[var(--text)]">Non utilisés actuellement</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Cookies publicitaires</li>
          <li>Cookies de réseaux sociaux intégrés</li>
          <li>Outils d&apos;analytics non essentiels (sauf ajout ultérieur avec consentement)</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Gestion de votre choix">
        <p>
          Lors de votre première visite, un bandeau vous informe des cookies. Vous
          pouvez accepter les cookies non essentiels ou les refuser. Les cookies
          strictement nécessaires restent actifs pour le fonctionnement du site.
        </p>
        <p>
          Vous pouvez aussi configurer votre navigateur pour bloquer ou supprimer les
          cookies. Le blocage des cookies nécessaires peut empêcher la connexion.
        </p>
      </LegalSection>

      <LegalSection title="4. Plus d'informations">
        <p>
          Données personnelles : voir la{" "}
          <Link href="/confidentialite" className="text-[var(--accent)] hover:underline">
            politique de confidentialité
          </Link>
          .
        </p>
        <p>
          CNIL — cookies :{" "}
          <a
            href="https://www.cnil.fr/fr/cookies-et-autres-traceurs"
            className="text-[var(--accent)] hover:underline"
            rel="noopener noreferrer"
          >
            cnil.fr/fr/cookies-et-autres-traceurs
          </a>
        </p>
      </LegalSection>
    </LegalPage>
  );
}
