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
import { loginSchema } from "@/lib/validations";
import { jsonError, jsonZodError } from "@/lib/api";

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

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return jsonZodError(parsed.error);

  const email = parsed.data.email.toLowerCase().trim();
  const { password } = parsed.data;

  if (await isLoginLocked(email, ip)) {
    return jsonError(
      "Trop d'échecs de connexion. Réessayez dans 15 minutes.",
      429
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    await recordLoginAttempt({ email, ip, success: false });
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
