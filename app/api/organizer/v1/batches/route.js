import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { hashBarcode, hashBarcodeSuffix } from "@/lib/hmac";
import { jsonError, jsonOk } from "@/lib/api";
import { rateLimitCheck } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/auth";

async function authApiKey(request) {
  const header = request.headers.get("authorization") || "";
  const raw = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!raw.startsWith("vmt_")) return null;
  const keyHash = createHash("sha256").update(raw).digest("hex");
  const key = await prisma.organizerApiKey.findFirst({
    where: { keyHash, revokedAt: null },
  });
  if (!key) return null;
  await prisma.organizerApiKey.update({
    where: { id: key.id },
    data: { lastUsedAt: new Date() },
  });
  return key;
}

/**
 * POST /api/organizer/v1/batches
 * Authorization: Bearer vmt_...
 * Body: { eventName, venue?, city?, eventDate?, codes: string[] }
 */
export async function POST(request) {
  const ip = getClientIp(request);
  const rl = await rateLimitCheck(ip);
  if (!rl.success) return jsonError("Rate limit", 429);

  const key = await authApiKey(request);
  if (!key) return jsonError("Clé API invalide", 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON invalide");
  }

  const eventName = String(body.eventName || "").trim();
  const codes = Array.isArray(body.codes) ? body.codes : [];
  if (!eventName || codes.length === 0) {
    return jsonError("eventName et codes[] requis");
  }
  if (codes.length > 5000) return jsonError("Max 5000 codes");

  const batch = await prisma.organizerBatch.create({
    data: {
      userId: key.userId,
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
          };
        }),
      },
    },
  });

  return jsonOk({ batchId: batch.id, itemCount: codes.length }, 201);
}

/**
 * GET /api/organizer/v1/batches — stats doublons pour les lots de l'organisateur
 */
export async function GET(request) {
  const key = await authApiKey(request);
  if (!key) return jsonError("Clé API invalide", 401);

  const batches = await prisma.organizerBatch.findMany({
    where: { userId: key.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      items: { select: { barcodeHash: true }, take: 5000 },
    },
  });

  const stats = [];
  for (const batch of batches) {
    const hashes = batch.items.map((i) => i.barcodeHash);
    const ticketHits = await prisma.ticket.count({
      where: { barcodeHash: { in: hashes } },
    });
    const sightingHits = await prisma.codeSighting.count({
      where: { barcodeHash: { in: hashes } },
    });
    stats.push({
      id: batch.id,
      eventName: batch.eventName,
      itemCount: batch.itemCount,
      ticketMatches: ticketHits,
      sightingMatches: sightingHits,
      createdAt: batch.createdAt,
    });
  }

  return jsonOk({ batches: stats });
}
