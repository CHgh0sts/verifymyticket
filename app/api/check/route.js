import { prisma } from "@/lib/prisma";
import { assertSameOrigin, getClientIp } from "@/lib/auth";
import { hashBarcode, hashBarcodeSuffix, sameDayRange } from "@/lib/hmac";
import { verifyCaptcha } from "@/lib/captcha";
import { rateLimitCheck } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";
import { publicCheckSchema } from "@/lib/validations";
import { jsonError, jsonOk, jsonZodError, parseOptionalDate } from "@/lib/api";

function buildEventScope(event) {
  if (!event) return null;

  const range = sameDayRange(event.date);
  const name = (event.attraction || event.name || "").trim();
  const venue = (event.venue || "").trim();

  const softAnd = [];
  if (name) {
    softAnd.push({
      OR: [{ eventName: { contains: name } }, { eventName: name }],
    });
  }
  if (venue) softAnd.push({ venue });
  if (range) softAnd.push({ eventDate: { gte: range.start, lt: range.end } });

  const soft = softAnd.length > 0 ? { AND: softAnd } : null;

  if (event.id && soft) {
    return { OR: [{ externalEventId: event.id }, soft] };
  }
  if (event.id) return { externalEventId: event.id };
  return soft;
}

function eventFieldsFromPayload(event) {
  const name = (event?.attraction || event?.name || "Événement inconnu").trim();
  return {
    externalEventId: event?.id || null,
    eventName: name,
    venue: event?.venue || null,
    city: event?.city || null,
    eventDate: parseOptionalDate(event?.date),
  };
}

async function findExistingMatches({ mode, barcodeHash, suffixHash, scope }) {
  if (mode === "last4") {
    if (!scope) return { tickets: [], sightings: [] };

    const [tickets, sightings] = await Promise.all([
      prisma.ticket.findMany({
        where: { barcodeSuffixHash: suffixHash, ...scope },
        select: { id: true, createdAt: true, eventName: true, venue: true },
        orderBy: { createdAt: "asc" },
        take: 20,
      }),
      prisma.codeSighting.findMany({
        where: { barcodeSuffixHash: suffixHash, ...scope },
        select: { id: true, createdAt: true, eventName: true, venue: true, checkCount: true },
        orderBy: { createdAt: "asc" },
        take: 20,
      }),
    ]);
    return { tickets, sightings };
  }

  const [tickets, sightings] = await Promise.all([
    prisma.ticket.findMany({
      where: { barcodeHash },
      select: { id: true, createdAt: true, eventName: true, venue: true },
      orderBy: { createdAt: "asc" },
      take: 20,
    }),
    prisma.codeSighting.findMany({
      where: {
        barcodeHash,
        ...(scope || {}),
      },
      select: { id: true, createdAt: true, eventName: true, venue: true, checkCount: true },
      orderBy: { createdAt: "asc" },
      take: 20,
    }),
  ]);
  return { tickets, sightings };
}

/**
 * Enregistre (ou met à jour) le code vérifié pour cet événement précis.
 * Hash uniquement — jamais la valeur brute.
 */
async function saveSightingForEvent({
  mode,
  barcodeHash,
  suffixHash,
  event,
  ip,
}) {
  if (!event?.id && !event?.name && !event?.attraction) {
    return null;
  }

  const fields = eventFieldsFromPayload(event);
  const scope = buildEventScope(event);

  const existingWhere =
    mode === "full" && barcodeHash
      ? {
          barcodeHash,
          ...(scope || { eventName: fields.eventName }),
        }
      : {
          barcodeSuffixHash: suffixHash,
          mode: "last4",
          ...(scope || { eventName: fields.eventName }),
        };

  const existing = await prisma.codeSighting.findFirst({
    where: existingWhere,
    orderBy: { createdAt: "asc" },
  });

  if (existing) {
    return prisma.codeSighting.update({
      where: { id: existing.id },
      data: {
        checkCount: { increment: 1 },
        ip: ip || existing.ip,
        // Enrichir si champs manquants
        venue: existing.venue || fields.venue,
        city: existing.city || fields.city,
        eventDate: existing.eventDate || fields.eventDate,
        externalEventId: existing.externalEventId || fields.externalEventId,
        barcodeHash: existing.barcodeHash || barcodeHash || null,
      },
    });
  }

  return prisma.codeSighting.create({
    data: {
      mode,
      barcodeHash: mode === "full" ? barcodeHash : null,
      barcodeSuffixHash: suffixHash,
      ...fields,
      checkCount: 1,
      ip: ip || null,
    },
  });
}

