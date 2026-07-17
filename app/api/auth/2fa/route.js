import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin, requireAuth } from "@/lib/auth";
import { generateTotpSecret, getTotpUri, verifyTotpCode } from "@/lib/totp";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { totpEnabled: true },
  });
  return jsonOk({ enabled: Boolean(user?.totpEnabled) });
}

export async function POST(request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Origine non autorisée", 403);
  }
  const { session, error } = await requireAuth();
  if (error) return error;

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return jsonError("Compte introuvable", 404);
  if (user.totpEnabled) return jsonError("2FA déjà activée");

  const secret = generateTotpSecret();
  await prisma.user.update({
    where: { id: user.id },
    data: { totpSecret: secret, totpEnabled: false },
  });

  const uri = getTotpUri(secret, user.email);
  const qrDataUrl = await QRCode.toDataURL(uri);

  return jsonOk({ secret, uri, qrDataUrl });
}

export async function PUT(request) {
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

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user?.totpSecret) return jsonError("Configurez d’abord la 2FA");

  if (!verifyTotpCode(user.totpSecret, body.code)) {
    return jsonError("Code invalide", 400);
  }

  if (body.action === "disable") {
    await prisma.user.update({
      where: { id: user.id },
      data: { totpEnabled: false, totpSecret: null },
    });
    return jsonOk({ message: "2FA désactivée", enabled: false });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { totpEnabled: true },
  });
  return jsonOk({ message: "2FA activée", enabled: true });
}
