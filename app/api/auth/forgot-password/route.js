import { prisma } from "@/lib/prisma";
import {
  assertSameOrigin,
  generateToken,
  getClientIp,
  hashToken,
} from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimitAuth } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";
import { forgotPasswordSchema } from "@/lib/validations";
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

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) return jsonZodError(parsed.error);

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to avoid email enumeration
  if (user) {
    const rawToken = generateToken();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashToken(rawToken),
        resetPasswordExpires: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    await sendPasswordResetEmail(email, rawToken);
    await writeAuditLog({
      action: "FORGOT_PASSWORD",
      userId: user.id,
      ip,
      userAgent: request.headers.get("user-agent"),
    });
  }

  return jsonOk({
    message:
      "Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.",
  });
}
