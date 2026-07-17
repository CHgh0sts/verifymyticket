import { prisma } from "@/lib/prisma";
import { assertSameOrigin, getClientIp, requireAuth, generateToken, hashToken } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { sendAccountDeletionEmail } from "@/lib/email";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      tickets: true,
      loginAttempts: { orderBy: { createdAt: "desc" }, take: 50 },
      auditLogs: { orderBy: { createdAt: "desc" }, take: 100 },
      pushSubscriptions: { select: { id: true, endpoint: true, createdAt: true } },
    },
  });
  if (!user) return jsonError("Compte introuvable", 404);

  const watches = await prisma.checkWatch.findMany({
    where: {
      OR: [{ userId: user.id }, { email: user.email }],
    },
    include: { sighting: true },
  });

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      emailVerified: user.emailVerified,
      locale: user.locale,
      role: user.role,
      totpEnabled: user.totpEnabled,
      googleLinked: Boolean(user.googleId),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    tickets: user.tickets.map((t) => ({
      id: t.id,
      eventName: t.eventName,
      venue: t.venue,
      city: t.city,
      eventDate: t.eventDate,
      platform: t.platform,
      seat: t.seat,
      row: t.row,
      block: t.block,
      purchaserName: t.purchaserName,
      notes: t.notes,
      barcodeLastDigits: t.barcodeLastDigits,
      barcodeType: t.barcodeType,
      detectedDuplicate: t.detectedDuplicate,
      duplicateCount: t.duplicateCount,
      createdAt: t.createdAt,
      // Jamais les hashes bruts dans l'export utilisateur (optionnel: les inclure)
      hasBarcodeHash: Boolean(t.barcodeHash),
    })),
    watches: watches.map((w) => ({
      id: w.id,
      active: w.active,
      eventName: w.sighting?.eventName,
      createdAt: w.createdAt,
    })),
    loginAttempts: user.loginAttempts.map((a) => ({
      success: a.success,
      ip: a.ip,
      createdAt: a.createdAt,
    })),
    auditLogs: user.auditLogs.map((a) => ({
      action: a.action,
      createdAt: a.createdAt,
      meta: a.meta,
    })),
    pushSubscriptionCount: user.pushSubscriptions.length,
  };

  return new Response(JSON.stringify(exportPayload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="verifymyticket-export-${user.id}.json"`,
    },
  });
}

export async function POST(request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Origine non autorisée", 403);
  }

  const { session, error } = await requireAuth();
  if (error) return error;

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return jsonError("Compte introuvable", 404);

  const raw = generateToken();
  const tokenHash = hashToken(raw);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      deleteAccountToken: tokenHash,
      deleteAccountExpires: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  await sendAccountDeletionEmail(user.email, raw);
  await writeAuditLog({
    action: "ACCOUNT_DELETE_REQUEST",
    userId: user.id,
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent"),
  });

  return jsonOk({
    message:
      "Un email de confirmation a été envoyé. Le lien est valable 1 heure.",
  });
}
