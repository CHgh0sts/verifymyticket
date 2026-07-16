import { LegalPage, LegalSection } from "@/components/LegalPage";
import { LEGAL } from "@/lib/legal";

export const metadata = {
  title: `Conditions générales d'utilisation — ${LEGAL.siteName}`,
  description: `CGU du service ${LEGAL.siteName}.`,
};

export default function CguPage() {
  return (
    <LegalPage title="Conditions générales d'utilisation (CGU)">
      <LegalSection title="1. Acceptation">
        <p>
          L&apos;accès et l&apos;utilisation du site {LEGAL.siteName} impliquent
          l&apos;acceptation pleine et entière des présentes CGU. Si vous n&apos;acceptez
          pas ces conditions, veuillez ne pas utiliser le service.
        </p>
      </LegalSection>

      <LegalSection title="2. Description du service">
        <p>{LEGAL.siteName} propose notamment :</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>la création d&apos;un compte utilisateur ;</li>
          <li>
            l&apos;enregistrement de billets via un code (QR / DataMatrix / code-barres),
            stocké uniquement sous forme de empreinte cryptographique (HMAC) ;
          </li>
          <li>
            la détection de doublons entre enregistrements ou vérifications publiques ;
          </li>
          <li>
            une vérification publique (avec ou sans compte) associée à un événement
            sélectionné, y compris via les 4 derniers caractères du code (signal de
            doute, non certitude) ;
          </li>
          <li>un tableau de bord listant les billets de l&apos;utilisateur.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Nature du service — avertissement essentiel">
        <p>
          Le service aide à repérer qu&apos;un même identifiant de billet a déjà été
          signalé.{" "}
          <strong className="text-[var(--text)]">
            Il ne remplace pas un contrôle officiel, une validation auprès de
            l&apos;organisateur, ni un conseil juridique.
          </strong>
        </p>
        <p>
          Un résultat « aucun doublon » ne signifie pas que le billet est authentique.
          Un résultat « doublon » ou « doute » ne signifie pas automatiquement que le
          billet est faux : il invite à la prudence et à contacter le vendeur.
        </p>
      </LegalSection>

      <LegalSection title="4. Compte utilisateur">
        <p>
          Vous vous engagez à fournir des informations exactes à l&apos;inscription, à
          conserver la confidentialité de vos identifiants, et à nous informer de tout
          usage non autorisé de votre compte. L&apos;accès peut être suspendu en cas de
          manquement aux CGU ou de suspicion d&apos;abus.
        </p>
        <p>
          La vérification de l&apos;adresse email peut être exigée avant certaines
          fonctionnalités (connexion).
        </p>
      </LegalSection>

      <LegalSection title="5. Contenu fourni par l'utilisateur">
        <p>En utilisant le service, vous garantissez que :</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            vous êtes autorisé à saisir les données du billet (acheteur légitime,
            détenteur, ou personne agissant de bonne foi pour vérifier un achat) ;
          </li>
          <li>
            vous ne tentez pas de contourner les mesures de sécurité, de saturer le
            service, ou d&apos;extraire massivement des données ;
          </li>
          <li>
            vous n&apos;utilisez pas le service à des fins illicites (fraude, usurpation,
            harcèlement, etc.).
          </li>
        </ul>
        <p>
          Les valeurs brutes des codes ne sont pas conservées : seules des empreintes
          HMAC et des métadonnées d&apos;événement / billet sont stockées, conformément à
          la politique de confidentialité.
        </p>
      </LegalSection>

      <LegalSection title="6. Vérification publique">
        <p>
          La vérification sans compte peut être limitée (CAPTCHA, limitation de débit)
          pour prévenir les abus. Chaque vérification peut être journalisée et le hash
          associé à l&apos;événement choisi peut être conservé afin d&apos;alimenter la
          détection de doublons ultérieurs.
        </p>
      </LegalSection>

      <LegalSection title="7. Disponibilité et évolutions">
        <p>
          Le service est fourni « en l&apos;état ». Nous pouvons modifier, suspendre ou
          interrompre tout ou partie des fonctionnalités, notamment pour maintenance,
          sécurité ou évolution légale. Les CGU peuvent être mises à jour ; la date
          figurant en tête de page fait foi.
        </p>
      </LegalSection>

      <LegalSection title="8. Responsabilité">
        <p>
          Dans les limites autorisées par la loi française, {LEGAL.siteName} ne saurait
          être tenu responsable des dommages indirects, pertes de chance, décisions
          d&apos;achat fondées uniquement sur un résultat du service, ou préjudices liés
          à une indisponibilité temporaire.
        </p>
        <p>
          L&apos;utilisateur reste responsable de ses relations contractuelles avec les
          plateformes de billetterie et les vendeurs tiers.
        </p>
      </LegalSection>

      <LegalSection title="9. Propriété intellectuelle">
        <p>
          Hors contenus que vous fournissez, le site et ses composants restent la
          propriété de l&apos;éditeur. Aucune licence n&apos;est concédée au-delà de
          l&apos;usage personnel du service.
        </p>
      </LegalSection>

      <LegalSection title="10. Droit applicable — litiges">
        <p>
          Les présentes CGU sont régies par le droit français. En cas de litige, et à
          défaut d&apos;accord amiable, les tribunaux français compétents seront saisis,
          sous réserve des règles d&apos;ordre public protectrices du consommateur.
        </p>
        <p>
          Conformément à l&apos;article L.612-1 du Code de la consommation, si vous êtes
          consommateur vous pouvez recourir gratuitement à un médiateur de la
          consommation. Les coordonnées du médiateur seront indiquées dès désignation
          (à compléter avant production :{" "}
          <a
            href="https://www.economie.gouv.fr/mediation-conso"
            className="text-[var(--accent)] hover:underline"
            rel="noopener noreferrer"
          >
            economie médiation conso
          </a>
          ).
        </p>
      </LegalSection>

      <LegalSection title="11. Contact">
        <p>
          <a href={`mailto:${LEGAL.contact.email}`} className="text-[var(--accent)] hover:underline">
            {LEGAL.contact.email}
          </a>
        </p>
      </LegalSection>
    </LegalPage>
  );
}
