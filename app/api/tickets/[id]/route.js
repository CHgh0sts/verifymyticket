import { prisma } from "@/lib/prisma";
import { assertSameOrigin, getClientIp, requireAuth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { jsonError, jsonOk, jsonZodError, parseOptionalDate } from "@/lib/api";
import { ticketUpdateSchema } from "@/lib/validations";
import { hashPersonName } from "@/lib/names";
import { hashSeatKey } from "@/lib/seat";

function serializeTicket(ticket) {
  return {
    id: ticket.id,
    category: ticket.category,
    eventName: ticket.eventName,
    venue: ticket.venue,
    city: ticket.city,
    eventDate: ticket.eventDate,
    organizer: ticket.organizer,
    platform: ticket.platform,
    orderNumber: ticket.orderNumber,
    seat: ticket.seat,
    row: ticket.row,
    block: ticket.block,
    ticketCategory: ticket.ticketCategory,
    purchaserName: ticket.purchaserName,
    purchasePrice:
      ticket.purchasePrice != null ? Number(ticket.purchasePrice) : null,
    purchaseDate: ticket.purchaseDate,
    notes: ticket.notes,
    barcodeLastDigits: ticket.barcodeLastDigits,
    barcodeType: ticket.barcodeType,
    detectedDuplicate: ticket.detectedDuplicate,
    duplicateCount: ticket.duplicateCount,
    externalEventId: ticket.externalEventId,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  };
}

export async function GET(_request, { params }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const ticket = await prisma.ticket.findFirst({
    where: { id, ownerId: session.userId },
  });

  if (!ticket) return jsonError("Billet introuvable", 404);

  const relatedSightings = await prisma.codeSighting.findMany({
    where: {
      OR: [
        ticket.barcodeHash ? { barcodeHash: ticket.barcodeHash } : undefined,
        ticket.barcodeSuffixHash
          ? { barcodeSuffixHash: ticket.barcodeSuffixHash }
          : undefined,
        ticket.purchaserNameHash
          ? { purchaserNameHash: ticket.purchaserNameHash }
          : undefined,
        ticket.seatKeyHash ? { seatKeyHash: ticket.seatKeyHash } : undefined,
      ].filter(Boolean),
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      mode: true,
      eventName: true,
      venue: true,
      city: true,
      eventDate: true,
      purchaseStatus: true,
      checkCount: true,
      createdAt: true,
    },
  });

  return jsonOk({
    ticket: serializeTicket(ticket),
    relatedSightings,
  });
}

export async function PATCH(request, { params }) {
  if (!assertSameOrigin(request)) {
    return jsonError("Origine non autorisée", 403);
  }

  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const ticket = await prisma.ticket.findFirst({
    where: { id, ownerId: session.userId },
  });
  if (!ticket) return jsonError("Billet introuvable", 404);

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON invalide");
  }

  const parsed = ticketUpdateSchema.safeParse(body);
  if (!parsed.success) return jsonZodError(parsed.error);

  const data = parsed.data;
  const update = {};

  for (const key of [
    "eventName",
    "venue",
    "city",
    "organizer",
    "platform",
    "orderNumber",
    "seat",
    "row",
    "block",
    "ticketCategory",
    "purchaserName",
    "notes",
    "category",
  ]) {
    if (data[key] !== undefined) update[key] = data[key];
  }

  if (data.eventDate !== undefined) {
    update.eventDate = parseOptionalDate(data.eventDate);
  }
  if (data.purchaseDate !== undefined) {
    update.purchaseDate = parseOptionalDate(data.purchaseDate);
  }
  if (data.purchasePrice !== undefined) {
    update.purchasePrice =
      data.purchasePrice === null || data.purchasePrice === ""
        ? null
        : Number(data.purchasePrice);
  }

  if (data.purchaserName !== undefined) {
    update.purchaserNameHash = data.purchaserName
      ? hashPersonName(data.purchaserName)
      : null;
  }

  if (
    data.seat !== undefined ||
    data.row !== undefined ||
    data.block !== undefined
  ) {
    update.seatKeyHash = hashSeatKey({
      block: data.block !== undefined ? data.block : ticket.block,
      row: data.row !== undefined ? data.row : ticket.row,
      seat: data.seat !== undefined ? data.seat : ticket.seat,
    });
  }

  const updated = await prisma.ticket.update({
    where: { id: ticket.id },
    data: update,
  });

  await writeAuditLog({
    action: "TICKET_UPDATE",
    userId: session.userId,
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent"),
    meta: { ticketId: id, fields: Object.keys(update) },
  });

  return jsonOk({ ticket: serializeTicket(updated) });
}

export async function DELETE(request, { params }) {
  if (!assertSameOrigin(request)) {
    return jsonError("Origine non autorisée", 403);
  }

  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const ticket = await prisma.ticket.findFirst({
    where: { id, ownerId: session.userId },
  });

  if (!ticket) return jsonError("Billet introuvable", 404);

  await prisma.ticket.delete({ where: { id: ticket.id } });

  await writeAuditLog({
    action: "TICKET_DELETE",
    userId: session.userId,
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent"),
    meta: { ticketId: id },
  });

  return jsonOk({ message: "Billet supprimé" });
}
