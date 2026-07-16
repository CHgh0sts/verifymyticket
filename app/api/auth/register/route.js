import { prisma } from "@/lib/prisma";
import {
  assertSameOrigin,
  generateToken,
  getClientIp,
  hashPassword,
  hashToken,
} from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimitAuth } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";
import { registerSchema } from "@/lib/validations";
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

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return jsonZodError(parsed.error);

  const { username, email, password } = parsed.data;
  const emailNorm = email.toLowerCase().trim();
  const usernameNorm = username.trim();

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: emailNorm }, { username: usernameNorm }],
    },
  });

  if (existing) {
    if (existing.email === emailNorm) {
      return jsonError("Cet email est déjà utilisé", 409);
    }
    return jsonError("Ce nom d'utilisateur est déjà pris", 409);
  }

  const passwordHash = await hashPassword(password);
  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);

  const user = await prisma.user.create({
    data: {
      username: usernameNorm,
      email: emailNorm,
      password: passwordHash,
      emailVerifyToken: tokenHash,
      emailVerifyExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  await sendVerificationEmail(emailNorm, rawToken);
  await writeAuditLog({
    action: "REGISTER",
    userId: user.id,
    ip,
    userAgent: request.headers.get("user-agent"),
  });

  return jsonOk(
    {
      message:
        "Compte créé. Vérifiez votre email pour activer votre compte.",
      userId: user.id,
    },
    201
  );
}
