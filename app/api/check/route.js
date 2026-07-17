import { prisma } from "@/lib/prisma";
import { assertSameOrigin, getClientIp, getSession } from "@/lib/auth";
import { hashBarcode, hashBarcodeSuffix, sameDayRange } from "@/lib/hmac";
import { hashPersonName, normalizePersonName } from "@/lib/names";
import { hashSeatKey } from "@/lib/seat";
import { verifyCaptcha } from "@/lib/captcha";
import { rateLimitCheck } from "@/lib/rate-limit";
import { writeAuditLog } from "@/lib/audit";
import { notifySightingWatchers, upsertCheckWatch } from "@/lib/check-watch";
import { publicCheckSchema } from "@/lib/validations";
import { jsonError, jsonOk, jsonZodError, parseOptionalDate } from "@/lib/api";

const STATUS_RANK = { watching: 1, owned: 2, claimed: 2 };

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

function strongestStatus(statuses) {
  let best = null;
  for (const s of statuses) {
    if (!s) continue;
    if (!best || (STATUS_RANK[s] || 0) > (STATUS_RANK[best] || 0)) best = s;
  }
  return best;
}

function mergePurchaseStatus(existing, incoming) {
  if (!existing) return incoming;
  if ((STATUS_RANK[incoming] || 0) >= (STATUS_RANK[existing] || 0)) return incoming;
  return existing;
}

async function countScopedMatches(where) {
  const [tickets, sightings] = await Promise.all([
    prisma.ticket.findMany({
      where,
      select: { id: true, createdAt: true },
      orderBy: { createdAt: "asc" },
      take: 20,
    }),
    prisma.codeSighting.findMany({
      where,
      select: {
        id: true,
        createdAt: true,
        checkCount: true,
        purchaseStatus: true,
      },
      orderBy: { createdAt: "asc" },
      take: 20,
    }),
  ]);
  return {
    tickets,
    sightings,
    count: tickets.length + sightings.length,
    hasRegisteredTicket: tickets.length > 0,
    priorStatus: strongestStatus(sightings.map((s) => s.purchaseStatus)),
  };
}

async function findBarcodeMatches({ mode, barcodeHash, suffixHash, scope }) {
  if (mode === "last4") {
    if (!scope || !suffixHash) {
      return { count: 0, hasRegisteredTicket: false, priorStatus: null };
    }
    return countScopedMatches({ barcodeSuffixHash: suffixHash, ...scope });
  }

  const tickets = barcodeHash
    ? await prisma.ticket.findMany({
        where: { barcodeHash },
        select: { id: true },
        take: 20,
      })
    : [];

  let sightings = barcodeHash
    ? await prisma.codeSighting.findMany({
        where: { barcodeHash, ...(scope || {}) },
        select: { id: true, purchaseStatus: true },
        take: 20,
      })
    : [];

  if (barcodeHash && sightings.length === 0) {
    sightings = await prisma.codeSighting.findMany({
      where: { barcodeHash },
      select: { id: true, purchaseStatus: true },
      take: 20,
    });
  }

  return {
    count: tickets.length + sightings.length,
    hasRegisteredTicket: tickets.length > 0,
    priorStatus: strongestStatus(sightings.map((s) => s.purchaseStatus)),
  };
}

async function findNameMatches({ purchaserNameHash, purchaserName, scope }) {
  if (!scope) return { count: 0, hasRegisteredTicket: false, priorStatus: null };

  if (purchaserNameHash) {
    const hashed = await countScopedMatches({ purchaserNameHash, ...scope });
    if (hashed.count > 0) return hashed;
  }

  if (!purchaserName) return { count: 0, hasRegisteredTicket: false, priorStatus: null };
  const key = normalizePersonName(purchaserName);
  if (!key) return { count: 0, hasRegisteredTicket: false, priorStatus: null };

  const withNames = await prisma.ticket.findMany({
    where: {
      AND: [
        { purchaserName: { not: null } },
        { OR: [{ purchaserNameHash: null }, { purchaserNameHash: "" }] },
        scope,
      ],
    },
    select: { id: true, purchaserName: true },
    take: 100,
  });

  const tickets = withNames.filter(
    (t) => normalizePersonName(t.purchaserName) === key
  );
  return {
    count: tickets.length,
    hasRegisteredTicket: tickets.length > 0,
    priorStatus: null,
  };
}

async function findSeatMatches({ seatKeyHash, scope }) {
  if (!seatKeyHash || !scope) {
    return { count: 0, hasRegisteredTicket: false, priorStatus: null };
  }
  return countScopedMatches({ seatKeyHash, ...scope });
}

