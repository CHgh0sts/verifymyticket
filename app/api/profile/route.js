import { prisma } from "@/lib/prisma";
import { assertSameOrigin, getClientIp, requireAuth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { profileUpdateSchema } from "@/lib/validations";
import { jsonError, jsonOk, jsonZodError } from "@/lib/api";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      username: true,
      email: true,
      emailVerified: true,
      pendingEmail: true,
      emailChangeExpires: true,
      passwordChangeExpires: true,
      createdAt: true,
      _count: { select: { tickets: true } },
    },
  });

  if (!user) return jsonError("Utilisateur introuvable", 404);

  return jsonOk({
    id: user.id,
    username: user.username,
    email: user.email,
    emailVerified: user.emailVerified,
    pendingEmail: user.pendingEmail,
    emailChangePending: Boolean(
      user.pendingEmail &&
        user.emailChangeExpires &&
        user.emailChangeExpires > new Date()
    ),
    passwordChangePending: Boolean(
      user.passwordChangeExpires && user.passwordChangeExpires > new Date()
    ),
    createdAt: user.createdAt,
    ticketCount: user._count.tickets,
  });
}

export async function PATCH(request) {
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

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) return jsonZodError(parsed.error);

  if (parsed.data.username) {
    const taken = await prisma.user.findFirst({
      where: {
        username: parsed.data.username,
        NOT: { id: session.userId },
      },
    });
    if (taken) return jsonError("Ce nom d'utilisateur est déjà pris", 409);

    await prisma.user.update({
      where: { id: session.userId },
      data: { username: parsed.data.username },
    });

    await writeAuditLog({
      action: "PROFILE_UPDATE",
      userId: session.userId,
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent"),
      meta: { username: parsed.data.username },
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      username: true,
      email: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  return jsonOk({ user });
}
