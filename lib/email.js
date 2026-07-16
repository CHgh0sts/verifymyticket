import { Resend } from "resend";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function fromAddress() {
  return process.env.EMAIL_FROM || "VerifyMyTicket <contact@verifymyticket.fr>";
}

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export async function sendVerificationEmail(email, token) {
  const resend = getResend();
  const link = `${appUrl()}/verify-email?token=${token}`;

  if (!resend) {
    console.info("[email:dev] Vérification email:", email, link);
    return { ok: true, dev: true };
  }

  await resend.emails.send({
    from: fromAddress(),
    to: email,
    subject: "Vérifiez votre adresse email — VerifyMyTicket",
    html: `
      <p>Bienvenue sur VerifyMyTicket.</p>
      <p><a href="${link}">Cliquez ici pour vérifier votre email</a>.</p>
      <p>Ce lien expire dans 24 heures.</p>
    `,
  });
  return { ok: true };
}

export async function sendPasswordResetEmail(email, token) {
  const resend = getResend();
  const link = `${appUrl()}/reset-password?token=${token}`;

  if (!resend) {
    console.info("[email:dev] Reset password:", email, link);
    return { ok: true, dev: true };
  }

  await resend.emails.send({
    from: fromAddress(),
    to: email,
    subject: "Réinitialisation du mot de passe — VerifyMyTicket",
    html: `
      <p>Vous avez demandé une réinitialisation de mot de passe.</p>
      <p><a href="${link}">Réinitialiser mon mot de passe</a></p>
      <p>Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
    `,
  });
  return { ok: true };
}

export async function sendEmailChangeConfirmEmail(newEmail, token) {
  const resend = getResend();
  const link = `${appUrl()}/api/profile/confirm-email?token=${token}`;

  if (!resend) {
    console.info("[email:dev] Confirmation nouvel email:", newEmail, link);
    return { ok: true, dev: true };
  }

  await resend.emails.send({
    from: fromAddress(),
    to: newEmail,
    subject: "Confirmez votre nouvelle adresse email — VerifyMyTicket",
    html: `
      <p>Vous avez demandé à utiliser cette adresse pour votre compte VerifyMyTicket.</p>
      <p><a href="${link}">Confirmer mon nouvel email</a></p>
      <p>Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
    `,
  });
  return { ok: true };
}

export async function sendEmailChangeNoticeEmail(oldEmail, newEmail) {
  const resend = getResend();
  if (!resend) {
    console.info("[email:dev] Avis changement email:", oldEmail, "→", newEmail);
    return { ok: true, dev: true };
  }

  await resend.emails.send({
    from: fromAddress(),
    to: oldEmail,
    subject: "Demande de changement d'email — VerifyMyTicket",
    html: `
      <p>Une demande de changement d'email a été initiée sur votre compte.</p>
      <p>Nouvelle adresse demandée : <strong>${newEmail}</strong></p>
      <p>Si ce n'était pas vous, connectez-vous immédiatement et changez votre mot de passe.</p>
    `,
  });
  return { ok: true };
}

export async function sendPasswordChangeConfirmEmail(email, token) {
  const resend = getResend();
  const link = `${appUrl()}/api/profile/confirm-password?token=${token}`;

  if (!resend) {
    console.info("[email:dev] Confirmation nouveau mot de passe:", email, link);
    return { ok: true, dev: true };
  }

  await resend.emails.send({
    from: fromAddress(),
    to: email,
    subject: "Confirmez le changement de mot de passe — VerifyMyTicket",
    html: `
      <p>Vous avez demandé à changer le mot de passe de votre compte VerifyMyTicket.</p>
      <p><a href="${link}">Confirmer le nouveau mot de passe</a></p>
      <p>Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email et votre mot de passe actuel restera inchangé.</p>
    `,
  });
  return { ok: true };
}