async function saveSighting({
  mode,
  barcodeHash,
  suffixHash,
  purchaserNameHash,
  seatKeyHash,
  purchaseStatus,
  event,
  ip,
}) {
  if (!event?.id && !event?.name && !event?.attraction) return null;

  const fields = eventFieldsFromPayload(event);
  const scope = buildEventScope(event);

  let identity;
  if (mode === "name" && purchaserNameHash) {
    identity = { mode: "name", purchaserNameHash, ...(scope || { eventName: fields.eventName }) };
  } else if (mode === "seat" && seatKeyHash) {
    identity = { mode: "seat", seatKeyHash, ...(scope || { eventName: fields.eventName }) };
  } else if (mode === "last4" && suffixHash) {
    identity = {
      barcodeSuffixHash: suffixHash,
      mode: "last4",
      ...(scope || { eventName: fields.eventName }),
    };
  } else if (barcodeHash) {
    identity = {
      barcodeHash,
      ...(scope || { eventName: fields.eventName }),
    };
  } else {
    return null;
  }

  const existing = await prisma.codeSighting.findFirst({
    where: identity,
    orderBy: { createdAt: "asc" },
  });

  if (existing) {
    return prisma.codeSighting.update({
      where: { id: existing.id },
      data: {
        checkCount: { increment: 1 },
        ip: ip || existing.ip,
        venue: existing.venue || fields.venue,
        city: existing.city || fields.city,
        eventDate: existing.eventDate || fields.eventDate,
        externalEventId: existing.externalEventId || fields.externalEventId,
        barcodeHash: existing.barcodeHash || barcodeHash || null,
        barcodeSuffixHash: existing.barcodeSuffixHash || suffixHash || null,
        purchaserNameHash: existing.purchaserNameHash || purchaserNameHash || null,
        seatKeyHash: existing.seatKeyHash || seatKeyHash || null,
        purchaseStatus: mergePurchaseStatus(existing.purchaseStatus, purchaseStatus),
      },
    });
  }

  return prisma.codeSighting.create({
    data: {
      mode,
      barcodeHash: barcodeHash || null,
      barcodeSuffixHash: suffixHash || null,
      purchaserNameHash: purchaserNameHash || null,
      seatKeyHash: seatKeyHash || null,
      purchaseStatus,
      ...fields,
      checkCount: 1,
      ip: ip || null,
    },
  });
}

function alertFromPrior({ hasRegisteredTicket, priorStatus, checkType, mode }) {
  if (hasRegisteredTicket || priorStatus === "owned" || priorStatus === "claimed") {
    const base =
      checkType === "name"
        ? "Ce nom est déjà lié à un billet marqué comme acheté / enregistré pour cet événement."
        : checkType === "seat"
          ? "Cet emplacement est déjà lié à un billet marqué comme acheté / enregistré pour cet événement."
          : mode === "last4"
            ? "Ces 4 caractères correspondent déjà à un billet marqué comme acheté / enregistré pour cet événement."
            : "Ce code correspond déjà à un billet marqué comme acheté / enregistré pour cet événement.";

    return {
      status: checkType === "barcode" && mode === "full" ? "duplicate" : checkType === "barcode" ? "doubt" : "suspicion",
      severity: "purchased",
      message: base,
      hint: "Risque élevé de double revente : quelqu'un a déjà confirmé l'achat ou enregistré ce billet.",
    };
  }

  if (priorStatus === "watching") {
    const base =
      checkType === "name"
        ? "Ce nom a déjà été vérifié avant un achat (sans confirmation d'achat)."
        : checkType === "seat"
          ? "Cet emplacement a déjà été vérifié avant un achat (sans confirmation d'achat)."
          : mode === "last4"
            ? "Ces 4 caractères ont déjà été vérifiés avant un achat (sans confirmation d'achat)."
            : "Ce code a déjà été vérifié avant un achat (sans confirmation d'achat).";

    return {
      status: "suspicion",
      severity: "watching",
      message: base,
      hint: "Quelqu'un d'autre s'intéresse peut-être au même billet. Demandez plus de preuves au vendeur.",
    };
  }

  return {
    status: checkType === "barcode" && mode === "full" ? "duplicate" : checkType === "barcode" && mode === "last4" ? "doubt" : "suspicion",
    severity: "unknown",
    message: "Correspondance déjà connue pour cet événement.",
    hint: undefined,
  };
}

