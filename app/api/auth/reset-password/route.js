import { prisma } from "@/lib/prisma";
import {
  assertSameOrigin,
  getClientIp,
  hashPassword,
  hashToken,
} from "@/lib/auth";
import { rateLimitAuth } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";
import { resetPasswordSchema } from "@/lib/validations";
import { jsonError, jsonOk, jsonZodError } from "@/lib/api";

export async function POST(request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Origine non autorisée", 403);
  }

  const ip = getClientIp(request);
  const rl = await rateLimitAuth(ip);
  if (!rl.success) {
    return jsonError("Trop de tentatives. Réessayez plus tard.", 429);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON invalide");
  }

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) return jsonZodError(parsed.error);

  const tokenHash = hashToken(parsed.data.token);
  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { gt: new Date() },
    },
  });

  if (!user) {
    return jsonError("Lien invalide ou expiré", 400);
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: passwordHash,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
  });

  await writeAuditLog({
    action: "RESET_PASSWORD",
    userId: user.id,
    ip,
    userAgent: request.headers.get("user-agent"),
  });

  return jsonOk({ message: "Mot de passe mis à jour. Vous pouvez vous connecter." });
}
