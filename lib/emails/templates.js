import {
  escapeHtml,
  infoBox,
  mutedParagraph,
  paragraph,
  primaryButton,
  renderEmailLayout,
  strong,
  warningBox,
} from "./layout";

export function verifyEmailTemplate({ appUrl, link }) {
  const title = "Vérifiez votre adresse email";
  const bodyHtml = [
    paragraph("Bienvenue sur VerifyMyTicket."),
    paragraph(
      "Confirmez votre adresse pour activer votre compte et commencer à protéger vos billets contre les reventes en double."
    ),
    primaryButton(link, "Vérifier mon email"),
    mutedParagraph("Ce lien expire dans 24 heures. Si vous n’avez pas créé de compte, ignorez cet email."),
  ].join("");

  return {
    subject: "Vérifiez votre adresse email — VerifyMyTicket",
    html: renderEmailLayout({
      title,
      preheader: "Activez votre compte VerifyMyTicket en un clic.",
      bodyHtml,
      appUrl,
    }),
  };
}

export function passwordResetTemplate({ appUrl, link }) {
  const title = "Réinitialisation du mot de passe";
  const bodyHtml = [
    paragraph("Vous avez demandé à réinitialiser le mot de passe de votre compte VerifyMyTicket."),
    primaryButton(link, "Réinitialiser mon mot de passe"),
    mutedParagraph(
      "Ce lien expire dans 1 heure. Si vous n’êtes pas à l’origine de cette demande, ignorez cet email — votre mot de passe actuel restera inchangé."
    ),
  ].join("");

  return {
    subject: "Réinitialisation du mot de passe — VerifyMyTicket",
    html: renderEmailLayout({
      title,
      preheader: "Choisissez un nouveau mot de passe pour votre compte.",
      bodyHtml,
      appUrl,
    }),
  };
}

export function emailChangeConfirmTemplate({ appUrl, link }) {
  const title = "Confirmez votre nouvelle adresse";
  const bodyHtml = [
    paragraph(
      "Vous avez demandé à utiliser cette adresse email pour votre compte VerifyMyTicket."
    ),
    primaryButton(link, "Confirmer mon nouvel email"),
    mutedParagraph(
      "Ce lien expire dans 1 heure. Si vous n’êtes pas à l’origine de cette demande, ignorez cet email."
    ),
  ].join("");

  return {
    subject: "Confirmez votre nouvelle adresse email — VerifyMyTicket",
    html: renderEmailLayout({
      title,
      preheader: "Validez le changement d’email de votre compte.",
      bodyHtml,
      appUrl,
    }),
  };
}

export function emailChangeNoticeTemplate({ appUrl, newEmail }) {
  const title = "Demande de changement d’email";
  const bodyHtml = [
    paragraph("Une demande de changement d’email a été initiée sur votre compte VerifyMyTicket."),
    infoBox(
      `Nouvelle adresse demandée : ${strong(newEmail)}`
    ),
    warningBox(
      "Si ce n’était pas vous, connectez-vous immédiatement et changez votre mot de passe."
    ),
    primaryButton(`${appUrl}/login`, "Se connecter"),
    mutedParagraph("Un email de confirmation a aussi été envoyé à la nouvelle adresse."),
  ].join("");

  return {
    subject: "Demande de changement d'email — VerifyMyTicket",
    html: renderEmailLayout({
      title,
      preheader: "Une demande de changement d’email a été faite sur votre compte.",
      bodyHtml,
      appUrl,
    }),
  };
}

export function passwordChangeConfirmTemplate({ appUrl, link }) {
  const title = "Confirmez le nouveau mot de passe";
  const bodyHtml = [
    paragraph(
      "Vous avez demandé à changer le mot de passe de votre compte VerifyMyTicket."
    ),
    primaryButton(link, "Confirmer le nouveau mot de passe"),
    mutedParagraph(
      "Ce lien expire dans 1 heure. Si vous n’êtes pas à l’origine de cette demande, ignorez cet email — votre mot de passe actuel restera inchangé."
    ),
  ].join("");

  return {
    subject: "Confirmez le changement de mot de passe — VerifyMyTicket",
    html: renderEmailLayout({
      title,
      preheader: "Validez le changement de mot de passe de votre compte.",
      bodyHtml,
      appUrl,
    }),
  };
}

export function checkWatchAlertTemplate({
  appUrl,
  eventLabel,
  reason,
  statusLabel,
}) {
  const title = "Alerte sur un billet suivi";
  const details = [
    `<div style="margin:0 0 8px 0;"><span style="color:#8b97ab;">Événement :</span> ${strong(eventLabel || "Non précisé")}</div>`,
    `<div style="margin:0 0 8px 0;"><span style="color:#8b97ab;">Motif :</span> ${escapeHtml(reason || "Activité détectée")}</div>`,
  ];
  if (statusLabel) {
    details.push(
      `<div style="margin:0;"><span style="color:#8b97ab;">État signalé :</span> ${strong(statusLabel)}</div>`
    );
  }

  const bodyHtml = [
    paragraph(
      "Une activité a été détectée sur une vérification que vous suivez sur VerifyMyTicket."
    ),
    infoBox(details.join("")),
    warningBox(
      "Cela ne prouve pas une fraude à coup sûr, mais mérite votre attention — surtout si vous avez déjà acheté ce billet."
    ),
    primaryButton(`${appUrl}/check`, "Retourner à la vérification"),
    mutedParagraph(
      "Vous recevez cet email car vous vous êtes connecté ou avez laissé votre adresse lors d’une vérification."
    ),
  ].join("");

  return {
    subject: "Alerte billet — VerifyMyTicket",
    html: renderEmailLayout({
      title,
      preheader: reason || "Activité détectée sur un billet que vous suivez.",
      bodyHtml,
      appUrl,
    }),
  };
}