export async function POST(request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Origine non autorisée", 403);
  }

  const ip = getClientIp(request);
  const rl = await rateLimitCheck(ip);
  if (!rl.success) {
    return jsonError("Trop de vérifications. Réessayez plus tard.", 429);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON invalide");
  }

  const parsed = publicCheckSchema.safeParse(body);
  if (!parsed.success) return jsonZodError(parsed.error);

  const captcha = await verifyCaptcha(parsed.data.captchaToken, ip);
  if (!captcha.success) {
    return jsonError(captcha.error || "CAPTCHA invalide", 400);
  }

  const mode = parsed.data.mode || "full";
  const raw = String(parsed.data.barcodeValue).trim();
  const event = parsed.data.event || null;

  if (!event?.id && !event?.name && !event?.attraction) {
    return jsonError("Sélectionnez un événement avant de vérifier", 400);
  }

  const scope = buildEventScope(event);
  const suffixHash = hashBarcodeSuffix(raw, 4);
  const barcodeHash = mode === "full" ? hashBarcode(raw) : null;
  const checkHash = barcodeHash || suffixHash;

  // 1) Chercher d'abord les occurrences déjà connues (tickets + vérifs publiques)
  const { tickets, sightings } = await findExistingMatches({
    mode,
    barcodeHash,
    suffixHash,
    scope: mode === "last4" ? scope : scope,
  });

  // Pour le mode full, les tickets sont globaux ; les sightings sont scopés événement.
  // Si sightings vides à cause du scope trop strict, on cherche aussi le hash global en sighting.
  let allSightings = sightings;
  if (mode === "full" && barcodeHash && sightings.length === 0) {
    allSightings = await prisma.codeSighting.findMany({
      where: { barcodeHash },
      select: { id: true, createdAt: true, eventName: true, venue: true, checkCount: true },
      orderBy: { createdAt: "asc" },
      take: 20,
    });
  }

  const priorMatchCount = tickets.length + allSightings.length;
  const found = priorMatchCount > 0;

  // 2) Toujours enregistrer ce code pour cet événement précis
  const sighting = await saveSightingForEvent({
    mode,
    barcodeHash,
    suffixHash,
    event,
    ip,
  });

  await prisma.checkLog.create({
    data: {
      barcodeHash: checkHash,
      found,
      ip,
    },
  });

  await writeAuditLog({
    action: mode === "last4" ? "PUBLIC_CHECK_LAST4" : "PUBLIC_CHECK",
    ip,
    userAgent: request.headers.get("user-agent"),
    meta: {
      found,
      priorMatchCount,
      mode,
      sightingId: sighting?.id || null,
      eventId: event?.id || null,
      eventName: event?.name || event?.attraction || null,
      venue: event?.venue || null,
      dateLabel: event?.dateLabel || null,
    },
  });

  if (mode === "last4") {
    if (found) {
      return jsonOk({
        status: "doubt",
        mode: "last4",
        matchCount: priorMatchCount,
        saved: true,
        message:
          "Doute de revente en double : ces 4 caractères correspondent déjà à un billet ou une vérification pour le même événement, la même date et le même lieu.",
        hint: "Ce n'est pas une preuve absolue. Demandez le code complet au vendeur si possible.",
        event,
      });
    }
    return jsonOk({
      status: "clean",
      mode: "last4",
      matchCount: 0,
      saved: true,
      message:
        "Aucun billet avec ces 4 caractères trouvé pour cet événement. La vérification a été enregistrée.",
      hint: "Cela ne garantit pas l'authenticité — seul le code complet permet une vérification forte.",
      event,
    });
  }

  if (found) {
    return jsonOk({
      status: "duplicate",
      mode: "full",
      matchCount: priorMatchCount,
      saved: true,
      message: "Billet déjà enregistré ou déjà vérifié pour cet événement",
      event,
    });
  }

  return jsonOk({
    status: "clean",
    mode: "full",
    matchCount: 0,
    saved: true,
    message: "Aucun doublon détecté. Le code a été enregistré pour cet événement.",
    event,
  });
}
