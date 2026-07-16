import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata = {
  title: `Politique de confidentialité — ${LEGAL.siteName}`,
  description: `Politique de confidentialité et informations RGPD — ${LEGAL.siteName}.`,
};

export default function ConfidentialitePage() {
  return (
    <LegalPage title="Politique de confidentialité (RGPD)">
      <LegalSection title="1. Responsable de traitement">
        <p>
          Le responsable de traitement des données personnelles collectées via{" "}
          {LEGAL.siteName} est l&apos;éditeur du site, dont les coordonnées figurent
          dans les{" "}
          <Link href="/mentions-legales" className="text-[var(--accent)] hover:underline">
            mentions légales
          </Link>
          .
        </p>
        <p>
          Contact RGPD / DPO :{" "}
          <a href={`mailto:${LEGAL.dpo.email}`} className="text-[var(--accent)] hover:underline">
            {LEGAL.dpo.email}
          </a>
        </p>
      </LegalSection>

      <LegalSection title="2. Données collectées">
        <p>Selon votre usage, nous pouvons traiter :</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-[var(--text)]">Compte</strong> : nom
            d&apos;utilisateur, adresse email, mot de passe (hash bcrypt), dates de
            vérification email / reset ;
          </li>
          <li>
            <strong className="text-[var(--text)]">Billets enregistrés</strong> :
            métadonnées (événement, lieu, date, plateforme, placement, etc.) et{" "}
            <em>empreintes HMAC</em> du code —{" "}
            <strong className="text-[var(--text)]">
              jamais la valeur brute du QR / code-barres
            </strong>{" "}
            ;
          </li>
          <li>
            <strong className="text-[var(--text)]">Vérifications publiques</strong> :
            hash du code (complet ou 4 derniers caractères), événement associé, adresse
            IP, horodatage ;
          </li>
          <li>
            <strong className="text-[var(--text)]">Journaux de sécurité</strong> :
            tentatives de connexion, actions d&apos;audit (login, création de billet,
            etc.), user-agent ;
          </li>
          <li>
            <strong className="text-[var(--text)]">Données techniques</strong> : cookie
            de session HttpOnly, éventuel CAPTCHA (Cloudflare Turnstile), limitation de
            débit.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Finalités et bases légales">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-[var(--text)]">Exécution du contrat / service</strong>{" "}
            (art. 6.1.b RGPD) : création de compte, enregistrement et liste de vos
            billets, détection de doublons ;
          </li>
          <li>
            <strong className="text-[var(--text)]">Intérêt légitime</strong> (art. 6.1.f)
            : sécurité (anti-bruteforce, journalisation, rate limiting), amélioration de
            la détection de reventes multiples via les vérifications publiques ;
          </li>
          <li>
            <strong className="text-[var(--text)]">Obligation légale</strong> (art. 6.1.c)
            lorsque applicable (réponse à une autorité) ;
          </li>
          <li>
            <strong className="text-[var(--text)]">Consentement</strong> (art. 6.1.a) pour
            les cookies / traceurs non strictement nécessaires, le cas échéant (voir{" "}
            <Link href="/cookies" className="text-[var(--accent)] hover:underline">
              politique cookies
            </Link>
            ).
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Destinataires et sous-traitants">
        <p>
          Les données sont destinées à l&apos;éditeur et, le cas échéant, à des
          prestataires techniques agissant en qualité de sous-traitants :
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>hébergement (ex. Vercel / autre — voir mentions légales) ;</li>
          <li>envoi d&apos;emails transactionnels (ex. Resend) ;</li>
          <li>CAPTCHA (ex. Cloudflare Turnstile) ;</li>
          <li>rate limiting (ex. Upstash Redis) si configuré ;</li>
          <li>
            recherche d&apos;événements (API Ticketmaster Discovery) — mots-clés de
            recherche transmis à Ticketmaster, pas vos codes billets.
          </li>
        </ul>
        <p>
          Aucune revente de vos données personnelles à des fins publicitaires n&apos;est
          effectuée dans le cadre du service actuel.
        </p>
      </LegalSection>

      <LegalSection title="5. Transferts hors UE">
        <p>
          Certains prestataires (hébergeur cloud, email, CAPTCHA) peuvent être situés
          hors de l&apos;Union européenne. Dans ce cas, des garanties appropriées sont
          recherchées (clauses contractuelles types, décisions d&apos;adéquation, etc.).
          Adaptez cette section selon vos prestataires réels avant production.
        </p>
      </LegalSection>

      <LegalSection title="6. Durées de conservation">
        <ul className="list-disc space-y-1 pl-5">
          <li>Compte : jusqu&apos;à suppression du compte ou inactivité prolongée ;</li>
          <li>
            Billets enregistrés : tant que le compte existe, ou suppression manuelle par
            l&apos;utilisateur ;
          </li>
          <li>
            Vérifications publiques (hashes liés à un événement) : durée nécessaire à la
            finalité de détection, puis purge ou anonymisation (politique interne à
            définir — recommandé : 24 à 36 mois) ;
          </li>
          <li>
            Journaux de sécurité / tentatives de connexion : durée limitée (ex. 12 mois)
            ;
          </li>
          <li>Cookie de session : durée limitée (ex. 7 jours).</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Sécurité">
        <p>
          Mesures notamment : mots de passe hashés (bcrypt), session JWT en cookie
          HttpOnly, HMAC-SHA-256 des codes billets avec secret serveur, validation des
          entrées, limitation des tentatives, CAPTCHA sur vérifications publiques.
        </p>
      </LegalSection>

      <LegalSection title="8. Vos droits">
        <p>Conformément au RGPD et à la loi Informatique et Libertés, vous disposez des droits :</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>d&apos;accès, de rectification, d&apos;effacement ;</li>
          <li>de limitation et d&apos;opposition ;</li>
          <li>de portabilité lorsque applicable ;</li>
          <li>de retirer votre consentement lorsque le traitement y est fondé ;</li>
          <li>
            d&apos;introduire une réclamation auprès de la CNIL (
            <a
              href="https://www.cnil.fr"
              className="text-[var(--accent)] hover:underline"
              rel="noopener noreferrer"
            >
              www.cnil.fr
            </a>
            ).
          </li>
        </ul>
        <p>
          Pour exercer vos droits :{" "}
          <a href={`mailto:${LEGAL.dpo.email}`} className="text-[var(--accent)] hover:underline">
            {LEGAL.dpo.email}
          </a>{" "}
          — {LEGAL.dpo.note}
        </p>
      </LegalSection>

      <LegalSection title="9. Mineurs">
        <p>
          Le service n&apos;est pas destiné aux mineurs de moins de 15 ans sans
          l&apos;accord du titulaire de l&apos;autorité parentale, conformément au droit
          français.
        </p>
      </LegalSection>

      <LegalSection title="10. Modifications">
        <p>
          La présente politique peut être mise à jour. La date en tête de page indique
          la version en vigueur.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
