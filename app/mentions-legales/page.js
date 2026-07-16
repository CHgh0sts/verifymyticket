import { LegalPage, LegalSection } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata = {
  title: `Mentions légales — ${LEGAL.siteName}`,
  description: `Mentions légales du site ${LEGAL.siteName} (LCEN).`,
};

export default function MentionsLegalesPage() {
  const e = LEGAL.editor;
  const h = LEGAL.host;

  return (
    <LegalPage title="Mentions légales">
      <LegalSection title="1. Éditeur du site">
        <p>
          Le site <strong className="text-[var(--text)]">{LEGAL.siteName}</strong> est
          édité par :
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Statut : {e.status}</li>
          <li>Identité / raison sociale : {e.name}</li>
          <li>
            Adresse : {e.address}, {e.postalCode} {e.city}, {e.country}
          </li>
          <li>Email : {e.email}</li>
          <li>Téléphone : {e.phone}</li>
          <li>SIRET : {e.siret}</li>
          <li>RCS : {e.rcs}</li>
          <li>Capital social : {e.capital}</li>
          <li>N° TVA intracommunautaire : {e.tva}</li>
          <li>Directeur de la publication : {e.publicationDirector}</li>
        </ul>
        <p className="rounded-lg border border-[var(--warning)]/30 bg-[var(--warning-soft)] px-3 py-2 text-[var(--warning)]">
          Avant toute mise en production, remplacez les champs entre crochets dans{" "}
          <code className="text-[var(--text)]">lib/legal.js</code> par vos informations
          réelles (obligation LCEN).
        </p>
      </LegalSection>

      <LegalSection title="2. Hébergeur">
        <ul className="list-disc space-y-1 pl-5">
          <li>Hébergeur : {h.name}</li>
          <li>Adresse : {h.address}</li>
          <li>
            Site :{" "}
            <a href={h.website} className="text-[var(--accent)] hover:underline" rel="noopener noreferrer">
              {h.website}
            </a>
          </li>
        </ul>
        <p>
          Adaptez ces informations si vous changez d&apos;hébergeur (OVH, Scaleway,
          AWS, etc.).
        </p>
      </LegalSection>

      <LegalSection title="3. Objet du service">
        <p>
          {LEGAL.siteName} est un service en ligne permettant aux utilisateurs
          d&apos;enregistrer ou de vérifier des identifiants de billets (codes QR /
          codes-barres) afin de détecter d&apos;éventuels enregistrements multiples
          pouvant indiquer une circulation du même billet lors de reventes.
        </p>
        <p>
          <strong className="text-[var(--text)]">
            Le service ne constitue pas une authentification officielle
          </strong>{" "}
          auprès de Ticketmaster, France Billet, See Tickets, d&apos;un organisateur
          ou de tout tiers. Aucun résultat ne garantit l&apos;authenticité juridique
          d&apos;un billet.
        </p>
      </LegalSection>

      <LegalSection title="4. Contact">
        <p>
          Pour toute question :{" "}
          <a href={`mailto:${LEGAL.contact.email}`} className="text-[var(--accent)] hover:underline">
            {LEGAL.contact.email}
          </a>
        </p>
        <p>
          Pour exercer vos droits RGPD :{" "}
          <a href={`mailto:${LEGAL.dpo.email}`} className="text-[var(--accent)] hover:underline">
            {LEGAL.dpo.email}
          </a>
        </p>
      </LegalSection>

      <LegalSection title="5. Propriété intellectuelle">
        <p>
          L&apos;ensemble des éléments du site (marque, textes, interface, graphismes,
          code) est protégé par le droit de la propriété intellectuelle. Toute
          reproduction non autorisée est interdite, hors usage privé conformément
          au Code de la propriété intellectuelle.
        </p>
      </LegalSection>

      <LegalSection title="6. Responsabilité">
        <p>
          L&apos;éditeur s&apos;efforce d&apos;assurer l&apos;exactitude des informations et la
          disponibilité du service, sans garantie d&apos;absence d&apos;erreur ou
          d&apos;interruption. L&apos;utilisateur reste seul responsable de ses décisions
          d&apos;achat ou de revente de billets.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
