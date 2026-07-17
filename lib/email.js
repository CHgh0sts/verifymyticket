import { Resend } from "resend";
import {
  checkWatchAlertTemplate,
  emailChangeConfirmTemplate,
  emailChangeNoticeTemplate,
  passwordChangeConfirmTemplate,
  passwordResetTemplate,
  verifyEmailTemplate,
} from "./emails/templates";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function fromAddress() {
  return process.env.EMAIL_FROM || "VerifyMyTicket <contact@verifymyticket.fr>";
}

export function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

async function sendTemplated(to, template, { devExtra } = {}) {
  const resend = getResend();
  if (!resend) {
    console.info(`[email:dev] ${template.subject}`, { to, ...devExtra });
    return { ok: true, dev: true };
  }

  await resend.emails.send({
    from: fromAddress(),
    to,
    subject: template.subject,
    html: template.html,
  });
  return { ok: true };
}

export async function sendVerificationEmail(email, token) {
  const base = appUrl();
  const link = `${base}/verify-email?token=${token}`;
  return sendTemplated(email, verifyEmailTemplate({ appUrl: base, link }), {
    devExtra: { link },
  });
}

export async function sendPasswordResetEmail(email, token) {
  const base = appUrl();
  const link = `${base}/reset-password?token=${token}`;
  return sendTemplated(email, passwordResetTemplate({ appUrl: base, link }), {
    devExtra: { link },
  });
}

export async function sendEmailChangeConfirmEmail(newEmail, token) {
  const base = appUrl();
  const link = `${base}/api/profile/confirm-email?token=${token}`;
  return sendTemplated(newEmail, emailChangeConfirmTemplate({ appUrl: base, link }), {
    devExtra: { link },
  });
}

export async function sendEmailChangeNoticeEmail(oldEmail, newEmail) {
  const base = appUrl();
  return sendTemplated(
    oldEmail,
    emailChangeNoticeTemplate({ appUrl: base, newEmail }),
    { devExtra: { newEmail } }
  );
}

export async function sendPasswordChangeConfirmEmail(email, token) {
  const base = appUrl();
  const link = `${base}/api/profile/confirm-password?token=${token}`;
  return sendTemplated(email, passwordChangeConfirmTemplate({ appUrl: base, link }), {
    devExtra: { link },
  });
}

export async function sendCheckWatchAlertEmail(email, { eventLabel, reason, statusLabel }) {
  const base = appUrl();
  return sendTemplated(
    email,
    checkWatchAlertTemplate({
      appUrl: base,
      eventLabel,
      reason,
      statusLabel,
    }),
    { devExtra: { eventLabel, reason, statusLabel } }
  );
}
