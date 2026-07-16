/**
 * Identité légale du site — à mettre à jour avant mise en production.
 * LCEN : l'éditeur doit être identifiable (identité, coordonnées, SIRET si pro).
 */
export const LEGAL = {
  siteName: "VerifyMyTicket",
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  lastUpdate: "16 juillet 2026",

  // ÉDITEUR — remplacer par vos vraies informations avant production
  editor: {
    status: "Personne physique / projet (à finaliser)",
    name: "[Nom ou raison sociale à compléter]",
    address: "[Adresse postale à compléter]",
    postalCode: "[Code postal]",
    city: "[Ville]",
    country: "France",
    email: "contact@verifymyticket.fr",
    phone: "[Téléphone à compléter — facultatif si email fourni]",
    // Si société :
    siret: "[SIRET à compléter si professionnel]",
    rcs: "[RCS / ville d'immatriculation si société]",
    capital: "[Capital social si société]",
    tva: "[N° TVA intracommunautaire si applicable]",
    publicationDirector: "[Directeur de la publication — prénom nom]",
  },

  // HÉBERGEUR — adapter selon le déploiement réel
  host: {
    name: "Vercel Inc.",
    address: "440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
    website: "https://vercel.com",
    // Alternative FR courante si vous changez d'hébergeur :
    // name: "OVH SAS", address: "2 rue Kellermann, 59100 Roubaix, France"
  },

  dpo: {
    email: "contact@verifymyticket.fr",
    note: "Pour toute demande RGPD (accès, rectification, effacement, opposition, portabilité).",
  },

  contact: {
    email: "contact@verifymyticket.fr",
  },
};
