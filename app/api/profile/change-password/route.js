import { prisma } from "@/lib/prisma";
import {
  assertSameOrigin,
  generateToken,
  getClientIp,
  hashPassword,
  hashToken,
  requireAuth,
  verifyPassword,
} from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { sendPasswordChangeConfirmEmail } from "@/lib/email";
import { changePasswordSchema } from "@/lib/validations";
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

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) return jsonZodError(parsed.error);

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return jsonError("Utilisateur introuvable", 404);
  if (!user.password) {
    return jsonError(
      "Ce compte utilise Google. Définissez un mot de passe via « mot de passe oublié » si besoin, ou gérez le compte Google.",
      400
    );
  }

  const valid = await verifyPassword(parsed.data.currentPassword, user.password);
  if (!valid) return jsonError("Mot de passe actuel incorrect", 401);

  const same = await verifyPassword(parsed.data.newPassword, user.password);
  if (same) {
    return jsonError("Le nouveau mot de passe doit être différent de l'actuel");
  }

  const pendingPasswordHash = await hashPassword(parsed.data.newPassword);
  const rawToken = generateToken();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      pendingPasswordHash,
      passwordChangeToken: hashToken(rawToken),
      passwordChangeExpires: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  await sendPasswordChangeConfirmEmail(user.email, rawToken);

  await writeAuditLog({
    action: "PASSWORD_CHANGE_REQUEST",
    userId: user.id,
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent"),
  });

  return jsonOk({
    message:
      "Un email de confirmation a été envoyé à votre adresse actuelle. Cliquez sur le lien pour activer le nouveau mot de passe.",
  });
}
