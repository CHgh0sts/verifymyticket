import { prisma } from "@/lib/prisma";
import {
  assertSameOrigin,
  generateToken,
  getClientIp,
  hashToken,
  requireAuth,
  verifyPassword,
} from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { sendEmailChangeConfirmEmail, sendEmailChangeNoticeEmail } from "@/lib/email";
import { changeEmailSchema } from "@/lib/validations";
import { jsonError, jsonOk, jsonZodError } from "@/lib/api";

export async function POST(request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Origine non autorisée", 403);
  }

  const { session, error } = await requireAuth();
  if (error) return error;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON invalide");
  }

  const parsed = changeEmailSchema.safeParse(body);
  if (!parsed.success) return jsonZodError(parsed.error);

  const newEmail = parsed.data.newEmail.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return jsonError("Utilisateur introuvable", 404);

  if (newEmail === user.email) {
    return jsonError("Cette adresse est déjà votre email actuel");
  }

  if (!user.password) {
    return jsonError(
      "Ce compte Google n’a pas de mot de passe local. Contactez le support pour changer d’email.",
      400
    );
  }

  const valid = await verifyPassword(parsed.data.currentPassword, user.password);
  if (!valid) return jsonError("Mot de passe actuel incorrect", 401);

  const taken = await prisma.user.findFirst({
    where: {
      OR: [{ email: newEmail }, { pendingEmail: newEmail }],
      NOT: { id: user.id },
    },
  });
  if (taken) return jsonError("Cet email est déjà utilisé", 409);

  const rawToken = generateToken();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      pendingEmail: newEmail,
      emailChangeToken: hashToken(rawToken),
      emailChangeExpires: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  await sendEmailChangeConfirmEmail(newEmail, rawToken);
  await sendEmailChangeNoticeEmail(user.email, newEmail);

  await writeAuditLog({
    action: "EMAIL_CHANGE_REQUEST",
    userId: user.id,
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent"),
    meta: { pendingEmail: newEmail },
  });

  return jsonOk({
    message:
      "Un email de confirmation a été envoyé à la nouvelle adresse. Cliquez sur le lien pour finaliser le changement.",
    pendingEmail: newEmail,
  });
}
