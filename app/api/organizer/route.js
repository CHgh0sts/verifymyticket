import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin, getClientIp, requireAuth } from "@/lib/auth";
import { hashBarcode, hashBarcodeSuffix } from "@/lib/hmac";
import { writeAuditLog } from "@/lib/audit";
import { jsonError, jsonOk } from "@/lib/api";

function makeApiKey() {
  const raw = `vmt_${randomBytes(24).toString("base64url")}`;
  const keyHash = createHash("sha256").update(raw).digest("hex");
  return { raw, keyHash, keyPrefix: raw.slice(0, 12) };
}

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });

  const [keys, batches] = await Promise.all([
    prisma.organizerApiKey.findMany({
      where: { userId: session.userId, revokedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        createdAt: true,
      },
    }),
    prisma.organizerBatch.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return jsonOk({
    role: user?.role || "user",
    isOrganizer: user?.role === "organizer",
    keys,
    batches,
  });
}

export async function POST(request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Origine non autorisee", 403);
  }
  const { session, error } = await requireAuth();
  if (error) return error;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON invalide");
  }

  const action = body.action;

  if (action === "enable") {
    await prisma.user.update({
      where: { id: session.userId },
      data: { role: "organizer" },
    });
    await writeAuditLog({
      action: "ORGANIZER_ENABLE",
      userId: session.userId,
      ip: getClientIp(request),
    });
    return jsonOk({ message: "Mode organisateur active", isOrganizer: true });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || user.role !== "organizer") {
    return jsonError("Acces organisateur requis", 403);
  }

  if (action === "createKey") {
    const { raw, keyHash, keyPrefix } = makeApiKey();
    await prisma.organizerApiKey.create({
      data: {
        userId: session.userId,
        name: String(body.name || "Cle API").slice(0, 80),
        keyHash,
        keyPrefix,
      },
    });
    return jsonOk({
      message: "Cle creee — copiez-la maintenant, elle ne sera plus affichee.",
      apiKey: raw,
      keyPrefix,
    });
  }

  if (action === "revokeKey") {
    await prisma.organizerApiKey.updateMany({
      where: { id: body.keyId, userId: session.userId },
      data: { revokedAt: new Date() },
    });
    return jsonOk({ message: "Cle revoquee" });
  }

  if (action === "uploadBatch") {
    const eventName = String(body.eventName || "").trim();
    if (!eventName) return jsonError("eventName requis");
    const codes = Array.isArray(body.codes) ? body.codes : [];
    if (codes.length === 0) return jsonError("codes[] requis");
    if (codes.length > 5000) return jsonError("Maximum 5000 codes par lot");

    const batch = await prisma.organizerBatch.create({
      data: {
        userId: session.userId,
        eventName,
        venue: body.venue || null,
        city: body.city || null,
        eventDate: body.eventDate ? new Date(body.eventDate) : null,
        externalId: body.externalId || null,
        itemCount: codes.length,
        items: {
          create: codes.map((c) => {
            const raw = String(c).trim();
            return {
              barcodeHash: hashBarcode(raw),
              barcodeSuffixHash: hashBarcodeSuffix(raw, 4),
              seatLabel: null,
            };
          }),
        },
      },
    });

    await writeAuditLog({
      action: "ORGANIZER_BATCH_UPLOAD",
      userId: session.userId,
      ip: getClientIp(request),
      meta: { batchId: batch.id, count: codes.length },
    });

    return jsonOk({
      message: `Lot enregistre (${codes.length} hashes)`,
      batchId: batch.id,
    });
  }

  return jsonError("Action inconnue");
}
