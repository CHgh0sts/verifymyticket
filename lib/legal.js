/**
 * Identité légale du site — valeurs via variables d'environnement (LCEN).
 * Renseignez LEGAL_* dans .env avant mise en production.
 */
function env(key, fallback = "") {
  const v = process.env[key];
  return v && String(v).trim() ? String(v).trim() : fallback;
}

const incomplete =
  !env("LEGAL_EDITOR_NAME") ||
  env("LEGAL_EDITOR_NAME").startsWith("[") ||
  !env("LEGAL_EDITOR_ADDRESS");

export const LEGAL = {
  siteName: "VerifyMyTicket",
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  lastUpdate: env("LEGAL_LAST_UPDATE", "17 juillet 2026"),
  incomplete,

  editor: {
    status: env("LEGAL_EDITOR_STATUS", "Personne physique"),
    name: env("LEGAL_EDITOR_NAME", "À compléter — voir .env.example"),
    address: env("LEGAL_EDITOR_ADDRESS", "Adresse à compléter"),
    postalCode: env("LEGAL_EDITOR_POSTAL", ""),
    city: env("LEGAL_EDITOR_CITY", ""),
    country: env("LEGAL_EDITOR_COUNTRY", "France"),
    email: env("LEGAL_EDITOR_EMAIL", "contact@verifymyticket.fr"),
    phone: env("LEGAL_EDITOR_PHONE", ""),
    siret: env("LEGAL_EDITOR_SIRET", ""),
    rcs: env("LEGAL_EDITOR_RCS", ""),
    capital: env("LEGAL_EDITOR_CAPITAL", ""),
    tva: env("LEGAL_EDITOR_TVA", ""),
    publicationDirector: env(
      "LEGAL_PUBLICATION_DIRECTOR",
      env("LEGAL_EDITOR_NAME", "Directeur de la publication")
    ),
  },

  host: {
    name: env("LEGAL_HOST_NAME", "Vercel Inc."),
    address: env(
      "LEGAL_HOST_ADDRESS",
      "440 N Barranca Ave #4133, Covina, CA 91723, États-Unis"
    ),
    website: env("LEGAL_HOST_WEBSITE", "https://vercel.com"),
  },

  dpo: {
    email: env("LEGAL_DPO_EMAIL", "contact@verifymyticket.fr"),
    note: "Pour toute demande RGPD (accès, rectification, effacement, opposition, portabilité).",
  },

  contact: {
    email: env("LEGAL_CONTACT_EMAIL", "contact@verifymyticket.fr"),
  },
};