function responseFor({
  checkType,
  mode,
  found,
  matchCount,
  hasRegisteredTicket,
  priorStatus,
  intent,
  sightingId,
  event,
}) {
  if (found) {
    const alert = alertFromPrior({
      hasRegisteredTicket,
      priorStatus,
      checkType,
      mode,
    });
    return {
      ...alert,
      checkType,
      mode: checkType === "barcode" ? mode : undefined,
      matchCount,
      intent,
      priorStatus: hasRegisteredTicket ? "owned" : priorStatus,
      askPurchaseFollowUp: false,
      sightingId,
      saved: true,
      event,
    };
  }

  const askPurchaseFollowUp = intent === "precheck";

  if (checkType === "name") {
    return {
      status: "clean",
      checkType,
      matchCount: 0,
      intent,
      askPurchaseFollowUp,
      sightingId,
      saved: true,
      message: askPurchaseFollowUp
        ? "Aucun billet avec ce nom trouvé pour cet événement."
        : "Aucun billet avec ce nom trouvé. Enregistré comme billet déjà acheté.",
      event,
    };
  }

  if (checkType === "seat") {
    return {
      status: "clean",
      checkType,
      matchCount: 0,
      intent,
      askPurchaseFollowUp,
      sightingId,
      saved: true,
      message: askPurchaseFollowUp
        ? "Aucun billet avec cet emplacement trouvé pour cet événement."
        : "Aucun billet avec cet emplacement trouvé. Enregistré comme billet déjà acheté.",
      event,
    };
  }

  if (mode === "last4") {
    return {
      status: "clean",
      checkType,
      mode: "last4",
      matchCount: 0,
      intent,
      askPurchaseFollowUp,
      sightingId,
      saved: true,
      message: askPurchaseFollowUp
        ? "Aucun billet avec ces 4 caractères trouvé pour cet événement."
        : "Aucun billet avec ces 4 caractères trouvé. Enregistré comme billet déjà acheté.",
      event,
    };
  }

  return {
    status: "clean",
    checkType,
    mode: "full",
    matchCount: 0,
    intent,
    askPurchaseFollowUp,
    sightingId,
    saved: true,
    message: askPurchaseFollowUp
      ? "Aucun doublon détecté pour cet événement."
      : "Aucun doublon détecté. Enregistré comme billet déjà acheté.",
    event,
  };
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

  const intent = parsed.data.intent || "precheck";
  const checkType = parsed.data.checkType || "barcode";
  const barcodeMode = parsed.data.mode || "full";
  const event = parsed.data.event || null;
  const purchaseStatus = intent === "owned" ? "owned" : "watching";

  const session = await getSession();
  const alertEmail = session?.email
    ? String(session.email).toLowerCase().trim()
    : parsed.data.alertEmail
      ? String(parsed.data.alertEmail).toLowerCase().trim()
      : null;

  if (!session && !alertEmail) {
    return jsonError(
      "Connectez-vous ou indiquez un email pour être alerté des mises à jour",
      400
    );
  }

  if (!event?.id && !event?.name && !event?.attraction) {
    return jsonError("Sélectionnez un événement avant de vérifier", 400);
  }

  const scope = buildEventScope(event);

  let mode = checkType;
  let barcodeHash = null;
  let suffixHash = null;
  let purchaserNameHash = null;
  let seatKeyHash = null;
  let checkLogHash = "none";
  let matches = { count: 0, hasRegisteredTicket: false, priorStatus: null };

  if (checkType === "name") {
    mode = "name";
    purchaserNameHash = hashPersonName(parsed.data.purchaserName);
    checkLogHash = purchaserNameHash || "name";
    matches = await findNameMatches({
      purchaserNameHash,
      purchaserName: parsed.data.purchaserName,
      scope,
    });
  } else if (checkType === "seat") {
    mode = "seat";
    seatKeyHash = hashSeatKey({
      block: parsed.data.block,
      row: parsed.data.row,
      seat: parsed.data.seat,
    });
    if (!seatKeyHash) {
      return jsonError("Emplacement invalide", 400);
    }
    checkLogHash = seatKeyHash;
    matches = await findSeatMatches({ seatKeyHash, scope });
  } else {
    mode = barcodeMode === "last4" ? "last4" : "full";
    const raw = String(parsed.data.barcodeValue || "").trim();
    suffixHash = hashBarcodeSuffix(raw, 4);
    barcodeHash = barcodeMode === "full" ? hashBarcode(raw) : null;
    checkLogHash = barcodeHash || suffixHash;
    matches = await findBarcodeMatches({
      mode: barcodeMode,
      barcodeHash,
      suffixHash,
      scope,
    });
  }

  const found = matches.count > 0;

  const sighting = await saveSighting({
    mode,
    barcodeHash,
    suffixHash,
    purchaserNameHash,
    seatKeyHash,
    purchaseStatus,
    event,
    ip,
  });

  if (sighting?.id && alertEmail) {
    await upsertCheckWatch({
      sightingId: sighting.id,
      email: alertEmail,
      userId: session?.userId || null,
    });
  }

  if (found && sighting?.id) {
    await notifySightingWatchers({
      sightingId: sighting.id,
      excludeEmail: alertEmail,
      reason: "Quelqu'un d'autre vient de vérifier le même billet.",
      purchaseStatus,
    });
  }

  await prisma.checkLog.create({
    data: {
      barcodeHash: checkLogHash,
      found,
      ip,
    },
  });

  await writeAuditLog({
    action: `PUBLIC_CHECK_${checkType.toUpperCase()}`,
    ip,
    userAgent: request.headers.get("user-agent"),
    userId: session?.userId || null,
    meta: {
      checkType,
      mode,
      intent,
      purchaseStatus,
      found,
      matchCount: matches.count,
      priorStatus: matches.priorStatus,
      sightingId: sighting?.id || null,
      alertEmail: alertEmail || null,
      eventId: event?.id || null,
      eventName: event?.name || event?.attraction || null,
    },
  });

  return jsonOk(
    responseFor({
      checkType,
      mode: barcodeMode,
      found,
      matchCount: matches.count,
      hasRegisteredTicket: matches.hasRegisteredTicket,
      priorStatus: matches.priorStatus,
      intent,
      sightingId: sighting?.id || null,
      event,
    })
  );
}
