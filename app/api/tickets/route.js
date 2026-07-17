import { prisma } from "@/lib/prisma";
import {
  assertSameOrigin,
  getClientIp,
  requireAuth,
} from "@/lib/auth";
import { hashBarcode, hashBarcodeSuffix, maskLastDigits, getRiskLevel } from "@/lib/hmac";
import { hashPersonName } from "@/lib/names";
import { hashSeatKey } from "@/lib/seat";
import { writeAuditLog } from "@/lib/audit";
import { ticketCreateSchema } from "@/lib/validations";
import {
  emptyToNull,
  formatDateFr,
  jsonError,
  jsonOk,
  jsonZodError,
  parseOptionalDate,
  parseOptionalPrice,
} from "@/lib/api";

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
    purchasePrice: ticket.purchasePrice != null ? Number(ticket.purchasePrice) : null,
    purchaseDate: ticket.purchaseDate,
    barcodeLastDigits: ticket.barcodeLastDigits,
    barcodeType: ticket.barcodeType,
    detectedDuplicate: ticket.detectedDuplicate,
    duplicateCount: ticket.duplicateCount,
    createdAt: ticket.createdAt,
  };
}

export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const tickets = await prisma.ticket.findMany({
    where: { ownerId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  const total = tickets.length;
  const duplicates = tickets.filter((t) => t.detectedDuplicate).length;

  return jsonOk({
    tickets: tickets.map(serializeTicket),
    stats: {
      total,
      duplicates,
      clean: total - duplicates,
    },
  });
}

export async function POST(request) {
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

  const parsed = ticketCreateSchema.safeParse(body);
  if (!parsed.success) return jsonZodError(parsed.error);

  const data = parsed.data;
  const rawBarcode = data.barcodeValue;
  const barcodeHash = hashBarcode(rawBarcode);
  const barcodeSuffixHash = hashBarcodeSuffix(rawBarcode, 4);
  const barcodeLastDigits = maskLastDigits(rawBarcode);
  // Do not retain raw barcode beyond this point
  data.barcodeValue = undefined;

  const existingSameOwner = await prisma.ticket.findUnique({
    where: {
      barcodeHash_ownerId: {
        barcodeHash,
        ownerId: session.userId,
      },
    },
  });
  if (existingSameOwner) {
    return jsonError("Vous avez déjà enregistré ce billet", 409);
  }

  const otherTickets = await prisma.ticket.findMany({
    where: {
      barcodeHash,
      NOT: { ownerId: session.userId },
    },
    orderBy: { createdAt: "asc" },
    select: {
      createdAt: true,
      platform: true,
      eventName: true,
    },
  });

  const duplicateCount = otherTickets.length;
  const detectedDuplicate = duplicateCount > 0;
  const risk = getRiskLevel(duplicateCount);
  const first = otherTickets[0] || null;

  const ticket = await prisma.ticket.create({
    data: {
      category: data.category,
      eventName: data.eventName,
      venue: emptyToNull(data.venue),
      city: emptyToNull(data.city),
      eventDate: parseOptionalDate(data.eventDate),
      organizer: emptyToNull(data.organizer),
      platform: data.platform,
      orderNumber: emptyToNull(data.orderNumber),
      seat: emptyToNull(data.seat),
      row: emptyToNull(data.row),
      block: emptyToNull(data.block),
      seatKeyHash: hashSeatKey({
        block: data.block,
        row: data.row,
        seat: data.seat,
      }),
      ticketCategory: emptyToNull(data.ticketCategory),
      purchaserName: emptyToNull(data.purchaserName),
      purchaserNameHash: data.purchaserName
        ? hashPersonName(data.purchaserName)
        : null,
      purchasePrice: parseOptionalPrice(data.purchasePrice),
      purchaseDate: parseOptionalDate(data.purchaseDate),
      barcodeHash,
      barcodeSuffixHash,
      barcodeLastDigits,
      barcodeType: data.barcodeType,
      externalEventId: emptyToNull(data.externalEventId),
      detectedDuplicate,
      duplicateCount,
      ownerId: session.userId,
    },
  });

  // Sync duplicate flags for all tickets sharing this hash
  const totalWithHash = await prisma.ticket.count({ where: { barcodeHash } });
  if (totalWithHash > 1) {
    const others = totalWithHash - 1;
    await prisma.ticket.updateMany({
      where: { barcodeHash },
      data: {
        detectedDuplicate: true,
        duplicateCount: others,
      },
    });
  }

  await writeAuditLog({
    action: "TICKET_CREATE",
    userId: session.userId,
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent"),
    meta: {
      ticketId: ticket.id,
      detectedDuplicate,
      duplicateCount,
    },
  });

  const warning = detectedDuplicate
    ? {
        title: "Attention",
        message:
          "Ce billet a déjà été enregistré par un autre utilisateur. Cela ne signifie pas forcément qu'il est faux, mais il est fortement recommandé de contacter le vendeur.",
        firstRegistration: first
          ? {
              date: formatDateFr(first.createdAt),
              platform: first.platform,
              eventName: first.eventName,
            }
          : null,
      }
    : null;

  return jsonOk(
    {
      ticket: serializeTicket(ticket),
      risk,
      duplicateCount,
      warning,
    },
    201
  );
}
