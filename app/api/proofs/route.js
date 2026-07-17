import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { assertSameOrigin, getSession } from "@/lib/auth";
import { appUrl } from "@/lib/email";
import { jsonError, jsonOk } from "@/lib/api";
import { rateLimitCheck } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/auth";

const TTL_MS = 48 * 60 * 60 * 1000;

export async function POST(request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Origine non autorisée", 403);
  }

  const ip = getClientIp(request);
  const rl = await rateLimitCheck(ip);
  if (!rl.success) {
    return jsonError("Trop de demandes. Réessayez plus tard.", 429);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON invalide");
  }

  const sightingId = body?.sightingId ? String(body.sightingId) : null;
  if (!sightingId) return jsonError("sightingId requis");

  const sighting = await prisma.codeSighting.findUnique({
    where: { id: sightingId },
    select: {
      id: true,
      eventName: true,
      venue: true,
      city: true,
      eventDate: true,
      purchaseStatus: true,
      mode: true,
      checkCount: true,
    },
  });
  if (!sighting) return jsonError("Vérification introuvable", 404);

  const session = await getSession();
  const token = randomBytes(16).toString("base64url");

  const payload = {
    status: body.status || null,
    message: body.message || null,
    risk: body.risk || null,
    matchCount: body.matchCount ?? null,
    checkType: body.checkType || sighting.mode,
    event: {
      name: sighting.eventName,
      venue: sighting.venue,
      city: sighting.city,
      date: sighting.eventDate,
      ...(body.event || {}),
    },
    purchaseStatus: sighting.purchaseStatus,
    checkCount: sighting.checkCount,
    createdAt: new Date().toISOString(),
  };

  const proof = await prisma.checkProof.create({
    data: {
      token,
      sightingId: sighting.id,
      userId: session?.userId || null,
      payload,
      expiresAt: new Date(Date.now() + TTL_MS),
    },
  });

  const url = `${appUrl()}/proof/${proof.token}`;
  return jsonOk({ token: proof.token, url, expiresAt: proof.expiresAt });
}
