import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  assertSameOrigin,
  createSessionToken,
  getClientIp,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { isLoginLocked, recordLoginAttempt, writeAuditLog } from "@/lib/audit";
import { rateLimitAuth } from "@/lib/rate-limit";
import { verifyTotpCode } from "@/lib/totp";
import { loginSchema } from "@/lib/validations";
import { jsonError, jsonZodError, jsonOk } from "@/lib/api";
import { z } from "zod";

const loginWithTotpSchema = loginSchema.extend({
  totpCode: z.string().optional(),
});

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

  const parsed = loginWithTotpSchema.safeParse(body);
  if (!parsed.success) return jsonZodError(parsed.error);

  const email = parsed.data.email.toLowerCase().trim();
  const { password, totpCode } = parsed.data;

  if (await isLoginLocked(email, ip)) {
    return jsonError(
      "Trop d'échecs de connexion. Réessayez dans 15 minutes.",
      429
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) {
    await recordLoginAttempt({ email, ip, success: false });
    if (user && !user.password) {
      return jsonError(
        "Ce compte utilise Google. Connectez-vous via « Continuer avec Google ».",
        401
      );
    }
    return jsonError("Email ou mot de passe incorrect", 401);
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    await recordLoginAttempt({ email, ip, success: false, userId: user.id });
    return jsonError("Email ou mot de passe incorrect", 401);
  }

  if (!user.emailVerified) {
    return jsonError(
      "Email non vérifié. Consultez votre boîte mail ou demandez un nouvel envoi.",
      403
    );
  }

  if (user.totpEnabled) {
    if (!totpCode) {
      return jsonOk({ requires2fa: true, message: "Code 2FA requis" });
    }
    if (!verifyTotpCode(user.totpSecret, totpCode)) {
      await recordLoginAttempt({ email, ip, success: false, userId: user.id });
      return jsonError("Code 2FA invalide", 401);
    }
  }

  const token = await createSessionToken({
    userId: user.id,
    email: user.email,
    username: user.username,
  });

  await recordLoginAttempt({ email, ip, success: true, userId: user.id });
  await writeAuditLog({
    action: "LOGIN",
    userId: user.id,
    ip,
    userAgent: request.headers.get("user-agent"),
  });

  const response = NextResponse.json({
    message: "Connexion réussie",
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
  });
  return setSessionCookie(response, token);
}
